import { PartialType } from '@nestjs/swagger';
import { CreateFieldDto } from './create-field.dto';

/** SPEC DRY #3 — never re-declare fields; derive from CreateFieldDto. */
export class UpdateFieldDto extends PartialType(CreateFieldDto) {}
