'use client';

import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import { FormField } from '@/components/forms/form-field';
import { FormSection } from '@/components/forms/form-section';
import { FormActionBar } from '@/components/forms/form-action-bar';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { CharacterCountTextarea } from '@/components/ui/character-count-textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { staggerContainer } from '@/components/drivers/motion';
import {
  BLOOD_GROUP_OPTIONS,
  COUNTRIES,
  DEFAULT_FORM_OPTIONS,
  FORM_LIMITS,
  INDIAN_STATES,
  PLACEHOLDERS,
} from '@/constants/form';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes';
import {
  DriverStatus,
  LicenseCategory,
  type DriverFormValues,
} from '@/types/driver';
import {
  capitalizeWords,
  digitsOnly,
  lettersOnly,
  optionalString,
  sanitizeTextInput,
  uppercase,
} from '@/utils/form-sanitize';
import { enhanceRegister } from '@/utils/form-register';
import {
  cityField,
  emailField,
  employeeCodeField,
  licenseNumberField,
  nameField,
  optionalPhoneField,
  optionalTrimmedString,
  phoneField,
  postalCodeField,
  urlField,
} from '@/utils/form-validation';

const driverFormSchema = z
  .object({
    employeeCode: employeeCodeField,
    firstName: nameField('First name'),
    lastName: nameField('Last name'),
    email: emailField,
    phone: phoneField('Phone number'),
    alternatePhone: optionalPhoneField('Alternate phone number'),
    dateOfBirth: z.string().optional(),
    joiningDate: z.string().min(1, 'Joining date is required.'),
    licenseNumber: licenseNumberField,
    licenseCategory: z.nativeEnum(LicenseCategory, {
      errorMap: () => ({ message: 'License category is required.' }),
    }),
    licenseIssueDate: z.string().optional(),
    licenseExpiryDate: z.string().min(1, 'License expiry date is required.'),
    experienceYears: z.coerce
      .number()
      .min(0, 'Experience cannot be negative.')
      .max(60, 'Experience cannot exceed 60 years.'),
    address: optionalTrimmedString(FORM_LIMITS.text),
    city: cityField,
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: postalCodeField,
    emergencyName: optionalTrimmedString(FORM_LIMITS.name),
    emergencyPhone: optionalPhoneField('Emergency contact phone'),
    bloodGroup: z.string().optional(),
    photo: urlField('Photo URL'),
    remarks: optionalTrimmedString(FORM_LIMITS.textarea),
    status: z.nativeEnum(DriverStatus).optional(),
    safetyScore: z.coerce.number().min(0).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    const expiry = new Date(data.licenseExpiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= today.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['licenseExpiryDate'],
        message: 'License expiry must be after today. Driver cannot be assigned after expiry.',
      });
    }
    if (data.licenseIssueDate) {
      const issue = new Date(data.licenseIssueDate);
      if (!Number.isNaN(issue.getTime()) && expiry.getTime() < issue.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['licenseExpiryDate'],
          message: 'License expiry must be on or after the issue date.',
        });
      }
    }
  });

export type DriverFormSchema = z.infer<typeof driverFormSchema>;

interface DriverFormProps {
  defaultValues?: Partial<DriverFormValues>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: DriverFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const emptyDefaults: DriverFormSchema = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  alternatePhone: '',
  dateOfBirth: '',
  joiningDate: '',
  licenseNumber: '',
  licenseCategory: LicenseCategory.CDL_A,
  licenseIssueDate: '',
  licenseExpiryDate: '',
  experienceYears: 0,
  address: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  emergencyName: '',
  emergencyPhone: '',
  bloodGroup: '',
  photo: '',
  remarks: '',
  status: DriverStatus.AVAILABLE,
  safetyScore: 100,
};

export function DriverForm({
  defaultValues,
  submitting,
  submitLabel = 'Save Driver',
  onSubmit,
  onCancel,
}: DriverFormProps) {
  const reduceMotion = useReducedMotion();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<DriverFormSchema>({
    ...DEFAULT_FORM_OPTIONS,
    resolver: zodResolver(driverFormSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  useUnsavedChangesWarning(isDirty, !submitting);

  const clean = (values: DriverFormSchema): DriverFormValues => ({
    ...values,
    employeeCode: values.employeeCode.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    alternatePhone: optionalString(values.alternatePhone),
    dateOfBirth: optionalString(values.dateOfBirth),
    licenseIssueDate: optionalString(values.licenseIssueDate),
    address: optionalString(values.address),
    city: optionalString(values.city),
    state: optionalString(values.state),
    country: optionalString(values.country),
    postalCode: optionalString(values.postalCode),
    emergencyName: optionalString(values.emergencyName),
    emergencyPhone: optionalString(values.emergencyPhone),
    bloodGroup: optionalString(values.bloodGroup) as DriverFormValues['bloodGroup'],
    photo: optionalString(values.photo),
    remarks: optionalString(values.remarks),
  });

  return (
    <>
      <motion.form
        id="driver-form"
        className="space-y-5 pb-28"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(clean(values));
        })}
      >
        <FormSection title="Personal Information">
          <FormField label="First Name" htmlFor="firstName" required error={errors.firstName?.message}>
            <Input
              id="firstName"
              autoComplete="given-name"
              maxLength={FORM_LIMITS.name}
              placeholder={PLACEHOLDERS.firstName}
              {...enhanceRegister(register('firstName'), {
                transform: (v) => capitalizeWords(lettersOnly(v, FORM_LIMITS.name)),
              })}
            />
          </FormField>
          <FormField label="Last Name" htmlFor="lastName" required error={errors.lastName?.message}>
            <Input
              id="lastName"
              autoComplete="family-name"
              maxLength={FORM_LIMITS.name}
              placeholder={PLACEHOLDERS.lastName}
              {...enhanceRegister(register('lastName'), {
                transform: (v) => capitalizeWords(lettersOnly(v, FORM_LIMITS.name)),
              })}
            />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={FORM_LIMITS.email}
              placeholder={PLACEHOLDERS.email}
              {...enhanceRegister(register('email'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.email).toLowerCase(),
              })}
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone" required error={errors.phone?.message}>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={FORM_LIMITS.phone}
              placeholder={PLACEHOLDERS.phone}
              {...enhanceRegister(register('phone'), {
                transform: (v) => digitsOnly(v, FORM_LIMITS.phone),
              })}
            />
          </FormField>
          <FormField label="Date of Birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
            <Controller
              name="dateOfBirth"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="dateOfBirth"
                  value={field.value}
                  onChange={field.onChange}
                  disableFuture
                />
              )}
            />
          </FormField>
          <FormField
            label="Alternate Phone"
            htmlFor="alternatePhone"
            error={errors.alternatePhone?.message}
          >
            <Input
              id="alternatePhone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={FORM_LIMITS.phone}
              placeholder={PLACEHOLDERS.phone}
              {...enhanceRegister(register('alternatePhone'), {
                transform: (v) => digitsOnly(v, FORM_LIMITS.phone),
              })}
            />
          </FormField>
        </FormSection>

        <FormSection title="License">
          <FormField
            label="License Number"
            htmlFor="licenseNumber"
            required
            error={errors.licenseNumber?.message}
          >
            <Input
              id="licenseNumber"
              autoComplete="off"
              maxLength={FORM_LIMITS.licenseNumber}
              placeholder={PLACEHOLDERS.licenseNumber}
              {...enhanceRegister(register('licenseNumber'), {
                transform: (v) => uppercase(sanitizeTextInput(v), FORM_LIMITS.licenseNumber),
              })}
            />
          </FormField>
          <FormField
            label="Category"
            htmlFor="licenseCategory"
            required
            error={errors.licenseCategory?.message}
          >
            <Select
              value={watch('licenseCategory')}
              onValueChange={(value) =>
                setValue('licenseCategory', value as LicenseCategory, { shouldValidate: true })
              }
            >
              <SelectTrigger id="licenseCategory">
                <SelectValue placeholder="Select license category" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(LicenseCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label="Issue Date"
            htmlFor="licenseIssueDate"
            error={errors.licenseIssueDate?.message}
          >
            <Controller
              name="licenseIssueDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="licenseIssueDate"
                  value={field.value}
                  onChange={field.onChange}
                  disableFuture
                />
              )}
            />
          </FormField>
          <FormField
            label="Expiry Date"
            htmlFor="licenseExpiryDate"
            required
            description="Driver cannot be assigned after expiry date."
            error={errors.licenseExpiryDate?.message}
          >
            <Controller
              name="licenseExpiryDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="licenseExpiryDate"
                  value={field.value}
                  onChange={field.onChange}
                  requireFuture
                  minDate={watch('licenseIssueDate') || undefined}
                  aria-invalid={Boolean(errors.licenseExpiryDate)}
                />
              )}
            />
          </FormField>
        </FormSection>

        <FormSection title="Employment">
          <FormField
            label="Employee Code"
            htmlFor="employeeCode"
            required
            error={errors.employeeCode?.message}
          >
            <Input
              id="employeeCode"
              autoComplete="off"
              maxLength={FORM_LIMITS.employeeCode}
              placeholder={PLACEHOLDERS.employeeCode}
              {...enhanceRegister(register('employeeCode'), {
                transform: (v) => uppercase(sanitizeTextInput(v), FORM_LIMITS.employeeCode),
              })}
            />
          </FormField>
          <FormField
            label="Joining Date"
            htmlFor="joiningDate"
            required
            error={errors.joiningDate?.message}
          >
            <Controller
              name="joiningDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="joiningDate"
                  value={field.value}
                  onChange={field.onChange}
                  disableFuture
                  aria-invalid={Boolean(errors.joiningDate)}
                />
              )}
            />
          </FormField>
          <FormField
            label="Experience (years)"
            htmlFor="experienceYears"
            error={errors.experienceYears?.message}
          >
            <Input
              id="experienceYears"
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              {...register('experienceYears')}
            />
          </FormField>
          <FormField label="Status" htmlFor="status" error={errors.status?.message}>
            <Select
              value={watch('status')}
              onValueChange={(value) =>
                setValue('status', value as DriverStatus, { shouldValidate: true })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select driver status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DriverStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormSection>

        <FormSection title="Address">
          <FormField
            label="Address"
            htmlFor="address"
            error={errors.address?.message}
            className="md:col-span-2"
          >
            <Input
              id="address"
              autoComplete="street-address"
              maxLength={FORM_LIMITS.text}
              placeholder="Example: 42, Ring Road, Satellite"
              {...enhanceRegister(register('address'), {
                transform: (v) => sanitizeTextInput(v, FORM_LIMITS.text),
              })}
            />
          </FormField>
          <FormField label="City" htmlFor="city" error={errors.city?.message}>
            <Input
              id="city"
              autoComplete="address-level2"
              maxLength={FORM_LIMITS.name}
              placeholder={PLACEHOLDERS.city}
              {...enhanceRegister(register('city'), {
                transform: (v) => capitalizeWords(lettersOnly(v, FORM_LIMITS.name)),
              })}
            />
          </FormField>
          <FormField label="State" htmlFor="state" error={errors.state?.message}>
            <Select
              value={watch('state') || undefined}
              onValueChange={(value) => setValue('state', value, { shouldValidate: true })}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Country" htmlFor="country" error={errors.country?.message}>
            <Select
              value={watch('country') || undefined}
              onValueChange={(value) => setValue('country', value, { shouldValidate: true })}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Postal Code" htmlFor="postalCode" error={errors.postalCode?.message}>
            <Input
              id="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={FORM_LIMITS.postalCode}
              placeholder={PLACEHOLDERS.postalCode}
              {...enhanceRegister(register('postalCode'), {
                transform: (v) => digitsOnly(v, FORM_LIMITS.postalCode),
              })}
            />
          </FormField>
        </FormSection>

        <FormSection title="Emergency Contact">
          <FormField label="Contact Name" htmlFor="emergencyName" error={errors.emergencyName?.message}>
            <Input
              id="emergencyName"
              autoComplete="name"
              maxLength={FORM_LIMITS.name}
              placeholder={PLACEHOLDERS.name}
              {...enhanceRegister(register('emergencyName'), {
                transform: (v) => capitalizeWords(lettersOnly(v, FORM_LIMITS.name)),
              })}
            />
          </FormField>
          <FormField
            label="Contact Phone"
            htmlFor="emergencyPhone"
            error={errors.emergencyPhone?.message}
          >
            <Input
              id="emergencyPhone"
              type="tel"
              inputMode="numeric"
              maxLength={FORM_LIMITS.phone}
              placeholder={PLACEHOLDERS.phone}
              {...enhanceRegister(register('emergencyPhone'), {
                transform: (v) => digitsOnly(v, FORM_LIMITS.phone),
              })}
            />
          </FormField>
        </FormSection>

        <FormSection title="Other">
          <FormField label="Blood Group" htmlFor="bloodGroup" error={errors.bloodGroup?.message}>
            <Select
              value={watch('bloodGroup') || undefined}
              onValueChange={(value) => setValue('bloodGroup', value, { shouldValidate: true })}
            >
              <SelectTrigger id="bloodGroup">
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUP_OPTIONS.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label="Photo URL"
            htmlFor="photo"
            description="Paste a publicly accessible image URL for the driver photo."
            error={errors.photo?.message}
          >
            <Input
              id="photo"
              type="url"
              inputMode="url"
              autoComplete="off"
              maxLength={FORM_LIMITS.url}
              placeholder={PLACEHOLDERS.photoUrl}
              {...register('photo')}
            />
          </FormField>
          <FormField
            label="Safety Score"
            htmlFor="safetyScore"
            description="Score from 0 to 100 based on driving history."
            error={errors.safetyScore?.message}
          >
            <Input
              id="safetyScore"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              {...register('safetyScore')}
            />
          </FormField>
          <FormField
            label="Remarks"
            htmlFor="remarks"
            error={errors.remarks?.message}
            className="md:col-span-2"
          >
            <CharacterCountTextarea
              id="remarks"
              rows={3}
              maxLength={FORM_LIMITS.textarea}
              placeholder={PLACEHOLDERS.notes}
              {...register('remarks')}
            />
          </FormField>
        </FormSection>
      </motion.form>

      <FormActionBar
        formId="driver-form"
        submitting={submitting}
        submitLabel={submitLabel}
        onCancel={onCancel}
        isDirty={isDirty}
      />
    </>
  );
}
