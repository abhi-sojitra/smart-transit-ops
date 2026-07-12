'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { FormSkeleton } from './form-skeleton';

interface FormShellProps {
  children: React.ReactNode;
  /** Initial data fetch (show skeleton instead of empty form). */
  fetching?: boolean;
  /** Submit/mutation in flight (overlay + block interaction). */
  submitting?: boolean;
  skeletonFields?: number;
  className?: string;
}

/** Wraps form content with fetch skeleton and submit overlay while APIs run. */
export function FormShell({
  children,
  fetching,
  submitting,
  skeletonFields,
  className,
}: FormShellProps) {
  if (fetching) {
    return <FormSkeleton fields={skeletonFields} className={className} />;
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'min-w-0',
          submitting && 'pointer-events-none select-none opacity-60',
        )}
      >
        {children}
      </div>
      {submitting ? (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-[1px]"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">Saving…</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
