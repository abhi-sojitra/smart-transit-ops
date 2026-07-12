'use client';

import { ReportWorkspace } from '@/components/reports/report-workspace';

export default function Page() {
  return (
    <ReportWorkspace
      type="profitability"
      title="Profitability Report"
      description="ROI and contribution by vehicle and route."
    />
  );
}
