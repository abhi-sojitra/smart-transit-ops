'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Stepper } from '@/components/forms/stepper';
import { FormField } from '@/components/forms/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const steps = ['Trip Details', 'Route & Schedule', 'Driver & Vehicle'];

const tripSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  departureTime: z.string().optional(),
  estimatedArrival: z.string().optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
});

type TripValues = z.infer<typeof tripSchema>;

export default function TripsPage() {
  const [step, setStep] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TripValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      tripId: 'TR-9001',
      origin: '',
      destination: '',
    },
  });

  const onSubmit = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      return;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Trips & Dispatch' }]} />
        <PageHeader
          title="Trip Dispatcher"
          description="Create and assign trips with a guided multi-step flow."
        />
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <Stepper steps={steps} currentStep={step} />

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {step === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Trip ID" htmlFor="tripId" error={errors.tripId?.message}>
                  <Input id="tripId" {...register('tripId')} />
                </FormField>
                <FormField label="Origin" htmlFor="origin" error={errors.origin?.message}>
                  <Input id="origin" placeholder="Chicago, IL" {...register('origin')} />
                </FormField>
                <FormField
                  label="Destination"
                  htmlFor="destination"
                  error={errors.destination?.message}
                  className="md:col-span-2"
                >
                  <Input id="destination" placeholder="Detroit, MI" {...register('destination')} />
                </FormField>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Departure Time" htmlFor="departureTime">
                  <Input id="departureTime" type="datetime-local" {...register('departureTime')} />
                </FormField>
                <FormField label="Estimated Arrival" htmlFor="estimatedArrival">
                  <Input
                    id="estimatedArrival"
                    type="datetime-local"
                    {...register('estimatedArrival')}
                  />
                </FormField>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Vehicle" htmlFor="vehicleId">
                  <Select onValueChange={(value) => setValue('vehicleId', value)}>
                    <SelectTrigger id="vehicleId">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VH-1001">VH-1001</SelectItem>
                      <SelectItem value="VH-1003">VH-1003</SelectItem>
                      <SelectItem value="VH-1004">VH-1004</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Driver" htmlFor="driverId">
                  <Select onValueChange={(value) => setValue('driverId', value)}>
                    <SelectTrigger id="driverId">
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DR-204">Maya Chen</SelectItem>
                      <SelectItem value="DR-188">Jordan Lee</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            ) : null}

            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              Validation demo: vehicle capacity checks will be enforced when dispatch APIs are
              connected.
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </Button>
              <Button type="submit">{step === steps.length - 1 ? 'Dispatch Trip' : 'Continue'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
