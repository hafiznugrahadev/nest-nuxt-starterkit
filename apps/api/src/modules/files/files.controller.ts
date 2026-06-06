import { Controller, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  StorageService,
  type UploadedFile as MulterFile,
} from '@infrastructure/storage/storage.service';

// Hard ceiling (safety net against OOM); the configurable business limit is
// enforced in StorageService from `storage.maxFileSizeBytes`.
const MAX_UPLOAD_CEILING = 15 * 1024 * 1024;

/**
 * Generic authenticated upload endpoint. Protected by the global JwtAuthGuard.
 * Returns the stored file's public URL for callers to persist (e.g. avatarUrl).
 */
@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_CEILING } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file; returns its public URL' })
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  upload(@UploadedFile() file: MulterFile, @Query('folder') folder?: string) {
    return this.storage.upload(file, folder);
  }
}
