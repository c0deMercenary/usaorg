/* eslint-disable @typescript-eslint/ban-types */
// src/common/pipes/custom-validation.pipe.ts

import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UnprocessableEntityException } from '../exceptions';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      const formattedErrors = errors.map((error) => ({
        field: error.property,
        message: Object.values(error.constraints).join(', '),
      }));
      throw new UnprocessableEntityException({
        errors: formattedErrors,
      });
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
