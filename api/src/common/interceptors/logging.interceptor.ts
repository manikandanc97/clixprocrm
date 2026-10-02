import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<FastifyRequest>();
    const res = ctx.getResponse<FastifyReply>();

    const method = req.method;
    const url = req.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Skip noisy health check or frequent polls if needed
        if (url.includes('/api/health')) return;

        this.logger.log(
          `${method} ${url} status=${statusCode} duration=${duration}ms env=${process.env.NODE_ENV || 'development'}`
        );
      }),
    );
  }
}
