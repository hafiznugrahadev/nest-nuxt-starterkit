import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@starterkit/shared-types';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated.decorator';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';
import { QueryUserDto } from './dto/query-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List users (paginated, admin only)' })
  @ApiPaginatedResponse(UserEntity)
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }
}
