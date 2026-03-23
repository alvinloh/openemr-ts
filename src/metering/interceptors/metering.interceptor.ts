import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MeteringService } from '../metering.service.js';
import { UsageResourceType } from '../entities/usage-record.entity.js';

@Injectable()
export class MeteringInterceptor implements NestInterceptor {
  constructor(private readonly meteringService: MeteringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const tenant = request.tenant;

    // Only meter requests with a tenant context (API key authenticated)
    if (!tenant) {
      return next.handle();
    }

    const path = request.route?.path ?? request.url;
    const method = request.method;

    // Determine resource type from the request path
    const resourceType = this.classifyRequest(path);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          this.meteringService
            .record(tenant.id, resourceType, {
              endpoint: path,
              method,
              statusCode: response.statusCode,
            })
            .catch(() => {}); // Fire and forget — don't fail the request over metering
        },
        error: (err) => {
          const statusCode =
            err instanceof HttpException ? err.getStatus() : 500;
          this.meteringService
            .record(tenant.id, resourceType, {
              endpoint: path,
              method,
              statusCode,
            })
            .catch(() => {});
        },
      }),
    );
  }

  private classifyRequest(path: string): UsageResourceType {
    if (path.startsWith('/fhir')) {
      return UsageResourceType.FHIR_QUERY;
    }
    if (path.includes('/hl7')) {
      return UsageResourceType.HL7_MESSAGE;
    }
    if (path.includes('/simulate')) {
      return UsageResourceType.SIMULATION;
    }
    return UsageResourceType.API_CALL;
  }
}
