'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'framer-motion';
import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUiStore } from '@/store';
import { actionBarSlide, staggerContainer, staggerItem } from '@/components/drivers/motion';
import {
  BloodGroup,
  DriverStatus,
  LicenseCategory,
  type DriverFormValues,
} from '@/types/driver';

const phoneRegex = /^\+?[0-9]{10,15}$/;

const driverFormSchema = z
  .object({
    employeeCode: z
      .string()
      .min(2, 'Employee code is required')
      .max(32)
      .regex(/^[A-Za-z0-9-_]+$/, 'Only letters, numbers, hyphens, and underscores'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Enter a valid email'),
    phone: z.string().regex(phoneRegex, 'Enter a valid phone number'),
    alternatePhone: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((v) => !v || phoneRegex.test(v), 'Enter a valid phone number'),
    dateOfBirth: z.string().optional(),
    joiningDate: z.string().min(1, 'Joining date is required'),
    licenseNumber: z.string().min(5, 'License number is required').max(40),
    licenseCategory: z.nativeEnum(LicenseCategory),
    licenseIssueDate: z.string().optional(),
    licenseExpiryDate: z.string().min(1, 'License expiry is required'),
    experienceYears: z.coerce.number().min(0).max(60),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((v) => !v || phoneRegex.test(v), 'Enter a valid phone number'),
    bloodGroup: z.nativeEnum(BloodGroup).optional(),
    photo: z.string().optional(),
    remarks: z.string().max(500).optional(),
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
        message: 'License expiry must be greater than today',
      });
    }
    if (data.licenseIssueDate) {
      const issue = new Date(data.licenseIssueDate);
      if (!Number.isNaN(issue.getTime()) && expiry.getTime() < issue.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['licenseExpiryDate'],
          message: 'Expiry must be on or after issue date',
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
  bloodGroup: BloodGroup.UNKNOWN,
  photo: '',
  remarks: '',
  status: DriverStatus.AVAILABLE,
  safetyScore: 100,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      variants={staggerItem}
      className="space-y-4 rounded-xl border border-border bg-card/40 p-4 md:p-5"
    >
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </motion.section>
  );
}

export function DriverForm({
  defaultValues,
  submitting,
  submitLabel = 'Save Driver',
  onSubmit,
  onCancel,
}: DriverFormProps) {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const reduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DriverFormSchema>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: { ...emptyDefaults, ...defaultValues },
  });

  const clean = (values: DriverFormSchema): DriverFormValues => {
    const optional = (v?: string) => (v && v.trim() ? v.trim() : undefined);
    return {
      ...values,
      employeeCode: values.employeeCode.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      alternatePhone: optional(values.alternatePhone),
      dateOfBirth: optional(values.dateOfBirth),
      licenseIssueDate: optional(values.licenseIssueDate),
      address: optional(values.address),
      city: optional(values.city),
      state: optional(values.state),
      country: optional(values.country),
      postalCode: optional(values.postalCode),
      emergencyName: optional(values.emergencyName),
      emergencyPhone: optional(values.emergencyPhone),
      photo: optional(values.photo),
      remarks: optional(values.remarks),
    };
  };

  const actionBarLeft = isDesktop ? (sidebarCollapsed ? 72 : 260) : 0;

  return (
    <>
      <motion.form
        id="driver-form"
        className="space-y-5 pb-28"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(clean(values));
        })}
      >
        <Section title="Personal Information">
          <FormField label="First Name" htmlFor="firstName" error={errors.firstName?.message}>
            <Input id="firstName" {...register('firstName')} />
          </FormField>
          <FormField label="Last Name" htmlFor="lastName" error={errors.lastName?.message}>
            <Input id="lastName" {...register('lastName')} />
          </FormField>
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register('email')} />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" placeholder="+919876543210" {...register('phone')} />
          </FormField>
          <FormField label="Date of Birth" htmlFor="dateOfBirth" error={errors.dateOfBirth?.message}>
            <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
          </FormField>
          <FormField
            label="Alternate Phone"
            htmlFor="alternatePhone"
            error={errors.alternatePhone?.message}
          >
            <Input id="alternatePhone" {...register('alternatePhone')} />
          </FormField>
        </Section>

        <Section title="License">
          <FormField
            label="License Number"
            htmlFor="licenseNumber"
            error={errors.licenseNumber?.message}
          >
            <Input id="licenseNumber" {...register('licenseNumber')} />
          </FormField>
          <FormField
            label="Category"
            htmlFor="licenseCategory"
            error={errors.licenseCategory?.message}
          >
            <Select
              value={watch('licenseCategory')}
              onValueChange={(value) =>
                setValue('licenseCategory', value as LicenseCategory, { shouldValidate: true })
              }
            >
              <SelectTrigger id="licenseCategory">
                <SelectValue placeholder="Select category" />
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
            <Input id="licenseIssueDate" type="date" {...register('licenseIssueDate')} />
          </FormField>
          <FormField
            label="Expiry Date"
            htmlFor="licenseExpiryDate"
            error={errors.licenseExpiryDate?.message}
          >
            <Input id="licenseExpiryDate" type="date" {...register('licenseExpiryDate')} />
          </FormField>
        </Section>

        <Section title="Employment">
          <FormField
            label="Employee Code"
            htmlFor="employeeCode"
            error={errors.employeeCode?.message}
          >
            <Input id="employeeCode" {...register('employeeCode')} />
          </FormField>
          <FormField label="Joining Date" htmlFor="joiningDate" error={errors.joiningDate?.message}>
            <Input id="joiningDate" type="date" {...register('joiningDate')} />
          </FormField>
          <FormField
            label="Experience (years)"
            htmlFor="experienceYears"
            error={errors.experienceYears?.message}
          >
            <Input id="experienceYears" type="number" min={0} {...register('experienceYears')} />
          </FormField>
          <FormField label="Status" htmlFor="status" error={errors.status?.message}>
            <Select
              value={watch('status')}
              onValueChange={(value) =>
                setValue('status', value as DriverStatus, { shouldValidate: true })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Status" />
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
        </Section>

        <Section title="Address">
          <FormField
            label="Address"
            htmlFor="address"
            error={errors.address?.message}
            className="md:col-span-2"
          >
            <Input id="address" {...register('address')} />
          </FormField>
          <FormField label="City" htmlFor="city" error={errors.city?.message}>
            <Input id="city" {...register('city')} />
          </FormField>
          <FormField label="State" htmlFor="state" error={errors.state?.message}>
            <Input id="state" {...register('state')} />
          </FormField>
          <FormField label="Country" htmlFor="country" error={errors.country?.message}>
            <Input id="country" {...register('country')} />
          </FormField>
          <FormField label="Postal Code" htmlFor="postalCode" error={errors.postalCode?.message}>
            <Input id="postalCode" {...register('postalCode')} />
          </FormField>
        </Section>

        <Section title="Emergency Contact">
          <FormField label="Name" htmlFor="emergencyName" error={errors.emergencyName?.message}>
            <Input id="emergencyName" {...register('emergencyName')} />
          </FormField>
          <FormField label="Phone" htmlFor="emergencyPhone" error={errors.emergencyPhone?.message}>
            <Input id="emergencyPhone" {...register('emergencyPhone')} />
          </FormField>
        </Section>

        <Section title="Other">
          <FormField label="Blood Group" htmlFor="bloodGroup" error={errors.bloodGroup?.message}>
            <Select
              value={watch('bloodGroup')}
              onValueChange={(value) =>
                setValue('bloodGroup', value as BloodGroup, { shouldValidate: true })
              }
            >
              <SelectTrigger id="bloodGroup">
                <SelectValue placeholder="Blood group" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BloodGroup).map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label="Photo URL"
            htmlFor="photo"
            description="Paste an image URL for the driver photo."
            error={errors.photo?.message}
          >
            <Input id="photo" placeholder="https://..." {...register('photo')} />
          </FormField>
          <FormField
            label="Safety Score"
            htmlFor="safetyScore"
            error={errors.safetyScore?.message}
          >
            <Input id="safetyScore" type="number" min={0} max={100} {...register('safetyScore')} />
          </FormField>
          <FormField
            label="Remarks"
            htmlFor="remarks"
            error={errors.remarks?.message}
            className="md:col-span-2"
          >
            <Textarea id="remarks" rows={3} {...register('remarks')} />
          </FormField>
        </Section>
      </motion.form>

      <motion.div
        className="fixed bottom-0 right-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur transition-[left] duration-200 md:px-6"
        style={{ left: actionBarLeft }}
        variants={actionBarSlide}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" form="driver-form" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
