'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store';
import { actionBarSlide } from '@/components/drivers/motion';

interface FormActionBarProps {
  formId: string;
  submitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  isDirty?: boolean;
}

export function FormActionBar({
  formId,
  submitting,
  submitLabel = 'Save',
  onCancel,
  cancelLabel = 'Cancel',
  isDirty,
}: FormActionBarProps) {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const reduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const actionBarLeft = isDesktop ? (sidebarCollapsed ? 72 : 260) : 0;

  return (
    <motion.div
      className="fixed bottom-0 right-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur transition-[left] duration-200 md:px-6"
      style={{ left: actionBarLeft }}
      variants={actionBarSlide}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {isDirty != null ? (
          <p className="text-xs text-muted-foreground">
            {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
          </p>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button type="submit" form={formId} loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
