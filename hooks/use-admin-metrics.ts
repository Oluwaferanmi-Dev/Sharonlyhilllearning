"use client"

import { useEffect, useState } from "react"

interface AdminMetrics {
  totalStaff: number
  topicsStarted: number
  topicsCompleted: number
  topicsPassed: number
  averageScore: number
}

interface RecentStaff {
  id: string
  first_name: string
  last_name: string
  email: string
  department: string
  created_at: string
}

interface AdminMetricsResponse {
  metrics: AdminMetrics
  recentStaff: RecentStaff[]
  payment: any
}

interface UseAdminMetricsReturn {
  metrics: AdminMetrics | null
  recentStaff: RecentStaff[]
  payment: any
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAdminMetrics(enabled = true): UseAdminMetricsReturn {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [recentStaff, setRecentStaff] = useState<RecentStaff[]>([])
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Fetching admin metrics hook")

      const response = await fetch("/api/admin/metrics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch metrics")
      }

      const data: AdminMetricsResponse = await response.json()

      console.log("[v0] Metrics received:", data.metrics)

      setMetrics(data.metrics)
      setRecentStaff(data.recentStaff || [])
      setPayment(data.payment)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch metrics"
      console.error("[v0] Metrics fetch error:", message)
      setError(message)
      setMetrics({
        totalStaff: 0,
        topicsStarted: 0,
        topicsCompleted: 0,
        topicsPassed: 0,
        averageScore: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!enabled) return

    // Fetch on mount
    fetchMetrics()

    const interval = setInterval(fetchMetrics, 30000)

    return () => clearInterval(interval)
  }, [enabled])

  return {
    metrics,
    recentStaff,
    payment,
    loading,
    error,
    refetch: fetchMetrics,
  }
}
