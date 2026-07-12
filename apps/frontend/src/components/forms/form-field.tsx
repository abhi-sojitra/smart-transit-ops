import { cloneElement, isValidElement, type ReactElement } from 'react';
import { cn } from '@/utils/cn';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, description, error, children, className }: FormFieldProps) {
  const enhancedChild =
    isValidElement(children)
      ? cloneElement(children as ReactElement<{ className?: string; 'aria-invalid'?: boolean }>, {
          'aria-invalid': Boolean(error) || undefined,
          className: cn(
            (children as ReactElement<{ className?: string }>).props.className,
            error && 'border-destructive focus-visible:ring-destructive',
          ),
        })
      : children;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor} className={cn(error && 'text-destructive')}>
        {label}
      </Label>
      {enhancedChild}
      {description && !error ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? (
        <p className="mt-1 text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
