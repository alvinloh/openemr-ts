import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { TenantService } from '../../tenant/tenant.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

/**
 * Combined guard that accepts either:
 * 1. JWT Bearer token (Authorization header) — existing user auth
 * 2. API key (x-api-key header) — tenant API key auth
 *
 * If both are present, both are validated and attached to the request.
 * At least one must be valid. Endpoints decorated with @Public() skip auth.
 */
@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private readonly tenantService: TenantService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'] as string;
    const authHeader = request.headers['authorization'] as string;

    let jwtValid = false;
    let apiKeyValid = false;

    // Try JWT first
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwtGuard = new (AuthGuard('jwt'))();
        jwtValid = await (jwtGuard.canActivate(context) as Promise<boolean>);
      } catch {
        // JWT failed, that's OK if API key works
      }
    }

    // Try API key
    if (apiKeyHeader) {
      const result = await this.tenantService.validateApiKey(apiKeyHeader);
      if (result) {
        request.tenant = result.tenant;
        request.tenantApiKey = result.apiKey;
        apiKeyValid = true;

        // If no JWT user, create a synthetic user object for compatibility
        if (!request.user) {
          request.user = {
            uuid: `tenant:${result.tenant.uuid}`,
            username: result.tenant.email,
            role: 'admin',
            tenantId: result.tenant.id,
            firstName: result.tenant.name,
            lastName: '',
          };
        }
      }
    }

    if (!jwtValid && !apiKeyValid) {
      throw new UnauthorizedException(
        'Authentication required. Provide a JWT Bearer token or x-api-key header.',
      );
    }

    return true;
  }
}
