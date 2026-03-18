import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsIn,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiagnosisDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional({ default: 'ICD-10' })
  @IsOptional()
  @IsString()
  codeSystem?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateEncounterDto {
  @ApiProperty()
  @IsNumber()
  providerId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  facilityId?: number;

  @ApiProperty()
  @IsDateString()
  encounterDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  encounterDateEnd?: string;

  @ApiPropertyOptional({ default: 'AMB' })
  @IsOptional()
  @IsString()
  @IsIn(['AMB', 'EMER', 'IMP', 'OBSENC', 'SS'])
  classCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reasonForVisit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  supervisorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  posCode?: string;

  @ApiPropertyOptional({ type: [DiagnosisDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisDto)
  diagnoses?: DiagnosisDto[];
}
