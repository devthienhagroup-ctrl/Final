import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { createHash, createHmac, randomUUID } from 'crypto'
import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { spawn } from 'child_process'

@Injectable()
export class LessonsMediaService {
  private readonly s3Bucket = process.env.CLOUDFLY_BUCKET || 'ayanavita-dev'
  private readonly s3Region = process.env.CLOUDFLY_REGION || 'auto'
  private readonly s3Endpoint = process.env.CLOUDFLY_ENDPOINT || 'https://s3.cloudfly.vn'
  private readonly s3AccessKey = process.env.CLOUDFLY_ACCESS_KEY || '67NZA2R2X53AYJU5I036'
  private readonly s3SecretKey = process.env.CLOUDFLY_SECRET_KEY || '56f8Erg7KoBiIedMrvbe0cBNjy3OIPKHdX0vAW4N'

  private hash(input: string | Buffer) {
    return createHash('sha256').update(input).digest('hex')
  }

  private hmac(key: string | Buffer, msg: string) {
    return createHmac('sha256', key).update(msg).digest()
  }

  private async uploadPrivateObject(key: string, body: Buffer, contentType: string) {
    if (!this.s3AccessKey || !this.s3SecretKey) {
      throw new InternalServerErrorException('Cloudfly credentials are not configured')
    }

    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.slice(0, 8)
    const host = new URL(this.s3Endpoint).host
    const payloadHash = this.hash(body)

    const headers = {
      host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'x-amz-acl': 'private',
      'content-type': contentType,
    }

    const signedHeaders = 'content-type;host;x-amz-acl;x-amz-content-sha256;x-amz-date'
    const canonicalHeaders = Object.entries(headers)
      .map(([k, v]) => `${k}:${String(v).trim()}\n`)
      .join('')

    const canonicalRequest = ['PUT', `/${this.s3Bucket}/${key}`, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')
    const credentialScope = `${dateStamp}/${this.s3Region}/s3/aws4_request`
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${this.hash(canonicalRequest)}`

    const kDate = this.hmac(`AWS4${this.s3SecretKey}`, dateStamp)
    const kRegion = this.hmac(kDate, this.s3Region)
    const kService = this.hmac(kRegion, 's3')
    const kSigning = this.hmac(kService, 'aws4_request')
    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex')

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.s3AccessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    const uploadUrl = `${this.s3Endpoint.replace(/\/$/, '')}/${this.s3Bucket}/${key}`

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: authorization,
        ...headers,
      },
      body: new Uint8Array(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new InternalServerErrorException(`Upload video failed: ${res.status} ${text}`)
    }

    return key
  }

  private runFfmpeg(args: string[]) {
    return new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args)
      let settled = false
      let stderr = ''
      ffmpeg.stderr.on('data', (chunk) => {
        stderr += chunk.toString()
      })
      ffmpeg.on('error', (error) => {
        if (settled) return
        settled = true
        reject(error)
      })
      ffmpeg.on('close', (code) => {
        if (settled) return
        settled = true
        if (code === 0) return resolve()
        reject(new Error(stderr || `ffmpeg exited with ${code}`))
      })
    })
  }

  async uploadOriginalVideoAndUpload(file: { buffer: Buffer; originalname?: string }, lessonId: number, moduleId: string) {
    const extension = (file.originalname || 'video.mp4').split('.').pop() || 'mp4'
    const videoKey = `private/courses/${lessonId}/modules/${moduleId}/${randomUUID()}.${extension}`
    await this.uploadPrivateObject(videoKey, file.buffer, 'video/mp4')
    return { sourceUrl: videoKey, storage: 'private-bucket' }
  }


  async convertImageToWebpAndUpload(file: { buffer: Buffer; originalname?: string }, lessonId: number, moduleId: string) {
    const workDir = join(tmpdir(), `lms-img-${randomUUID()}`)
    await mkdir(workDir, { recursive: true })
    const inputPath = join(workDir, file.originalname || 'input')
    const outputPath = join(workDir, 'image.webp')
    try {
      await writeFile(inputPath, file.buffer)
      await this.runFfmpeg(['-y', '-i', inputPath, '-qscale', '75', outputPath])
      const webp = await readFile(outputPath)
      const imageKey = `private/courses/${lessonId}/modules/${moduleId}/${randomUUID()}.webp`
      await this.uploadPrivateObject(imageKey, webp, 'image/webp')
      return { imageKey, sourceUrl: imageKey, storage: 'private-bucket' }
    } finally {
      await rm(workDir, { recursive: true, force: true })
    }
  }
  async transcodeToHlsAndUpload(file: { buffer: Buffer; originalname?: string }, lessonId: number, moduleId: string) {
    const workDir = join(tmpdir(), `lms-hls-${randomUUID()}`)
    await mkdir(workDir, { recursive: true })

    const inputPath = join(workDir, file.originalname || 'input.mp4')
    const outputPlaylist = join(workDir, 'index.m3u8')

    try {
      await writeFile(inputPath, file.buffer)
      await this.runFfmpeg([
        '-y',
        '-i',
        inputPath,
        '-preset',
        'veryfast',
        '-g',
        '48',
        '-sc_threshold',
        '0',
        '-hls_time',
        '6',
        '-hls_playlist_type',
        'vod',
        '-hls_segment_filename',
        join(workDir, 'segment_%03d.ts'),
        outputPlaylist,
      ])

      const playlist = await readFile(outputPlaylist)
      const playlistKey = `private/courses/${lessonId}/modules/${moduleId}/index.m3u8`
      await this.uploadPrivateObject(playlistKey, playlist, 'application/vnd.apple.mpegurl')

      const segmentPromises = Array.from({ length: 200 }).map(async (_, idx) => {
        const name = `segment_${String(idx).padStart(3, '0')}.ts`
        const path = join(workDir, name)
        try {
          const segment = await readFile(path)
          const key = `private/courses/${lessonId}/modules/${moduleId}/${name}`
          await this.uploadPrivateObject(key, segment, 'video/mp2t')
          return key
        } catch {
          return null
        }
      })

      const segmentKeys = (await Promise.all(segmentPromises)).filter(Boolean)
      return { playlistKey, segmentKeys }
    } finally {
      await rm(workDir, { recursive: true, force: true })
    }
  }
}
