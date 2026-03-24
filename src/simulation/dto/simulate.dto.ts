import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SimulateDto {
  @ApiPropertyOptional({
    example: 'full-visit',
    description: 'Preset scenario name: full-visit, lab-only, admit-discharge, pharmacy, referral',
  })
  @IsOptional()
  @IsString()
  scenario?: string;

  @ApiPropertyOptional({
    example: ['register', 'checkin', 'order-labs', 'receive-results'],
    description: 'Custom steps (overrides scenario)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[];

  @ApiPropertyOptional({
    example: '29f67f58-10bf-4939-a0fe-a418fff59f4c',
    description: 'Target an existing patient by UUID. Skips the register step and runs remaining steps against this patient. When set, patientCount is ignored.',
  })
  @IsOptional()
  @IsString()
  patientUuid?: string;

  @ApiProperty({ example: 5, description: 'Number of patients to simulate (max 100). Ignored if patientUuid is set.' })
  @IsInt()
  @Min(1)
  @Max(100)
  patientCount: number;

  @ApiPropertyOptional({
    example: ['CBC', 'BMP'],
    description: 'Lab panels to order (default: CBC, BMP)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labPanels?: string[];

  @ApiPropertyOptional({
    example: 'instant',
    description: 'Pacing: instant (no delay) or realtime (simulated delays)',
  })
  @IsOptional()
  @IsIn(['instant', 'realtime'])
  pacing?: 'instant' | 'realtime';

  @ApiPropertyOptional({ example: 18, description: 'Minimum patient age' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ageMin?: number;

  @ApiPropertyOptional({ example: 85, description: 'Maximum patient age' })
  @IsOptional()
  @IsInt()
  @Max(120)
  ageMax?: number;
}
