import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsUrl,
  IsArray,
  Min,
  Max,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EndpointTransport } from '../entities/endpoint.entity.js';

export class CreateEndpointDto {
  @ApiProperty({ example: 'my-lab-system' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Our internal lab integration endpoint' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: EndpointTransport, example: 'HTTP' })
  @IsEnum(EndpointTransport)
  transport: EndpointTransport;

  // MLLP fields
  @ApiPropertyOptional({ example: 'lab.internal.com' })
  @ValidateIf((o) => o.transport === EndpointTransport.MLLP)
  @IsString()
  host?: string;

  @ApiPropertyOptional({ example: 2575 })
  @ValidateIf((o) => o.transport === EndpointTransport.MLLP)
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  // HTTP/HTTPS fields
  @ApiPropertyOptional({ example: 'https://lab.internal.com/hl7/receive' })
  @ValidateIf((o) => o.transport !== EndpointTransport.MLLP)
  @IsString()
  url?: string;

  @ApiPropertyOptional({ example: 'Bearer my-secret-token' })
  @IsOptional()
  @IsString()
  authHeader?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  maxRetries?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(30000)
  timeoutMs?: number;

  @ApiPropertyOptional({
    example: ['ADT', 'ORM', 'ORU'],
    description: 'HL7 message types this endpoint should receive. Null = all types.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  messageTypes?: string[];
}
