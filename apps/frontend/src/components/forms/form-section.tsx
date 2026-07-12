'use client';

import { motion } from 'framer-motion';
import { staggerItem } from '@/components/drivers/motion';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <motion.section
      variants={staggerItem}
      className={`space-y-4 rounded-xl border border-border bg-card/40 p-4 md:p-5 ${className ?? ''}`}
    >
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </motion.section>
  );
}
