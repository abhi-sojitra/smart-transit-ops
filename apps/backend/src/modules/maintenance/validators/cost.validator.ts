import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isPositiveCost', async: false })
export class IsPositiveCostConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be greater than zero`;
  }
}
