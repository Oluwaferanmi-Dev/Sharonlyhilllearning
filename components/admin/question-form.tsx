"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface QuestionFormProps {
  topicId: string
  isNew?: boolean
  initialData?: {
    id: string
    question_text: string
    option_a: string
    option_b: string
    option_c: string
    option_d: string
    correct_answer: "A" | "B" | "C" | "D"
    explanation?: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function QuestionForm({ topicId, isNew = true, initialData, onSuccess, onCancel }: QuestionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    question_text: initialData?.question_text || "",
    option_a: initialData?.option_a || "",
    option_b: initialData?.option_b || "",
    option_c: initialData?.option_c || "",
    option_d: initialData?.option_d || "",
    correct_answer: initialData?.correct_answer || ("A" as const),
    explanation: initialData?.explanation || "",
  })

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.question_text.trim() || !formData.option_a.trim() || !formData.option_b.trim() || !formData.option_c.trim() || !formData.option_d.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const url = isNew ? "/api/admin/questions" : `/api/admin/questions/${initialData?.id}`
      const method = isNew ? "POST" : "PUT"

      const payload = isNew ? { topic_id: topicId, ...formData } : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${isNew ? "create" : "update"} question`)
      }

      toast({
        title: "Success",
        description: `Question ${isNew ? "created" : "updated"} successfully!`,
      })

      if (isNew) {
        setFormData({
          question_text: "",
          option_a: "",
          option_b: "",
          option_c: "",
          option_d: "",
          correct_answer: "A",
          explanation: "",
        })
      }

      onSuccess?.()
    } catch (error) {
      console.error("[v0] Error saving question:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isNew ? "create" : "update"} question`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNew ? "Add New Question" : "Edit Question"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Question Text</label>
            <Textarea
              placeholder="Enter the question"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              disabled={isLoading}
              rows={3}
              className="bg-white resize-none"
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            {(["option_a", "option_b", "option_c", "option_d"] as const).map((option, idx) => {
              const optionLetter = String.fromCharCode(65 + idx) // A, B, C, D
              return (
                <div key={option} className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Option {optionLetter}</label>
                  <Input
                    placeholder={`Enter option ${optionLetter}`}
                    value={formData[option]}
                    onChange={(e) => setFormData({ ...formData, [option]: e.target.value })}
                    disabled={isLoading}
                    className="bg-white"
                  />
                </div>
              )
            })}
          </div>

          {/* Correct Answer */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Correct Answer</label>
            <div className="grid grid-cols-4 gap-2">
              {(["A", "B", "C", "D"] as const).map((letter) => (
                <Button
                  key={letter}
                  type="button"
                  onClick={() => setFormData({ ...formData, correct_answer: letter })}
                  className={`${
                    formData.correct_answer === letter
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-900"
                  }`}
                  disabled={isLoading}
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Explanation (Optional)</label>
            <Textarea
              placeholder="Explain why this is the correct answer"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              disabled={isLoading}
              rows={3}
              className="bg-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Saving..." : isNew ? "Create Question" : "Update Question"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
