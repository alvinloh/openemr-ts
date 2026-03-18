import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If already wrapped in ApiResponse format, pass through
        if (data && typeof data === 'object' && 'data' in data) {
          return data;
        }
        return { data };
      }),
    );
  }
}
