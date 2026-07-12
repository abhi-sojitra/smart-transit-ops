'use client';

import { ReportWorkspace } from '@/components/reports/report-workspace';

export default function Page() {
  return (
    <ReportWorkspace
      type="maintenance"
      title="Maintenance Report"
      description="Active/overdue work, vendors, and cost trends."
    />
  );
}
