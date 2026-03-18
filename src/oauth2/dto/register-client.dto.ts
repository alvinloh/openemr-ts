import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterClientDto {
  @ApiProperty({ example: 'External EHR System' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Integration for Springfield Hospital EHR' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://their-system.com/callback' })
  @IsOptional()
  @IsString()
  redirectUri?: string;

  @ApiProperty({
    example: ['patient/Patient.rs', 'patient/Observation.rs'],
    description: 'Requested scopes. Format: {context}/{Resource}.{permissions} where context is "patient" or "system", permissions are r=read, s=search, c=create, u=update, d=delete',
  })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @ApiPropertyOptional({
    example: ['client_credentials'],
    description: 'Allowed grant types',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grantTypes?: string[];
}
