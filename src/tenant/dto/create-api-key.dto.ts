import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsDateString,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const VALID_SCOPES = [
  'patient:read',
  'patient:write',
  'encounter:read',
  'encounter:write',
  'medication:read',
  'medication:write',
  'lab:read',
  'lab:write',
  'appointment:read',
  'appointment:write',
  'billing:read',
  'billing:write',
  'document:read',
  'document:write',
  'hl7:send',
  'hl7:receive',
  'fhir:read',
  'fhir:write',
  'simulate:run',
] as const;

export type ApiKeyScope = (typeof VALID_SCOPES)[number];

export class CreateApiKeyDto {
  @ApiProperty({ example: 'My Integration Key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: ['patient:read', 'hl7:send', 'fhir:read'],
    enum: VALID_SCOPES,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  scopes: string[];

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
