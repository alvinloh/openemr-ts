import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  drugName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rxnormCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  form?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  refills?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  prn?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indication?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  encounterId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  providerId?: number;
}
