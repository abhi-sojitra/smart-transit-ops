'use client';

import { ReportWorkspace } from '@/components/reports/report-workspace';

export default function Page() {
  return (
    <ReportWorkspace
      type="drivers"
      title="Driver Report"
      description="Productivity, revenue, safety, and license risk."
    />
  );
}
