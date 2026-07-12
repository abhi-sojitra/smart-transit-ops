import { z } from 'zod';
import { FORM_LIMITS } from '@/constants/form';
import { optionalString, trimValue } from '@/utils/form-sanitize';

const PHONE_REGEX = /^[0-9]{10}$/;
const NAME_REGEX = /^[a-zA-Z\s'-]+$/;
const LETTERS_ONLY_REGEX = /^[a-zA-Z\s'-]+$/;
const EMPLOYEE_CODE_REGEX = /^[A-Z0-9-_]+$/;
const VEHICLE_NUMBER_REGEX = /^[A-Z0-9-]+$/;
const LICENSE_NUMBER_REGEX = /^[A-Z0-9-]+$/;
const POSTAL_CODE_REGEX = /^[0-9]{6}$/;

export const trimmedString = (max: number = FORM_LIMITS.text) =>
  z
    .string()
    .transform(trimValue)
    .pipe(z.string().max(max));

export const requiredTrimmedString = (label: string, max: number = FORM_LIMITS.text) =>
  z
    .string()
    .transform(trimValue)
    .pipe(z.string().min(1, `${label} is required.`).max(max, `${label} must be at most ${max} characters.`));

export const optionalTrimmedString = (max: number = FORM_LIMITS.text) =>
  z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => optionalString(v))
    .pipe(z.string().max(max).optional());

export const nameField = (label: string) =>
  z
    .string()
    .transform(trimValue)
    .pipe(
      z
        .string()
        .min(1, `${label} is required.`)
        .max(FORM_LIMITS.name, `${label} must be at most ${FORM_LIMITS.name} characters.`)
        .regex(NAME_REGEX, `${label} must contain letters only.`),
    );

export const emailField = z
  .string()
  .transform((v) => trimValue(v).toLowerCase())
  .pipe(
    z
      .string()
      .min(1, 'Email address is required.')
      .max(FORM_LIMITS.email, `Email must be at most ${FORM_LIMITS.email} characters.`)
      .email('Enter a valid email address (Example: john@example.com).'),
  );

export const phoneField = (label = 'Phone number') =>
  z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(
      z
        .string()
        .length(FORM_LIMITS.phone, `${label} must contain exactly ${FORM_LIMITS.phone} digits.`),
    );

export const optionalPhoneField = (label = 'Phone number') =>
  z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => {
      const digits = v ? v.replace(/\D/g, '') : '';
      return digits || undefined;
    })
    .pipe(
      z.union([
        z.undefined(),
        z
          .string()
          .length(FORM_LIMITS.phone, `${label} must contain exactly ${FORM_LIMITS.phone} digits.`),
      ]),
    );

export const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(FORM_LIMITS.password, `Password must be at most ${FORM_LIMITS.password} characters.`)
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must include at least one number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character.');

export const employeeCodeField = z
  .string()
  .transform((v) => trimValue(v).toUpperCase())
  .pipe(
    z
      .string()
      .min(2, 'Employee code is required.')
      .max(FORM_LIMITS.employeeCode)
      .regex(EMPLOYEE_CODE_REGEX, 'Employee code may only contain letters, numbers, hyphens, and underscores.'),
  );

export const vehicleNumberField = z
  .string()
  .transform((v) => trimValue(v).toUpperCase())
  .pipe(
    z
      .string()
      .min(4, 'Vehicle registration number is required.')
      .max(FORM_LIMITS.vehicleNumber)
      .regex(VEHICLE_NUMBER_REGEX, 'Vehicle number may only contain letters, numbers, and hyphens.'),
  );

export const licenseNumberField = z
  .string()
  .transform((v) => trimValue(v).toUpperCase())
  .pipe(
    z
      .string()
      .min(5, 'License number is required.')
      .max(FORM_LIMITS.licenseNumber)
      .regex(LICENSE_NUMBER_REGEX, 'License number may only contain letters, numbers, and hyphens.'),
  );

export const cityField = optionalTrimmedString(FORM_LIMITS.name).refine(
  (v) => !v || LETTERS_ONLY_REGEX.test(v),
  'City must contain letters only.',
);

export const postalCodeField = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v.replace(/\D/g, '') : ''))
  .pipe(
    z
      .string()
      .refine(
        (v) => !v || POSTAL_CODE_REGEX.test(v),
        'Postal code must be exactly 6 digits.',
      ),
  );

export const urlField = (label = 'URL') =>
  z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => optionalString(v))
    .pipe(
      z.union([
        z.undefined(),
        z
          .string()
          .url(`Enter a valid ${label.toLowerCase()}.`)
          .max(FORM_LIMITS.url),
      ]),
    );

export const notesField = optionalTrimmedString(FORM_LIMITS.textarea);

export const positiveAmountField = (label: string) =>
  z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? val : num;
    },
    z
      .number({
        required_error: `${label} is required.`,
        invalid_type_error: `${label} must be a number.`,
      })
      .positive(`${label} must be greater than zero.`),
  );

export const nonNegativeAmountField = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number.` })
    .min(0, `${label} cannot be negative.`);

export const positiveDecimalField = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number.` })
    .positive(`${label} must be greater than zero.`)
    .refine(
      (v) => /^\d+(\.\d{1,2})?$/.test(String(v)),
      `${label} allows up to two decimal places.`,
    );

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  checks: { label: string; met: boolean }[];
} {
  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.met).length;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[Math.max(0, score - 1)] ?? 'Very weak', checks };
}
