'use client';

import type { Transition, Variants } from 'framer-motion';

export const driverEase: Transition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
};

export const pageFade: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: driverEase,
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: driverEase,
  },
};

export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: driverEase,
  },
};

export const tableRowReveal: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: driverEase,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.18 },
  },
};

export const actionBarSlide: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ...driverEase, delay: 0.12 },
  },
};
