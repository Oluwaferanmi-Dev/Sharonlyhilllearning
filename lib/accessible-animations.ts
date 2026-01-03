"use client"

import type { Variants } from "framer-motion"

// Accessible variants that respect motion preferences
export const accessibleFadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

export const accessibleSlideInUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
}

export const accessibleScaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2 },
  },
}

// Container for staggered children that respects accessibility
export const accessibleContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const accessibleItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
}

// Utility for creating custom transition configs that respect motion preferences
export function createAccessibleTransition(normalDuration = 0.5) {
  return {
    normal: { duration: normalDuration },
    reduced: { duration: 0.1 }, // Minimal but still visible
  }
}
