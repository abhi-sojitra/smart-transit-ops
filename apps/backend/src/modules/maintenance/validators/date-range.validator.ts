import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

function toDateOnly(value: string | Date): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function todayDateOnly(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

@ValidatorConstraint({ name: 'isCompletionAfterStart', async: false })
export class IsCompletionAfterStartConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const object = args.object as { startDate?: string };
    if (!value || !object.startDate) return true;
    const start = toDateOnly(object.startDate);
    const end = toDateOnly(String(value));
    if (!start || !end) return false;
    return end.getTime() >= start.getTime();
  }

  defaultMessage(): string {
    return 'expectedCompletionDate cannot be before startDate';
  }
}

@ValidatorConstraint({ name: 'isTodayOrFuture', async: false })
export class IsTodayOrFutureConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!value) return true;
    const date = toDateOnly(String(value));
    if (!date) return false;
    return date.getTime() >= todayDateOnly().getTime();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be today or a future date`;
  }
}

@ValidatorConstraint({ name: 'isAfterExpectedCompletion', async: false })
export class IsAfterExpectedCompletionConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (!value) return true;
    const object = args.object as { expectedCompletionDate?: string };
    if (!object.expectedCompletionDate) return true;
    const nextDue = toDateOnly(String(value));
    const expected = toDateOnly(object.expectedCompletionDate);
    if (!nextDue || !expected) return false;
    return nextDue.getTime() > expected.getTime();
  }

  defaultMessage(): string {
    return 'nextServiceDue must be after expectedCompletionDate';
  }
}
