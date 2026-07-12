'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

/** Date picker foundation — native input styled to match the design system */
export function DatePicker({ className, ...props }: React.ComponentProps<'input'>) {
  return <Input type="date" className={cn(className)} {...props} />;
}
