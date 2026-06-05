import { Module } from '@nestjs/common';
import { FieldController } from './field.controller';
import { FieldService } from './field.service';
import { FieldRepository } from './field.repository';

@Module({
  controllers: [FieldController],
  providers: [FieldService, FieldRepository],
  exports: [FieldService],
})
export class FieldModule {}
