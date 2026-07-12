'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ExpenseStatus } from '@transitops/shared-types';

const LABELS: Record<ExpenseStatus, string> = {
  [ExpenseStatus.PENDING]: 'Pending',
  [ExpenseStatus.APPROVED]: 'Approved',
  [ExpenseStatus.REJECTED]: 'Rejected',
};

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus | string }) {
  const reduceMotion = useReducedMotion();
  const label = LABELS[status as ExpenseStatus] ?? String(status).replaceAll('_', ' ');

  return (
    <motion.span
      key={status}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex"
    >
      <Badge status={status}>{label}</Badge>
    </motion.span>
  );
}
