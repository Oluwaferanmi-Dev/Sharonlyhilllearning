"use client"

import type { Variants } from "framer-motion"

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
}

export const slideInUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export const slideInDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4 },
  },
}

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

export const countUpVariants = (from: number, to: number, duration = 2) => {
  return {
    initial: { value: from },
    animate: { value: to },
    transition: { duration, ease: "easeOut" },
  }
}

// Respects user's prefers-reduced-motion preference
export const getMotionPreference = () => {
  if (typeof window === "undefined") return "normal"
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  return prefersReduced ? "reduce" : "normal"
}

// Returns animation config that respects motion preferences
export const getAnimationConfig = (duration = 0.5) => {
  const prefersReduced = getMotionPreference() === "reduce"
  return prefersReduced ? { duration: 0 } : { duration }
}
