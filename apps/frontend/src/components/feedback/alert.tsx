import { cn } from '@/utils/cn';

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    warning: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    danger: 'border-red-500/30 bg-red-500/10 text-red-400',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  } as const;

  return (
    <div className={cn('rounded-lg border px-3 py-2 text-sm', styles[variant], className)}>
      {title ? <p className="mb-1 font-medium">{title}</p> : null}
      {children}
    </div>
  );
}
