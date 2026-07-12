'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';
import { Textarea } from '@/components/ui/textarea';

export interface CharacterCountTextareaProps extends React.ComponentProps<'textarea'> {
  maxLength: number;
  showCounter?: boolean;
}

export const CharacterCountTextarea = React.forwardRef<
  HTMLTextAreaElement,
  CharacterCountTextareaProps
>(({ className, maxLength, showCounter = true, value, defaultValue, onChange, ...props }, ref) => {
  const [internal, setInternal] = React.useState(String(defaultValue ?? ''));
  const current = value !== undefined ? String(value) : internal;
  const length = current.length;

  return (
    <div className="space-y-1">
      <Textarea
        ref={ref}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        className={cn(className)}
        onChange={(e) => {
          if (value === undefined) setInternal(e.target.value);
          onChange?.(e);
        }}
        {...props}
      />
      {showCounter ? (
        <p
          className={cn(
            'text-right text-xs text-muted-foreground',
            length >= maxLength && 'text-amber-600 dark:text-amber-400',
          )}
          aria-live="polite"
        >
          {length}/{maxLength}
        </p>
      ) : null}
    </div>
  );
});
CharacterCountTextarea.displayName = 'CharacterCountTextarea';
