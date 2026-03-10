"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { initAssessmentProtection } from "@/lib/utils/assessment-protection"
import { initRecordingDetection } from "@/lib/utils/recording-detection"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  // NOTE: correct_answer is intentionally absent — never sent to the client
}

interface Props {
  levelId: string
  topicId: string
  topicName: string
  userId: string
}

interface SubmitResult {
  assessmentId: string
  score: number
  passed: boolean
  correctCount: number
  totalQuestions: number
}

export function QuizClient({ levelId, topicId, topicName, userId }: Props) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [isScreenRecording, setIsScreenRecording] = useState(false)

  useEffect(() => {
    const cleanupProtection = initAssessmentProtection()
    const cleanupRecording = initRecordingDetection({
      onDetected: () => setIsScreenRecording(true),
      onStopped: () => setIsScreenRecording(false),
    })
    return () => {
      cleanupProtection()
      cleanupRecording()
    }
  }, [])

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await fetch(`/api/quiz/questions?topicId=${topicId}&levelId=${levelId}`)
        if (!res.ok) {
          const data = await res.json()
          // Check if the error is ALREADY_COMPLETED
          if (data.error === "ALREADY_COMPLETED") {
            setIsAlreadyCompleted(true)
            setSubmitError(data.message)
            setIsLoading(false)
            return
          }
          throw new Error(data.error || "Failed to load questions")
        }
        const data = await res.json()
        setQuestions(data.questions || [])
      } catch (err: any) {
        setSubmitError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadQuestions()
  }, [topicId, levelId])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only send question IDs and selected options — NO score or correct_answer
        body: JSON.stringify({ topicId, levelId, answers }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Submission failed")
      }

      setResult(data)
    } catch (err: any) {
      setSubmitError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-slate-600">Loading quiz...</p>
      </div>
    )
  }

  // Already Completed — Show completion notice
  if (isAlreadyCompleted) {
    return (
      <div className="px-6 py-12 max-w-2xl mx-auto">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Assessment Already Completed</CardTitle>
            <CardDescription className="text-blue-800">{topicName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-blue-900">
              You have already completed this assessment. No retakes are allowed for this topic in the current phase.
            </p>
            <p className="text-sm text-blue-800">
              If you need to review your results or progress, please visit the level page.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Go Back
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push(`/dashboard/assessments/${levelId}`)}
              >
                View Level Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitError && !result) {
    return (
      <div className="px-6 py-12 max-w-2xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">{submitError}</p>
            <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Results view — score comes from server response, never from client calculation
  if (result) {
    const { score, passed, correctCount, totalQuestions } = result
    return (
      <div className="px-6 py-12 max-w-2xl mx-auto">
        <Card className={passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader className="text-center">
            <CardTitle className={passed ? "text-green-900" : "text-red-900"}>
              Quiz Complete!
            </CardTitle>
            <CardDescription className={passed ? "text-green-800" : "text-red-800"}>
              {topicName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className={`text-5xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
                {score}%
              </p>
              <p className={`text-lg font-semibold mt-2 ${passed ? "text-green-900" : "text-red-900"}`}>
                {passed ? "Passed!" : "Not Passed"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{correctCount}</p>
                <p className="text-sm text-slate-600">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalQuestions - correctCount}</p>
                <p className="text-sm text-slate-600">Incorrect</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-2">
              <p className="font-semibold text-slate-900">Results Summary</p>
              <p className="text-sm text-slate-700">
                You answered {totalQuestions} questions.
              </p>
              {passed ? (
                <p className="text-sm text-green-700 font-semibold">
                  Congratulations! You passed this assessment.
                </p>
              ) : (
                <p className="text-sm text-red-700 font-semibold">
                  Please review the material and try again.
                </p>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-orange-700 bg-orange-50 p-3 rounded border border-orange-200">
                {submitError}
              </p>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => router.push(`/dashboard/assessments/${levelId}`)}
              >
                Back to Level
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-slate-600">No questions found for this topic.</p>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
  const allAnswered = Object.keys(answers).length === questions.length

  return (
    <div className="px-6 py-12 max-w-2xl mx-auto space-y-8">
      {isScreenRecording && (
        <div className="recording-warning bg-red-100 border border-red-300 text-red-800 text-sm font-semibold px-4 py-2 rounded text-center">
          Recording Detected - Content Blurred
        </div>
      )}

      <Button variant="outline" className="bg-transparent" onClick={() => router.back()}>
        &larr; Back
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">{topicName}</h1>
        <p className="text-slate-600">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Progress</span>
          <span className="font-semibold text-slate-900">{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className={`assessment-protected ${isScreenRecording ? "assessment-recording-detected" : ""}`}>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question_text}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
          >
            <div className="space-y-4">
              {[
                { value: "A", label: currentQuestion.option_a },
                { value: "B", label: currentQuestion.option_b },
                { value: "C", label: currentQuestion.option_c },
                { value: "D", label: currentQuestion.option_d },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50">
                  <RadioGroupItem value={option.value} id={`${currentQuestion.id}-${option.value}`} />
                  <Label htmlFor={`${currentQuestion.id}-${option.value}`} className="flex-1 cursor-pointer">
                    <strong>{option.value}.</strong> {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {submitError && (
        <p className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">{submitError}</p>
      )}

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="flex-1"
        >
          Previous
        </Button>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            disabled={!answers[currentQuestion.id]}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        )}
      </div>

      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">Answer Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                  answers[q.id]
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                } ${currentQuestionIndex === idx ? "ring-2 ring-blue-400" : ""}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
