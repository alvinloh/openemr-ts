import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { TenantGuard } from '../tenant/guards/tenant.guard.js';
import { EndpointService } from './endpoint.service.js';
import { CreateEndpointDto } from './dto/create-endpoint.dto.js';

@ApiTags('Endpoints')
@UseGuards(TenantGuard)
@Controller('api/tenant/endpoints')
export class EndpointController {
  constructor(private readonly endpointService: EndpointService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new HL7 endpoint for your tenant' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async create(@Request() req: any, @Body() dto: CreateEndpointDto) {
    const endpoint = await this.endpointService.create(req.tenant, dto);
    return {
      uuid: endpoint.uuid,
      name: endpoint.name,
      transport: endpoint.transport,
      status: endpoint.status,
      destination: this.formatDestination(endpoint),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all registered endpoints' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async list(@Request() req: any) {
    const endpoints = await this.endpointService.list(req.tenant.id);
    return endpoints.map((ep) => ({
      uuid: ep.uuid,
      name: ep.name,
      description: ep.description,
      transport: ep.transport,
      destination: this.formatDestination(ep),
      status: ep.status,
      messageTypes: ep.messageTypes,
      maxRetries: ep.maxRetries,
      timeoutMs: ep.timeoutMs,
      lastSuccessAt: ep.lastSuccessAt,
      lastFailureAt: ep.lastFailureAt,
      consecutiveFailures: ep.consecutiveFailures,
      createdAt: ep.createdAt,
    }));
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get endpoint details' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async get(@Request() req: any, @Param('uuid') uuid: string) {
    const ep = await this.endpointService.findByUuid(req.tenant.id, uuid);
    return {
      uuid: ep.uuid,
      name: ep.name,
      description: ep.description,
      transport: ep.transport,
      destination: this.formatDestination(ep),
      status: ep.status,
      messageTypes: ep.messageTypes,
      maxRetries: ep.maxRetries,
      timeoutMs: ep.timeoutMs,
      healthCheckEnabled: ep.healthCheckEnabled,
      lastHealthCheck: ep.lastHealthCheck,
      lastSuccessAt: ep.lastSuccessAt,
      lastFailureAt: ep.lastFailureAt,
      consecutiveFailures: ep.consecutiveFailures,
      createdAt: ep.createdAt,
      updatedAt: ep.updatedAt,
    };
  }

  @Put(':uuid')
  @ApiOperation({ summary: 'Update an endpoint' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async update(
    @Request() req: any,
    @Param('uuid') uuid: string,
    @Body() dto: Partial<CreateEndpointDto>,
  ) {
    const ep = await this.endpointService.update(req.tenant.id, uuid, dto);
    return {
      uuid: ep.uuid,
      name: ep.name,
      transport: ep.transport,
      status: ep.status,
      destination: this.formatDestination(ep),
    };
  }

  @Delete(':uuid')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an endpoint' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async remove(@Request() req: any, @Param('uuid') uuid: string) {
    await this.endpointService.remove(req.tenant.id, uuid);
  }

  @Post(':uuid/health-check')
  @ApiOperation({ summary: 'Run a health check on an endpoint' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async healthCheck(@Request() req: any, @Param('uuid') uuid: string) {
    const ep = await this.endpointService.findByUuid(req.tenant.id, uuid);
    const healthy = await this.endpointService.healthCheck(ep);
    return { healthy, endpoint: ep.name, checkedAt: new Date().toISOString() };
  }

  private formatDestination(ep: any): string {
    if (ep.transport === 'MLLP') return `${ep.host}:${ep.port}`;
    return ep.url || 'not configured';
  }
}
