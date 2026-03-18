import { PartialType } from '@nestjs/swagger';
import { CreateEncounterDto } from './create-encounter.dto.js';

export class UpdateEncounterDto extends PartialType(CreateEncounterDto) {}
