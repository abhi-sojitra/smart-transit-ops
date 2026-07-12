import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/** Parse YYYY-MM-DD (or Date) as a local calendar day at midnight. */
export function toDateOnly(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const raw = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    const date = toDateOnly(value);
    if (!date) return false;
    return date.getTime() > startOfToday().getTime();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a date greater than today`;
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isPastOrToday', async: false })
export class IsPastOrTodayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value == null || value === '') return true;
    const date = toDateOnly(value);
    if (!date) return false;
    return date.getTime() <= startOfToday().getTime();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be today or a past date`;
  }
}

export function IsPastOrToday(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPastOrTodayConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isDateAfter', async: false })
export class IsDateAfterConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value == null || value === '') return true;
    const [relatedProperty] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[relatedProperty];
    if (relatedValue == null || relatedValue === '') return true;
    const date = toDateOnly(value);
    const related = toDateOnly(relatedValue);
    if (!date || !related) return false;
    return date.getTime() >= related.getTime();
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedProperty] = args.constraints as [string];
    return `${args.property} must be on or after ${relatedProperty}`;
  }
}

export function IsDateAfter(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsDateAfterConstraint,
    });
  };
}
