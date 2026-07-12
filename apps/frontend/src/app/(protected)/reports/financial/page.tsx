'use client';

import { ReportWorkspace } from '@/components/reports/report-workspace';

export default function Page() {
  return (
    <ReportWorkspace
      type="financial"
      title="Financial Report"
      description="Revenue, operational cost, profit, and margins."
    />
  );
}
