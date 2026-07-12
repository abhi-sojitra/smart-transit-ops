import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

interface SettingsStatProps {
  label: string;
  value: string | number;
  hint?: string;
  loading?: boolean;
  className?: string;
}

export function SettingsStat({ label, value, hint, loading, className }: SettingsStatProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="space-y-2 p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-12" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
