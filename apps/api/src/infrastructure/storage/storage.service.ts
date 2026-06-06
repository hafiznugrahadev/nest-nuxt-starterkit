import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_DRIVER, type StorageDriver, type StoredFile } from './storage.types';

/** Minimal shape of a Multer memory-storage file (avoids needing @types/multer). */
export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Public storage facade (mirrors RedisService). Enforces the configured size +
 * MIME guardrails, then delegates to the active driver (local | s3). Inject this
 * anywhere; the StorageModule is @Global.
 */
@Injectable()
export class StorageService {
  private readonly maxBytes: number;
  private readonly allowedMime: string[];

  constructor(
    @Inject(STORAGE_DRIVER) private readonly driver: StorageDriver,
    config: ConfigService,
  ) {
    this.maxBytes = config.get<number>('storage.maxFileSizeBytes') ?? 5 * 1024 * 1024;
    this.allowedMime = config.get<string[]>('storage.allowedMimeTypes') ?? [];
  }

  async upload(file: UploadedFile | undefined, folder?: string): Promise<StoredFile> {
    if (!file?.buffer) throw new BadRequestException('No file provided (field "file")');
    if (file.size > this.maxBytes) {
      throw new PayloadTooLargeException(
        `File exceeds the ${Math.round(this.maxBytes / 1024 / 1024)}MB limit`,
      );
    }
    if (this.allowedMime.length && !this.allowedMime.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException(`Unsupported file type: ${file.mimetype}`);
    }
    return this.driver.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      folder: this.sanitizeFolder(folder),
    });
  }

  delete(key: string): Promise<void> {
    return this.driver.delete(key);
  }

  url(key: string): string {
    return this.driver.url(key);
  }

  /** Restrict folders to a safe slug — prevents path traversal and odd keys. */
  private sanitizeFolder(folder?: string): string {
    const clean = (folder ?? 'uploads').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return clean || 'uploads';
  }
}
