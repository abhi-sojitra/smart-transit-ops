import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { ApiResponse } from '@transitops/shared-types';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'success' in payload &&
          'data' in payload
        ) {
          return payload as ApiResponse<T>;
        }

        if (payload && typeof payload === 'object' && 'data' in payload && 'meta' in payload) {
          const { data, meta, message } = payload as {
            data: T;
            meta?: Record<string, unknown>;
            message?: string;
          };
          return {
            success: true,
            message: message ?? 'OK',
            data,
            meta: meta ?? {},
          };
        }

        return {
          success: true,
          message: 'OK',
          data: payload as T,
          meta: {},
        };
      }),
    );
  }
}
