import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OAuth2Service } from './oauth2.service.js';
import { RegisterClientDto } from './dto/register-client.dto.js';
import { TokenRequestDto } from './dto/token-request.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Role } from '../common/constants/roles.constants.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@ApiTags('OAuth2')
@Controller()
export class OAuth2Controller {
  constructor(private readonly oauth2Service: OAuth2Service) {}

  // ── Client Registration (admin only) ──

  @Post('api/oauth2/register')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Register an OAuth2 client application',
    description: 'Admin-only. Returns client_id and client_secret (secret shown only once).',
  })
  async registerClient(
    @Body() dto: RegisterClientDto,
    @CurrentUser('id') userId: number,
  ) {
    const result = await this.oauth2Service.registerClient(dto, userId);
    return {
      message: 'Client registered successfully. Save the client_secret — it will not be shown again.',
      client_id: result.client.clientId,
      client_secret: result.clientSecret,
      name: result.client.name,
      scopes: result.client.scopes,
      grant_types: result.client.grantTypes,
    };
  }

  @Get('api/oauth2/clients')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List registered OAuth2 clients' })
  async listClients() {
    return ApiResponse.ok(await this.oauth2Service.listClients());
  }

  @Delete('api/oauth2/clients/:clientId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Revoke an OAuth2 client' })
  async revokeClient(@Param('clientId') clientId: string) {
    await this.oauth2Service.revokeClient(clientId);
    return { message: 'Client revoked' };
  }

  @Get('api/oauth2/scopes')
  @ApiOperation({ summary: 'List all valid FHIR scopes' })
  async listScopes() {
    return ApiResponse.ok(this.oauth2Service.getValidScopes());
  }

  // ── Token Endpoint (public, no auth required) ──

  @Post('oauth2/token')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Request an access token using client credentials',
    description: 'OAuth2 token endpoint. Send client_id, client_secret, and grant_type=client_credentials.',
  })
  async token(@Body() dto: TokenRequestDto) {
    return this.oauth2Service.generateToken(
      dto.client_id,
      dto.client_secret,
      dto.grant_type,
      dto.scope,
    );
  }

  // ── Token Introspection ──

  @Post('oauth2/introspect')
  @HttpCode(200)
  @ApiOperation({ summary: 'Introspect a token to check if it is active' })
  async introspect(@Body('token') token: string) {
    return this.oauth2Service.introspectToken(token);
  }
}
