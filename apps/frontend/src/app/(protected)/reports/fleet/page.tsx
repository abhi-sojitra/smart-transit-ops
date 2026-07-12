'use client';

import { ReportWorkspace } from '@/components/reports/report-workspace';

export default function Page() {
  return (
    <ReportWorkspace
      type="fleet"
      title="Fleet Report"
      description="Utilization, downtime, ROI, and vehicle health."
    />
  );
}
