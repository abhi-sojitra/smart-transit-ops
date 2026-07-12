'use client';

import { useEffect } from 'react';

/** Warn before closing the tab when the form has unsaved changes. */
export function useUnsavedChangesWarning(isDirty: boolean, enabled = true) {
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, enabled]);
}
