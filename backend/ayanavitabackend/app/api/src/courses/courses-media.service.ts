import { BadRequestException, Injectable } from '@nestjs/common'
import { createHash, createHmac } from 'crypto'
import { extname } from 'path'

@Injectable()
export class CoursesMediaService {
  private readonly s3Bucket = process.env.CLOUDFLY_BUCKET || 'ayanavita-dev'
  private readonly s3Region = process.env.CLOUDFLY_REGION || 'auto'
  private readonly s3Endpoint = process.env.CLOUDFLY_ENDPOINT || 'https://s3.cloudfly.vn'
  private readonly s3PublicBaseUrl = process.env.CLOUDFLY_PUBLIC_BASE_URL
  private readonly s3AccessKey = process.env.CLOUDFLY_ACCESS_KEY || '67NZA2R2X53AYJU5I036'
  private readonly s3SecretKey = process.env.CLOUDFLY_SECRET_KEY || '56f8Erg7KoBiIedMrvbe0cBNjy3OIPKHdX0vAW4N'

  private hmac(key: Buffer | string, value: string) {
    return createHmac('sha256', key).update(value, 'utf8').digest()
  }

  private publicCloudUrl(key: string) {
    const baseUrl = this.s3PublicBaseUrl?.trim().replace(/\/$/, '') || this.s3Endpoint.replace(/\/$/, '')
    return `${baseUrl}/${this.s3Bucket}/${key}`
  }

  private async signedS3Put(key: string, file: { buffer: Buffer; mimetype?: string }) {
    const endpointHost = new URL(this.s3Endpoint).host
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.slice(0, 8)

    const payloadHash = createHash('sha256').update(file.buffer).digest('hex')
    const contentType = file.mimetype || 'image/jpeg'
    const acl = 'public-read'

    const signingHeaders: Record<string, string> = {
      host: endpointHost,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'content-type': contentType,
      'x-amz-acl': acl,
    }

    const sortedHeaderKeys = Object.keys(signingHeaders).sort()
    const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${signingHeaders[k]}`).join('\n') + '\n'
    const signedHeaders = sortedHeaderKeys.join(';')

    const canonicalRequest = [
      'PUT',
      `/${this.s3Bucket}/${key}`,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n')

    const credentialScope = `${dateStamp}/${this.s3Region}/s3/aws4_request`
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n')

    const kDate = this.hmac(`AWS4${this.s3SecretKey}`, dateStamp)
    const kRegion = this.hmac(kDate, this.s3Region)
    const kService = this.hmac(kRegion, 's3')
    const kSigning = this.hmac(kService, 'aws4_request')
    const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex')

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.s3AccessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    const url = `${this.s3Endpoint.replace(/\/$/, '')}/${this.s3Bucket}/${key}`

    const headers: Record<string, string> = {
      Authorization: authorization,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'content-type': contentType,
      'x-amz-acl': acl,
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: new Uint8Array(file.buffer),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new BadRequestException(`Upload thumbnail failed: ${res.status} ${text}`)
    }
  }

  async uploadThumbnail(file: { buffer: Buffer; mimetype?: string; originalname?: string; size?: number }) {
    if (!file?.buffer) throw new BadRequestException('File is required')

    const safeExt = extname(file.originalname || '').slice(0, 10) || '.jpg'
    const key = `sourse/courses/thumbnails/${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`

    await this.signedS3Put(key, file)

    return {
      key,
      url: this.publicCloudUrl(key),
      mimeType: file.mimetype || 'image/jpeg',
      size: file.size ?? 0,
    }
  }
}
