import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/scopes.decorator.js';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.tenantApiKey;
    if (!apiKey) {
      return true; // No API key context — handled by other guards
    }

    const hasScope = requiredScopes.some((scope) =>
      apiKey.scopes.includes(scope),
    );
    if (!hasScope) {
      throw new ForbiddenException(
        `API key missing required scope. Needs one of: ${requiredScopes.join(', ')}`,
      );
    }
    return true;
  }
}
