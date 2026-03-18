import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenRequestDto {
  @ApiProperty({ example: 'client_credentials' })
  @IsString()
  @IsNotEmpty()
  grant_type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  client_secret: string;

  @ApiPropertyOptional({
    example: 'patient/Patient.rs patient/Observation.rs',
    description: 'Space-separated list of requested scopes (must be subset of client registered scopes)',
  })
  @IsOptional()
  @IsString()
  scope?: string;
}
