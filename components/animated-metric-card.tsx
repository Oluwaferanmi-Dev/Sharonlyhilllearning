"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"

interface AnimatedMetricCardProps {
  title: string
  value: number | string
  label: string
  icon: ReactNode
  color: "blue" | "green" | "purple"
  index?: number
}

const colorMap = {
  blue: "text-blue-600",
  green: "text-green-600",
  purple: "text-purple-600",
}

export function AnimatedMetricCard({ title, value, label, icon, color, index = 0 }: AnimatedMetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.1)" }}
      className="h-full"
    >
      <Card className="border-0 shadow-sm bg-white hover:shadow-lg transition-shadow">
        <CardHeader className="space-y-0 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
              className={`w-4 h-4 ${colorMap[color]}`}
            >
              {icon}
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
            className="text-3xl font-bold text-slate-900"
          >
            {value}
          </motion.p>
          <p className="text-xs text-slate-600 mt-2">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
