'use client';

import { ReportWorkspace } from '@/components/reports/report-workspace';

export default function Page() {
  return (
    <ReportWorkspace
      type="vehicles"
      title="Vehicle Report"
      description="Per-vehicle trips, costs, revenue, and ROI."
    />
  );
}
