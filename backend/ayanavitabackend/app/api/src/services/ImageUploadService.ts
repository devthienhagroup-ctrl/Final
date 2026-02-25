import { BadRequestException, Injectable } from '@nestjs/common'
import { createHash, createHmac } from 'crypto'
import { extname } from 'path'

export type ImageRef = { fileName?: string; url?: string }
export type TempImageResponseDto = { fileName: string; url: string; size: number }

@Injectable()
export class ImageUploadService {
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

    private extractCloudKey(input: ImageRef) {
        if (input.fileName) return decodeURIComponent(input.fileName)

        if (!input.url) return null
        const withoutQuery = input.url.split('?')[0]

        // dạng: https://.../bucket/key...
        const bucketPath = `/${this.s3Bucket}/`
        const bucketIndex = withoutQuery.indexOf(bucketPath)
        if (bucketIndex >= 0) return decodeURIComponent(withoutQuery.slice(bucketIndex + bucketPath.length))

        // dạng: https://bucket.s3.cloudfly.vn/key...
        const parsed = withoutQuery.split('.s3.cloudfly.vn/')[1]
        return parsed ? decodeURIComponent(parsed) : null
    }

    private async signedS3Request(method: 'PUT' | 'DELETE', key: string, file?: any) {
        const endpointHost = new URL(this.s3Endpoint).host
        const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
        const dateStamp = amzDate.slice(0, 8)

        const payloadHash =
            method === 'PUT' && file
                ? createHash('sha256').update(file.buffer).digest('hex')
                : createHash('sha256').update('').digest('hex')

        const contentType = file?.mimetype || 'image/jpeg'
        const acl = 'public-read'

        const signingHeaders: Record<string, string> = {
            host: endpointHost,
            'x-amz-content-sha256': payloadHash,
            'x-amz-date': amzDate,
        }

        if (method === 'PUT') {
            signingHeaders['content-type'] = contentType
            signingHeaders['x-amz-acl'] = acl
        }

        const sortedHeaderKeys = Object.keys(signingHeaders).sort()
        const canonicalHeaders =
            sortedHeaderKeys.map((k) => `${k}:${signingHeaders[k]}`).join('\n') + '\n'
        const signedHeaders = sortedHeaderKeys.join(';')

        const canonicalRequest = [
            method,
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
        }

        if (method === 'PUT' && file) {
            headers['content-type'] = contentType
            headers['x-amz-acl'] = acl
        }

        const res = await fetch(url, {
            method,
            headers,
            body: method === 'PUT' ? file?.buffer : undefined,
        })

        if (!res.ok) {
            const text = await res.text()
            throw new BadRequestException(`Cloud ${method} failed: ${text || res.status}`)
        }

        return url
    }

    /**
     * Upload ảnh lên Cloud (public-read)
     */
    async uploadImage(file: any): Promise<TempImageResponseDto> {
        if (!file?.buffer) throw new BadRequestException('File is required')

        const safeExt = extname(file.originalname || '').slice(0, 10) || '.jpg'
        const key = `spa/${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`

        await this.signedS3Request('PUT', key, file)

        return {
            fileName: key,
            url: this.publicCloudUrl(key),
            size: file.size ?? 0,
        }
    }

    /**
     * Xóa ảnh trên Cloud (truyền fileName hoặc url)
     */
    async deleteImage(input: ImageRef) {
        const key = this.extractCloudKey(input)
        if (!key) throw new BadRequestException('fileName or url is required')

        await this.signedS3Request('DELETE', key)
        return { ok: true }
    }
}