import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { createHash } from 'crypto'
import { IncomingMessage } from 'http'
import { Socket } from 'net'

type Client = {
  socket: Socket
  userId: number
}

@Injectable()
export class StripeRealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StripeRealtimeService.name)
  private readonly clients = new Set<Client>()

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  onModuleInit() {
    const server = this.httpAdapterHost.httpAdapter?.getHttpServer()
    if (!server || typeof server.on !== 'function') {
      this.logger.warn('HTTP server is not available to attach websocket upgrade handler')
      return
    }

    server.on('upgrade', this.handleUpgrade)
    this.logger.log('Realtime websocket endpoint mounted at /ws/payments')
  }

  onModuleDestroy() {
    const server = this.httpAdapterHost.httpAdapter?.getHttpServer()
    if (server && typeof server.off === 'function') {
      server.off('upgrade', this.handleUpgrade)
    }

    for (const client of this.clients) {
      client.socket.destroy()
    }
    this.clients.clear()
  }

  emitPaymentUpdate(userId: number, payload: Record<string, unknown>) {
    if (!Number.isInteger(userId) || userId <= 0) return

    const message = JSON.stringify({
      event: 'payment.updated',
      data: payload,
    })

    for (const client of this.clients) {
      if (client.userId !== userId) continue
      this.sendText(client.socket, message)
    }
  }

  private handleUpgrade = (req: IncomingMessage, socket: Socket) => {
    const host = req.headers.host || 'localhost'
    const url = new URL(req.url || '/', `http://${host}`)

    if (url.pathname !== '/ws/payments') return

    const key = req.headers['sec-websocket-key']
    const version = req.headers['sec-websocket-version']

    if (!key || version !== '13') {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n')
      socket.destroy()
      return
    }

    const userId = this.resolveUserId(url)
    if (!userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    const accept = createHash('sha1')
      .update(String(key) + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64')

    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '\r\n',
      ].join('\r\n'),
    )

    const client: Client = { socket, userId }
    this.clients.add(client)

    socket.on('data', (chunk: Buffer) => this.handleIncomingFrame(client, chunk))
    socket.on('end', () => this.clients.delete(client))
    socket.on('close', () => this.clients.delete(client))
    socket.on('error', () => this.clients.delete(client))

    this.sendText(socket, JSON.stringify({ event: 'connected', data: { userId } }))
  }

  private handleIncomingFrame(client: Client, frame: Buffer) {
    if (!frame.length) return

    const opcode = frame[0] & 0x0f

    if (opcode === 0x8) {
      client.socket.end()
      this.clients.delete(client)
      return
    }

    if (opcode === 0x9) {
      this.sendPong(client.socket)
    }
  }

  private resolveUserId(url: URL) {
    const token = url.searchParams.get('token') || ''
    if (!token) return null

    const parts = token.split('.')
    if (parts.length < 2) return null

    try {
      const payload = JSON.parse(Buffer.from(this.base64UrlToBase64(parts[1]), 'base64').toString('utf8'))
      const userId = Number(payload?.sub)
      if (!Number.isInteger(userId) || userId <= 0) return null
      return userId
    } catch {
      return null
    }
  }

  private base64UrlToBase64(input: string) {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
    const pad = normalized.length % 4
    if (pad === 0) return normalized
    return normalized + '='.repeat(4 - pad)
  }

  private sendText(socket: Socket, text: string) {
    const payload = Buffer.from(text, 'utf8')
    this.sendFrame(socket, 0x1, payload)
  }

  private sendPong(socket: Socket) {
    this.sendFrame(socket, 0xa, Buffer.alloc(0))
  }

  private sendFrame(socket: Socket, opcode: number, payload: Buffer) {
    const payloadLength = payload.length

    let header: Buffer

    if (payloadLength < 126) {
      header = Buffer.from([0x80 | opcode, payloadLength])
    } else if (payloadLength < 65536) {
      header = Buffer.alloc(4)
      header[0] = 0x80 | opcode
      header[1] = 126
      header.writeUInt16BE(payloadLength, 2)
    } else {
      header = Buffer.alloc(10)
      header[0] = 0x80 | opcode
      header[1] = 127
      header.writeBigUInt64BE(BigInt(payloadLength), 2)
    }

    socket.write(Buffer.concat([header, payload]))
  }
}
