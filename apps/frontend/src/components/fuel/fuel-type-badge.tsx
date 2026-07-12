'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { FuelType } from '@transitops/shared-types';

const LABELS: Record<FuelType, string> = {
  [FuelType.DIESEL]: 'Diesel',
  [FuelType.PETROL]: 'Petrol',
  [FuelType.CNG]: 'CNG',
  [FuelType.ELECTRIC]: 'Electric',
  [FuelType.HYBRID]: 'Hybrid',
  [FuelType.OTHER]: 'Other',
};

export function FuelTypeBadge({ type }: { type: FuelType | string }) {
  const reduceMotion = useReducedMotion();
  const label = LABELS[type as FuelType] ?? String(type).replaceAll('_', ' ');

  return (
    <motion.span
      key={type}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex"
    >
      <Badge status={type}>{label}</Badge>
    </motion.span>
  );
}
