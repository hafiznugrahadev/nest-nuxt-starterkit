import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { StorageDriver, StoredFile, UploadInput } from '../storage.types';

export interface S3DriverOptions {
  /** Custom endpoint for S3-compatible stores (e.g. MinIO http://localhost:9000). */
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  /** Path-style addressing — required by MinIO and most self-hosted stores. */
  forcePathStyle: boolean;
  /** Optional CDN/public base URL fronting the bucket. */
  publicBaseUrl?: string;
}

/** Structural view of the bits of `@aws-sdk/client-s3` this driver uses. */
interface S3ClientLike {
  send(command: unknown): Promise<unknown>;
}
interface S3Module {
  S3Client: new (config: unknown) => S3ClientLike;
  PutObjectCommand: new (input: unknown) => unknown;
  DeleteObjectCommand: new (input: unknown) => unknown;
}

// Held as a `string` (not a literal) so the TS compiler treats `@aws-sdk/client-s3`
// as a runtime-only, OPTIONAL dependency: deployments on the `local` driver never
// need it installed or resolvable. It is imported lazily only when S3 is active.
const S3_SDK: string = '@aws-sdk/client-s3';

/**
 * S3-compatible driver (AWS S3, MinIO, RustFS, …). The AWS SDK is loaded lazily
 * (see S3_SDK). Returned URLs assume the bucket/prefix is publicly readable, or
 * that a CDN fronts it via S3_PUBLIC_BASE_URL — swap to presigned GETs for private
 * objects.
 */
export class S3StorageDriver implements StorageDriver {
  private readonly bucket: string;
  private readonly endpoint?: string;
  private readonly region: string;
  private readonly publicBaseUrl?: string;
  private clientPromise?: Promise<S3ClientLike>;

  constructor(private readonly opts: S3DriverOptions) {
    this.bucket = opts.bucket;
    this.endpoint = opts.endpoint?.replace(/\/+$/, '');
    this.region = opts.region;
    this.publicBaseUrl = opts.publicBaseUrl?.replace(/\/+$/, '');
  }

  private async sdk(): Promise<S3Module> {
    try {
      return (await import(S3_SDK)) as S3Module;
    } catch {
      throw new Error(
        'STORAGE_DRIVER=s3 requires the "@aws-sdk/client-s3" package. Run: bun add @aws-sdk/client-s3',
      );
    }
  }

  private client(): Promise<S3ClientLike> {
    if (!this.clientPromise) {
      this.clientPromise = this.sdk().then(
        ({ S3Client }) =>
          new S3Client({
            region: this.opts.region,
            endpoint: this.opts.endpoint,
            forcePathStyle: this.opts.forcePathStyle,
            credentials:
              this.opts.accessKeyId && this.opts.secretAccessKey
                ? { accessKeyId: this.opts.accessKeyId, secretAccessKey: this.opts.secretAccessKey }
                : undefined,
          }),
      );
    }
    return this.clientPromise;
  }

  async upload(input: UploadInput): Promise<StoredFile> {
    const { PutObjectCommand } = await this.sdk();
    const client = await this.client();
    const ext = extname(input.originalName)
      .toLowerCase()
      .replace(/[^.a-z0-9]/g, '');
    const key = `${input.folder}/${randomUUID()}${ext}`;
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );
    return { key, url: this.url(key), mimeType: input.mimeType, size: input.size };
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await this.sdk();
    const client = await this.client();
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  url(key: string): string {
    if (this.publicBaseUrl) return `${this.publicBaseUrl}/${key}`;
    // Path-style for custom endpoints (MinIO); virtual-hosted for real AWS S3.
    if (this.endpoint) return `${this.endpoint}/${this.bucket}/${key}`;
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
