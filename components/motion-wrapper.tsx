"use client"

import { motion, type Variants } from "framer-motion"
import type { ReactNode } from "react"

interface MotionWrapperProps {
  children: ReactNode
  variants?: Variants
  className?: string
  delay?: number
}

export function MotionWrapper({ children, variants, className, delay = 0 }: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
