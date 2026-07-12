'use client';

import { ReportWorkspace } from '@/components/reports/report-workspace';

export default function Page() {
  return (
    <ReportWorkspace
      type="fuel"
      title="Fuel Report"
      description="Consumption, efficiency, and cost per kilometer."
    />
  );
}
