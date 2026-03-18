import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../audit/audit.service.js';
import { Request } from 'express';

const METHOD_ACTION_MAP: Record<string, string> = {
  GET: 'read',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const user = (request as any).user;

    // Extract patient ID from URL if present
    const patientMatch = url.match(/\/patient\/([^/]+)/);
    const patientId = patientMatch ? patientMatch[1] : null;

    // Determine resource type from URL
    const pathParts = url.split('/').filter(Boolean);
    const resourceType = pathParts.find(
      (p) =>
        ![
          'api',
          'fhir',
          'patient',
          patientId,
        ].includes(p) && !p.match(/^[0-9a-f-]{36}$/),
    ) || pathParts[pathParts.length - 1];

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService.log({
            event: `${method} ${url}`,
            category: 'api',
            userId: user?.id ?? null,
            userName: user?.username ?? null,
            patientId: patientId ? Number(patientId) || null : null,
            resourceType: resourceType ?? null,
            action: METHOD_ACTION_MAP[method] || 'unknown',
            success: true,
            ipAddress: request.ip ?? null,
            userAgent: request.headers['user-agent'] ?? null,
          });
        },
        error: (err) => {
          this.auditService.log({
            event: `${method} ${url}`,
            category: 'api',
            userId: user?.id ?? null,
            userName: user?.username ?? null,
            patientId: patientId ? Number(patientId) || null : null,
            resourceType: resourceType ?? null,
            action: METHOD_ACTION_MAP[method] || 'unknown',
            success: false,
            ipAddress: request.ip ?? null,
            userAgent: request.headers['user-agent'] ?? null,
            details: { error: err.message },
          });
        },
      }),
    );
  }
}
