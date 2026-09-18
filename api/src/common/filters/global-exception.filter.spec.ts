import {
    ArgumentsHost,
    BadRequestException,
    HttpStatus
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter Security - Production Error Masking', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      url: '/api/leads',
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  it('P2: Masks 500 internal server errors, SQL queries, and stack details in responses', () => {
    const rawSqlError = new Error(
      'Raw SQL ERROR: SELECT * FROM users WHERE password_hash = "secret"',
    );

    filter.catch(rawSqlError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        path: '/api/leads',
      }),
    );
    // Ensure raw SQL leak is NOT present in response
    const sentPayload = mockResponse.send.mock.calls[0][0];
    expect(JSON.stringify(sentPayload)).not.toContain('Raw SQL ERROR');
    expect(JSON.stringify(sentPayload)).not.toContain('password_hash');
  });

  it('P2: Preserves safe 400 validation error messages from ValidationPipe', () => {
    const validationError = new BadRequestException([
      'email must be an email',
      'name should not be empty',
    ]);

    filter.catch(validationError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'email must be an email, name should not be empty',
      }),
    );
  });
});
