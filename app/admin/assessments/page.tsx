"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, ChevronRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface Level {
  id: string
  name: string
  order_index: number
  description?: string
  price_per_token?: number
  price_currency?: string
}

interface Topic {
  id: string
  level_id: string
  name: string
  description?: string
  order_index: number
}

export default function AssessmentsPage() {
  const [levels, setLevels] = useState<Level[]>([])
  const [topics, setTopics] = useState<Map<string, Topic[]>>(new Map())
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(["1"])) // Expand first level by default
  const [isLoading, setIsLoading] = useState(true)
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load levels
        const { data: levelsData, error: levelsError } = await supabase
          .from("assessment_levels")
          .select("*")
          .order("order_index")

        if (levelsError) throw levelsError
        setLevels(levelsData || [])

        // Load topics grouped by level
        const { data: topicsData, error: topicsError } = await supabase
          .from("assessment_topics")
          .select("*")
          .order("order_index")

        if (topicsError) throw topicsError

        const topicsByLevel = new Map<string, Topic[]>()
        ;(topicsData || []).forEach((topic) => {
          const levelTopics = topicsByLevel.get(topic.level_id) || []
          levelTopics.push(topic)
          topicsByLevel.set(topic.level_id, levelTopics)
        })

        setTopics(topicsByLevel)
      } catch (err) {
        console.error("[v0] Error loading assessments:", err)
        toast({
          title: "Error",
          description: "Failed to load assessments",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase, toast])

  const toggleLevel = (levelId: string) => {
    const newExpanded = new Set(expandedLevels)
    if (newExpanded.has(levelId)) {
      newExpanded.delete(levelId)
    } else {
      newExpanded.add(levelId)
    }
    setExpandedLevels(newExpanded)
  }

  const handleUpdatePrice = async (levelId: string, newPrice: number) => {
    if (newPrice < 0) {
      toast({
        title: "Invalid Price",
        description: "Price must be non-negative",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/levels/${levelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_per_token: newPrice }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update price")
      }

      const { level } = await response.json()

      // Update local state
      setLevels((prevLevels) =>
        prevLevels.map((l) => (l.id === levelId ? { ...l, price_per_token: level.price_per_token } : l))
      )

      setEditingLevelId(null)
      setEditingPrice(null)

      toast({
        title: "Price Updated",
        description: `Price for ${level.name} updated to ${level.price_per_token}`,
      })
    } catch (err: any) {
      console.error("[v0] Price update error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update price",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-slate-600">Loading assessments...</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-12 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">Manage Assessments</h1>
        </div>
        <p className="text-slate-600">View and edit assessment levels, topics, and questions</p>
      </motion.div>

      {/* Levels and Topics */}
      <div className="space-y-4">
        {levels.map((level, levelIdx) => {
          const isExpanded = expandedLevels.has(level.id)
          const levelTopics = topics.get(level.id) || []

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: levelIdx * 0.05 }}
            >
              <Card>
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleLevel(level.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <ChevronRight
                        className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                      <div>
                        <CardTitle className="text-lg">{level.name} Level</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{levelTopics.length} {levelTopics.length === 1 ? "topic" : "topics"}</span>
                          {editingLevelId === level.id ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Editing price...
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">
                              Price: {level.price_per_token || 0} {level.price_currency || "NGN"}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    {/* Price Management Section */}
                    <div className="mb-6 pb-6 border-b border-slate-200">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">Token Price</p>
                            <p className="text-xs text-slate-600">Price per token in NGN</p>
                          </div>
                          {editingLevelId === level.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editingPrice ?? ""}
                                onChange={(e) => setEditingPrice(parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                                placeholder="0"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingLevelId(null)
                                  setEditingPrice(null)
                                }}
                                disabled={isSaving}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleUpdatePrice(level.id, editingPrice ?? 0)}
                                disabled={isSaving || editingPrice === null}
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-slate-900">
                                {level.price_per_token || 0} {level.price_currency || "NGN"}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingLevelId(level.id)
                                  setEditingPrice(level.price_per_token || 0)
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Topics Section */}
                    <div className="space-y-3">
                      <p className="font-semibold text-slate-900 text-sm mb-3">Topics</p>
                      {levelTopics.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4">No topics yet for this level</p>
                      ) : (
                        levelTopics.map((topic, topicIdx) => (
                          <motion.div
                            key={topic.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: topicIdx * 0.05 }}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{topic.name}</p>
                              <p className="text-xs text-slate-600 mt-1">{topic.description || "No description"}</p>
                            </div>
                            <Link href={`/admin/assessments/${topic.id}`}>
                              <Button variant="outline" size="sm">
                                Manage
                              </Button>
                            </Link>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {levels.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-900">No assessment levels found. Please contact an administrator.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
