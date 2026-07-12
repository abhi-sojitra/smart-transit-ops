import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const responseBody =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as {
            message?: string | string[];
            errors?: string[];
            warnings?: string[];
          });

    const rawMessage = responseBody.message ?? 'Internal server error';
    const errors = Array.isArray(responseBody.errors) ? responseBody.errors : undefined;
    const warnings = Array.isArray(responseBody.warnings) ? responseBody.warnings : undefined;

    let message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
    if (errors?.length && message === 'Trip validation failed') {
      message = `${message}: ${errors.join('; ')}`;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unknown error',
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      message,
      data: null,
      errors,
      warnings,
      meta: {
        statusCode: status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
