'use client';

import { ReportWorkspace } from '@/components/reports/report-workspace';

export default function Page() {
  return (
    <ReportWorkspace
      type="executive"
      title="Executive Summary"
      description="Company-wide KPIs, profit, utilization, and leaders."
    />
  );
}
