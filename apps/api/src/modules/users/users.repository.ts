import { Injectable } from '@nestjs/common';
import { BaseRepository, PrismaDelegate } from '@common/repositories/base.repository';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersRepository extends BaseRepository<UserEntity> {
  protected readonly searchableFields = ['name', 'email'];

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get delegate(): PrismaDelegate {
    return this.prisma.user as unknown as PrismaDelegate;
  }
}
