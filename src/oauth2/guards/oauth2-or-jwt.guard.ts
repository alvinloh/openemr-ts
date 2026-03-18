import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { OAuth2Service } from '../oauth2.service.js';

export const FHIR_RESOURCE_KEY = 'fhir_resource';
export const FHIR_ACTION_KEY = 'fhir_action';

/**
 * Guard that accepts EITHER:
 * 1. A user JWT token (from /api/auth/login) — full access
 * 2. An OAuth2 client token (from /oauth2/token) — scope-restricted access
 *
 * For OAuth2 tokens, it checks that the token has the required scope
 * for the FHIR resource being accessed.
 */
@Injectable()
export class OAuth2OrJwtGuard implements CanActivate {
  constructor(
    private readonly oauth2Service: OAuth2Service,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.substring(7);

    // Try OAuth2 client token first
    const oauth2Result = await this.oauth2Service.validateToken(token);
    if (oauth2Result) {
      // OAuth2 client token — check scopes
      const resourceType = this.reflector.get<string>(FHIR_RESOURCE_KEY, context.getHandler())
        || this.extractResourceFromUrl(request.url);
      const action = this.getActionFromMethod(request.method);

      if (resourceType && !this.oauth2Service.checkScope(oauth2Result.scopes, resourceType, action)) {
        throw new ForbiddenException(
          `Insufficient scope. Required: */[${resourceType}].[${action}] — Granted: ${oauth2Result.scopes.join(', ')}`,
        );
      }

      // Attach client info to request
      request.user = {
        type: 'oauth2_client',
        clientId: oauth2Result.clientId,
        clientName: oauth2Result.clientName,
        scopes: oauth2Result.scopes,
      };
      return true;
    }

    // Fall back to user JWT via Passport
    try {
      const jwtGuard = new (AuthGuard('jwt'))();
      const result = await jwtGuard.canActivate(context);
      if (result) {
        // Tag as user auth
        if (request.user && !request.user.type) {
          request.user.type = 'user';
        }
        return true;
      }
    } catch {
      // JWT also failed
    }

    throw new UnauthorizedException('Invalid or expired token');
  }

  private extractResourceFromUrl(url: string): string | null {
    // Extract FHIR resource type from URL like /fhir/Patient or /fhir/Observation
    const match = url.match(/\/fhir\/([A-Za-z]+)/);
    return match ? match[1] : null;
  }

  private getActionFromMethod(method: string): 'read' | 'search' | 'create' | 'update' | 'delete' {
    switch (method) {
      case 'GET': return 'read';
      case 'POST': return 'create';
      case 'PUT':
      case 'PATCH': return 'update';
      case 'DELETE': return 'delete';
      default: return 'read';
    }
  }
}
