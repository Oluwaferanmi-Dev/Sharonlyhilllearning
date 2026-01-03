"use client"

import { motion, type Variants } from "framer-motion"
import type { ReactNode } from "react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface AccessibleMotionWrapperProps {
  children: ReactNode
  variants?: Variants
  className?: string
  delay?: number
  reducedMotionVariants?: Variants
}

export function AccessibleMotionWrapper({
  children,
  variants,
  className,
  delay = 0,
  reducedMotionVariants,
}: AccessibleMotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion()

  // Use minimal animations if reduced motion is preferred
  const effectiveVariants = prefersReducedMotion && reducedMotionVariants ? reducedMotionVariants : variants

  return (
    <motion.div
      initial={prefersReducedMotion ? "visible" : "hidden"}
      whileInView={prefersReducedMotion ? "visible" : "visible"}
      viewport={{ once: true, margin: "-100px" }}
      variants={prefersReducedMotion ? { visible: { opacity: 1 } } : effectiveVariants}
      transition={prefersReducedMotion ? { delay } : { delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
