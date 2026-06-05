import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@minisoccer/shared-types';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated.decorator';
import { FieldEntity } from './entities/field.entity';
import { FieldService } from './field.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { QueryFieldDto } from './dto/query-field.dto';

@ApiTags('fields')
@Controller('fields')
export class FieldController {
  constructor(private readonly fieldService: FieldService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List fields (paginated, filterable)' })
  @ApiPaginatedResponse(FieldEntity)
  findAll(@Query() query: QueryFieldDto) {
    return this.fieldService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a field by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fieldService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a field (admin)' })
  create(@Body() dto: CreateFieldDto) {
    return this.fieldService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a field (admin)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFieldDto) {
    return this.fieldService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a field (admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.fieldService.remove(id);
  }
}
