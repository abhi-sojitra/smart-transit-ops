'use client';

import { ReportWorkspace } from '@/components/reports/report-workspace';

export default function Page() {
  return (
    <ReportWorkspace
      type="expenses"
      title="Expense Report"
      description="Category spend, approvals, and trends."
    />
  );
}
