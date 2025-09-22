import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {
  responseSuccess(data: any): any {
    const response = {
      statusCode: 200,
      message: 'success',
      data: data ? data : [],
    };
    return response;
  }

  responseCreateSuccess(messageKey: string, data: any): any {
    const response = {
      statusCode: 201,
      message: messageKey,
      data: data ? data : [],
    };
    return response;
  }

  responseUpdateSuccess(messageKey: string, data: any): any {
    const response = {
      statusCode: 200,
      message: messageKey,
      data: data ? data : [],
    };
    return response;
  }
  responseDeleteSuccess(messageKey: string, data: any): any {
    const response = {
      statusCode: 204,
      message: messageKey,
      data: data ? data : [],
    };
    return response;
  }

  responseError(error: string): any {
    const response = {
      statusCode: 400,
      message: error,
    };
    return response;
  }

  responseConflict(error: string): any {
    const response = {
      statusCode: 409,
      message: error,
    };
    return response;
  }
  responseInternalError(error: string): any {
    const response = {
      statusCode: 500,
      message: error,
    };
    return response;
  }

  validationError(error: string): any {
    const response = {
      statusCode: 400,
      message: error,
    };
    return response;
  }

  notFound(error: string): any {
    const response = {
      statusCode: 404,
      message: error,
    };
    return response;
  }

  unauthorized(error: string): any {
    const response = {
      statusCode: 401,
      message: error,
    };
    return response;
  }

  forbidden(error: string): any {
    const response = {
      statusCode: 403,
      message: error,
    };
    return response;
  }

  getPagination(page: number, size: number): { limit: number; offset: number } {
    const limit = size ? +size : 3;
    const offset = page ? page * limit : 0;

    return { limit, offset };
  }
}
