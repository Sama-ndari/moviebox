// common/filters/all-exceptions.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  import { MongoError } from 'mongodb';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);
  
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let error = 'Internal Server Error';
      
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const errorResponse = exception.getResponse() as any;
        message = errorResponse.message || exception.message;
        error = errorResponse.error || 'Error';
      } else if (exception instanceof MongoError) {
        // Handle MongoDB errors
        if (exception.code === 11000) {
          status = HttpStatus.CONFLICT;
          message = 'Duplicate key error';
          error = 'Conflict';
        }
      }
      
      // Log the error
      this.logger.error(`${request.method} ${request.url}`, {
        status,
        error,
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
      
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        error,
        message,
      });
    }
  }
  