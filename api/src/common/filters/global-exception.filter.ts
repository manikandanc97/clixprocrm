import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const isProd = process.env.NODE_ENV === 'production';
    let message = 'Internal server error';
    let errorName: string | undefined = undefined;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as any;
        message = Array.isArray(r.message)
          ? r.message.join(', ')
          : r.message ||
            (typeof r.error === 'string' ? r.error : JSON.stringify(r));
        errorName = typeof r.error === 'string' ? r.error : undefined;
      }
    }

    if (status >= 500) {
      const rawError =
        exception instanceof Error ? exception.message : String(exception);
      const stack = exception instanceof Error ? exception.stack : '';
      this.logger.error(
        `HTTP Status: ${status} | Path: ${request.url} | Internal Error: ${rawError}`,
        stack,
      );

      // In production or on internal server errors, mask raw messages to prevent info disclosure
      message = 'Internal server error';
      errorName = 'Internal Server Error';
    }

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: errorName,
    });
  }
}
