'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from '@/utils/toast';
import { cn } from '@/utils/cn';

interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let id = 0;
    const push = (type: 'success' | 'error') => (message: string) => {
      const next = { id: ++id, type, message };
      setItems((prev) => [...prev, next]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== next.id));
      }, 3500);
    };
    const offSuccess = toast.subscribe('success', push('success'));
    const offError = toast.subscribe('error', push('error'));
    return () => {
      offSuccess();
      offError();
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg',
            item.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-400',
          )}
        >
          {item.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}
