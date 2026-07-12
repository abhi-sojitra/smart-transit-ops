'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

/** Placeholder skeleton while form data is loading from the API. */
export function FormSkeleton({ fields = 6, className }: FormSkeletonProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-36 md:col-span-2" />
    </div>
  );
}
