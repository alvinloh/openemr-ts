import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { TenantService } from './tenant.service.js';
import { SignupDto } from './dto/create-tenant.dto.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import { TenantGuard } from './guards/tenant.guard.js';

@ApiTags('Tenant')
@Controller('api')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('signup')
  @HttpCode(201)
  @ApiOperation({ summary: 'Sign up for a new tenant account' })
  async signup(@Body() dto: SignupDto) {
    const result = await this.tenantService.signup(dto);
    return {
      message: 'Account created successfully. Store your API key — it will not be shown again.',
      tenant: {
        uuid: result.tenant.uuid,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.plan,
      },
      user: result.user,
      apiKey: result.apiKey,
    };
  }

  @Get('tenant')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get current tenant details' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async getTenant(@Request() req: any) {
    const tenant = req.tenant;
    return {
      uuid: tenant.uuid,
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email,
      plan: tenant.plan,
      status: tenant.status,
      limits: {
        dailyApiLimit: tenant.dailyApiLimit,
        monthlyHl7Limit: tenant.monthlyHl7Limit,
        maxSimulatedPatients: tenant.maxSimulatedPatients,
        maxEndpoints: tenant.maxEndpoints,
        maxUsers: tenant.maxUsers,
      },
    };
  }

  @Post('tenant/api-keys')
  @UseGuards(TenantGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async createApiKey(@Request() req: any, @Body() dto: CreateApiKeyDto) {
    const { apiKey, rawKey } = await this.tenantService.createApiKey(
      req.tenant,
      dto,
    );
    return {
      message: 'API key created. Store it securely — it will not be shown again.',
      key: rawKey,
      uuid: apiKey.uuid,
      name: apiKey.name,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  @Get('tenant/api-keys')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'List all API keys for current tenant' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async listApiKeys(@Request() req: any) {
    const keys = await this.tenantService.listApiKeys(req.tenant);
    return keys.map((k) => ({
      uuid: k.uuid,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      active: k.active,
      expiresAt: k.expiresAt,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    }));
  }

  @Delete('tenant/api-keys/:uuid')
  @UseGuards(TenantGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async revokeApiKey(@Request() req: any, @Param('uuid') uuid: string) {
    await this.tenantService.revokeApiKey(req.tenant, uuid);
  }
}
