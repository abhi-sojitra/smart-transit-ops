import { cloneElement, isValidElement, type ReactElement } from 'react';
import { cn } from '@/utils/cn';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  counter?: string;
}

export function FormField({
  label,
  htmlFor,
  description,
  error,
  required,
  children,
  className,
  counter,
}: FormFieldProps) {
  const enhancedChild = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          className?: string;
          'aria-invalid'?: boolean;
          'aria-describedby'?: string;
        }>,
        {
          'aria-invalid': Boolean(error) || undefined,
          'aria-describedby': error
            ? `${htmlFor}-error`
            : description
              ? `${htmlFor}-description`
              : undefined,
          className: cn(
            (children as ReactElement<{ className?: string }>).props.className,
            error && 'border-destructive focus-visible:ring-destructive',
          ),
        },
      )
    : children;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className={cn(error && 'text-destructive')}>
          {label}
          {required ? (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </Label>
        {counter && !error ? (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {counter}
          </span>
        ) : null}
      </div>
      {enhancedChild}
      {description && !error ? (
        <p id={`${htmlFor}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="mt-1 text-xs font-medium text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
