import { IsOptional, IsNumber, IsDateString, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVitalsDto {
  @ApiProperty()
  @IsDateString()
  observedAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pulse?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  respirations?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bloodPressureSystolic?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bloodPressureDiastolic?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bmi?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
