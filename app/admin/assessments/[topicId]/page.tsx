"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { QuestionForm } from "@/components/admin/question-form"
import { QuestionList } from "@/components/admin/question-list"

interface Topic {
  id: string
  name: string
  description?: string
  level_id: string
  order_index: number
}

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

export default function TopicManagementPage() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.topicId as string
  const { toast } = useToast()

  const [topic, setTopic] = useState<Topic | null>(null)
  const [isLoadingTopic, setIsLoadingTopic] = useState(true)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const loadTopic = async () => {
      try {
        const res = await fetch(`/api/admin/topics/${topicId}`)
        if (!res.ok) throw new Error("Failed to load topic")

        const data = await res.json()
        setTopic(data.topic)
      } catch (err) {
        console.error("[v0] Error loading topic:", err)
        toast({
          title: "Error",
          description: "Failed to load topic details",
          variant: "destructive",
        })
      } finally {
        setIsLoadingTopic(false)
      }
    }

    loadTopic()
  }, [topicId, toast])

  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setShowAddForm(true)
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setShowAddForm(true)
  }

  const handleFormSuccess = () => {
    setShowAddForm(false)
    setEditingQuestion(null)
    setRefreshKey((prev) => prev + 1)
  }

  const handleFormCancel = () => {
    setShowAddForm(false)
    setEditingQuestion(null)
  }

  if (isLoadingTopic) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-slate-600">Loading topic...</p>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="px-6 py-12">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Topic Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/assessments">
              <Button variant="outline">Back to Assessments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-6 py-12 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/admin/assessments">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Questions</h1>
            <p className="text-slate-600">{topic.name}</p>
          </div>
        </div>
      </motion.div>

      {/* Topic Info Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-600 font-semibold">Topic Description</p>
              <p className="text-slate-900">{topic.description || "No description provided"}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        {showAddForm && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <div className="sticky top-6">
              <QuestionForm
                topicId={topicId}
                isNew={!editingQuestion}
                initialData={editingQuestion || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </motion.div>
        )}

        {/* Questions List Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className={showAddForm ? "lg:col-span-2" : "lg:col-span-3"}
        >
          <QuestionList
            key={refreshKey}
            topicId={topicId}
            topicName={topic.name}
            onAddNew={handleAddQuestion}
            onEdit={handleEditQuestion}
            onRefresh={() => setRefreshKey((prev) => prev + 1)}
          />
        </motion.div>
      </div>
    </div>
  )
}
