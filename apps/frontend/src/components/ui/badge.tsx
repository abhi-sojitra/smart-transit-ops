import { cn } from '@/utils/cn';
import { statusColorMap } from '@/constants/status';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
}

export function Badge({ className, status, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        status ? statusColorMap[status] ?? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
