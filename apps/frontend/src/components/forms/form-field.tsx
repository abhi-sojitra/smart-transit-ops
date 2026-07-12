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
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description && !error ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
