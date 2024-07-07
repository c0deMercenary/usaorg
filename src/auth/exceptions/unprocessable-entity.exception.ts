// src/common/exceptions/unprocessable-entity.exception.ts

import { HttpException, HttpStatus } from '@nestjs/common';

export class UnprocessableEntityException extends HttpException {
  constructor(response: string | Record<string, any>) {
    super(response, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
