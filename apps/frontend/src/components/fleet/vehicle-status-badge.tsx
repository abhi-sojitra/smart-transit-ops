'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useSafeReducedMotion } from '@/hooks/use-safe-reduced-motion';
import { VehicleStatus } from '@/types/fleet';

const LABELS: Record<VehicleStatus, string> = {
  [VehicleStatus.AVAILABLE]: 'Available',
  [VehicleStatus.ON_TRIP]: 'On Trip',
  [VehicleStatus.MAINTENANCE]: 'Maintenance',
  [VehicleStatus.RETIRED]: 'Retired',
  [VehicleStatus.ACTIVE]: 'Active',
  [VehicleStatus.IN_SERVICE]: 'In Service',
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus | string }) {
  const reduceMotion = useSafeReducedMotion();
  const label = LABELS[status as VehicleStatus] ?? String(status).replaceAll('_', ' ');

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
