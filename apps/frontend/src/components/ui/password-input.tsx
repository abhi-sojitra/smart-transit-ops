'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/input';
import { getPasswordStrength } from '@/utils/form-validation';

export interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  showStrength?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength = false, value, defaultValue, onChange, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const [internal, setInternal] = React.useState(String(defaultValue ?? ''));
    const current = value !== undefined ? String(value) : internal;
    const strength = showStrength ? getPasswordStrength(current) : null;

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? 'text' : 'password'}
            autoComplete={props.autoComplete ?? 'current-password'}
            className={cn('pr-10', className)}
            value={value}
            defaultValue={defaultValue}
            onChange={(e) => {
              if (value === undefined) setInternal(e.target.value);
              onChange?.(e);
            }}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {showStrength && strength ? (
          <div className="space-y-2" aria-live="polite">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <span
                  key={level}
                  className={cn(
                    'h-1 flex-1 rounded-full bg-muted transition-colors',
                    strength.score >= level &&
                      (strength.score <= 2
                        ? 'bg-destructive'
                        : strength.score <= 3
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'),
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Strength: {strength.label}</p>
            <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              {strength.checks.map((check) => (
                <li
                  key={check.label}
                  className={cn(check.met && 'text-emerald-600 dark:text-emerald-400')}
                >
                  {check.met ? '✓' : '○'} {check.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
