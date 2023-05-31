import { ISchemaFieldOptions } from './field';

export const validator = (
  reject,
  value,
  type,
  options: ISchemaFieldOptions,
) => {
  if (type === 'number' || type === 'int' || type === 'float') {
    if (
      typeof value !== 'number' ||
      (type === 'int' && !Number.isInteger(value))
    ) {
      reject(`must be of type "${type}"`);
    }

    if (options.min !== undefined && value < options.min) {
      reject(`must be greater than or equal to ${options.min}`);
    }

    if (options.max !== undefined && value > options.max) {
      reject(`must be less than or equal to ${options.max}`);
    }
  }

  if (type === 'string') {
    if (options.minLength !== undefined && value.length < options.minLength) {
      reject(`must be at least ${options.minLength} characters long`);
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      reject(`must be no more than ${options.maxLength} characters long`);
    }

    if (options.pattern !== undefined && !options.pattern.test(value)) {
      reject(`must match the pattern "${options.pattern}"`);
    }
  }

  if (type === 'boolean') {
    if (
      options.allowNull !== undefined &&
      options.allowNull === false &&
      value === null
    ) {
      reject('must not be null');
    }
    if (typeof value !== 'boolean') reject('expected boolean type');
  }

  if (type === 'date') {
    if (!(value instanceof Date)) reject('expected date type');

    if (options.min !== undefined && value < options.min) {
      reject(`must be greater than or equal to ${options.min}`);
    }

    if (options.max !== undefined && value > options.max) {
      reject(`must be less than or equal to ${options.max}`);
    }
  }
};
