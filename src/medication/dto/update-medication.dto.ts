import { PartialType } from '@nestjs/swagger';
import { CreateMedicationDto } from './create-medication.dto.js';

export class UpdateMedicationDto extends PartialType(CreateMedicationDto) {}
