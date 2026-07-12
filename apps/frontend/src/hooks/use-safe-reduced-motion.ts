'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Hydration-safe reduced-motion preference.
 * Framer's useReducedMotion() is null/false on the server and may flip on the
 * client, which changes motion `initial` styles and causes hydration mismatches.
 * This hook stays `false` until after mount so SSR and the first client render match.
 */
export function useSafeReducedMotion(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? Boolean(prefersReducedMotion) : false;
}
