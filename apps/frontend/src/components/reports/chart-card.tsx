'use client';

import type { BiChartPoint } from '@transitops/shared-types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/empty-state';

const tooltipStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
};

export function ChartCard({
  title,
  description,
  data,
  variant = 'line',
  valueLabel = 'Value',
}: {
  title: string;
  description?: string;
  data?: BiChartPoint[];
  variant?: 'line' | 'bar';
  valueLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {!data?.length ? (
            <EmptyState title="No chart data" className="py-10" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {variant === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name={valueLabel} fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={valueLabel}
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
