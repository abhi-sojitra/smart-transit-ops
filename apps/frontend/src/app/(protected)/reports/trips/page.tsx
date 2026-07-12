'use client';

import { ReportWorkspace } from '@/components/reports/report-workspace';

export default function Page() {
  return (
    <ReportWorkspace
      type="trips"
      title="Trip Report"
      description="Success rate, routes, delays, and revenue mix."
    />
  );
}
