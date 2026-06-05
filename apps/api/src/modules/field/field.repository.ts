import { Injectable } from '@nestjs/common';
import { BaseRepository, PrismaDelegate } from '@common/repositories/base.repository';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { FieldEntity } from './entities/field.entity';

@Injectable()
export class FieldRepository extends BaseRepository<FieldEntity> {
  protected readonly searchableFields = ['name', 'description'];

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate(): PrismaDelegate {
    return this.prisma.field as unknown as PrismaDelegate;
  }
}
