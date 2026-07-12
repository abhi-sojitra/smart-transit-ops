'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { DriverStatus } from '@/types/driver';

const LABELS: Record<DriverStatus, string> = {
  [DriverStatus.AVAILABLE]: 'Available',
  [DriverStatus.ON_TRIP]: 'On Trip',
  [DriverStatus.OFF_DUTY]: 'Off Duty',
  [DriverStatus.SUSPENDED]: 'Suspended',
};

export function DriverStatusBadge({ status }: { status: DriverStatus | string }) {
  const reduceMotion = useReducedMotion();
  const label = LABELS[status as DriverStatus] ?? String(status).replaceAll('_', ' ');

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
