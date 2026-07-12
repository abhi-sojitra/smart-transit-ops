import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SettingsCard({
  title,
  description,
  children,
  className,
  action,
}: SettingsCardProps) {
  return (
    <Card className={cn('border-slate-200 dark:border-slate-700', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="mt-1.5 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
