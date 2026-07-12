import * as React from 'react';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/input';

export interface InputAffixProps extends Omit<React.ComponentProps<'input'>, 'prefix'> {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const InputAffix = React.forwardRef<HTMLInputElement, InputAffixProps>(
  ({ className, prefix, suffix, ...props }, ref) => (
    <div className="relative flex items-center">
      {prefix ? (
        <span className="pointer-events-none absolute left-3 text-sm text-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <Input
        ref={ref}
        className={cn(prefix && 'pl-8', suffix && 'pr-12', className)}
        {...props}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-3 text-xs text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  ),
);
InputAffix.displayName = 'InputAffix';
