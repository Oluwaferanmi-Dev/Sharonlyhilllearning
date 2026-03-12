"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Edit2, Plus } from "lucide-react"
import { motion } from "framer-motion"

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: "A" | "B" | "C" | "D"
  explanation?: string
  order_index: number
}

interface QuestionListProps {
  topicId: string
  topicName: string
  onAddNew?: () => void
  onEdit?: (question: Question) => void
  onRefresh?: () => void
}

export function QuestionList({ topicId, topicName, onAddNew, onEdit, onRefresh }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadQuestions = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/admin/questions?topicId=${topicId}`)
      if (!res.ok) throw new Error("Failed to load questions")

      const data = await res.json()
      setQuestions(data.questions || [])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load questions"
      setError(message)
      console.error("[v0] Error loading questions:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [topicId])

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      return
    }

    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, { method: "DELETE" })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || data.error || "Failed to delete question")
      }

      toast({ title: "Success", description: "Question deleted successfully" })
      await loadQuestions()
      onRefresh?.()
    } catch (err) {
      console.error("[v0] Error deleting question:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete question",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-slate-600">Loading questions...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-900 mb-4">{error}</p>
          <Button onClick={loadQuestions} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            {topicName} ({questions.length} {questions.length === 1 ? "question" : "questions"})
          </CardDescription>
        </div>
        <Button onClick={onAddNew} className="bg-green-600 hover:bg-green-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Question
        </Button>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <p className="text-slate-600 text-center py-8">No questions yet. Click "Add Question" to get started.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((question, idx) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-slate-50 border-slate-200">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-600 mb-1">Question {question.order_index}</p>
                          <p className="text-slate-900 font-medium">{question.question_text}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit?.(question)}
                            className="gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(question.id)}
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {[
                          { key: "option_a", label: "A" },
                          { key: "option_b", label: "B" },
                          { key: "option_c", label: "C" },
                          { key: "option_d", label: "D" },
                        ].map(({ key, label }) => {
                          const isCorrect = question.correct_answer === label
                          return (
                            <div
                              key={key}
                              className={`p-2 rounded text-sm ${
                                isCorrect
                                  ? "bg-green-100 border border-green-300 text-green-900 font-medium"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              <span className="font-semibold">{label}:</span> {question[key as keyof Question]}
                            </div>
                          )
                        })}
                      </div>

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-600 font-semibold mb-1">Explanation:</p>
                          <p className="text-sm text-slate-700">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
