'use client';

import { cn } from '@/utils/cn';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full items-center gap-2', className)}>
      {steps.map((step, index) => {
        const active = index === currentStep;
        const done = index < currentStep;
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                done && 'border-primary bg-primary text-primary-foreground',
                active && 'border-primary bg-primary/15 text-primary',
                !done && !active && 'border-border text-muted-foreground',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={cn(
                'hidden text-sm sm:inline',
                active || done ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 ? <div className="mx-2 hidden h-px flex-1 bg-border sm:block" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
