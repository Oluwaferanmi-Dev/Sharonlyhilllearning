import { createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ staffId: string; assessmentId: string }>
}) {
  const { staffId, assessmentId } = await params
  const supabase = createAdminClient()

  // Get staff profile
  const { data: staff } = await supabase.from("profiles").select("*").eq("id", staffId).single()

  if (!staff) {
    redirect("/admin/staff")
  }

  // Get assessment with topic and level details
  const { data: assessment } = await supabase
    .from("user_assessments")
    .select(
      `
      *,
      assessment_topics(id, name, description),
      assessment_levels(id, name)
    `,
    )
    .eq("id", assessmentId)
    .eq("user_id", staffId)
    .single()

  if (!assessment) {
    redirect(`/admin/staff/${staffId}/assessments`)
  }

  // Get all quiz answers with question details
  const { data: answers } = await supabase
    .from("user_quiz_answers")
    .select(
      `
      *,
      quiz_questions(id, question_text, option_a, option_b, option_c, option_d, correct_answer)
    `,
    )
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: true })

  const correctCount = answers?.filter((a) => a.is_correct).length || 0
  const totalQuestions = answers?.length || 0

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/staff/${staffId}/assessments`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {staff.first_name} {staff.last_name}
          </h1>
          <p className="text-slate-600">{assessment.assessment_topics?.name}</p>
        </div>
      </div>

      {/* Score Summary Card */}
      <Card className={assessment.passed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <CardHeader>
          <CardTitle className={assessment.passed ? "text-green-900" : "text-orange-900"}>Assessment Results</CardTitle>
          <CardDescription className={assessment.passed ? "text-green-700" : "text-orange-700"}>
            {assessment.assessment_levels?.name} Level - Completed on{" "}
            {new Date(assessment.completed_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className={`text-4xl font-bold ${assessment.passed ? "text-green-600" : "text-orange-600"}`}>
                {assessment.score}%
              </p>
              <p className="text-sm text-slate-600 mt-1">Score</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">{correctCount}</p>
              <p className="text-sm text-slate-600 mt-1">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">{totalQuestions - correctCount}</p>
              <p className="text-sm text-slate-600 mt-1">Incorrect</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">{totalQuestions}</p>
              <p className="text-sm text-slate-600 mt-1">Total</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className={`text-center font-semibold ${assessment.passed ? "text-green-700" : "text-orange-700"}`}>
              {assessment.passed ? "✓ Passed (70% or higher required)" : "✗ Did Not Pass (70% required)"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Question-by-Question Breakdown</CardTitle>
          <CardDescription>Detailed view of each question and the student's response</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {answers?.map((answer: any, idx: number) => (
              <div key={answer.id} className="border-b border-slate-200 pb-6 last:border-0">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        answer.is_correct ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {answer.is_correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <p className="font-semibold text-slate-900">Question {idx + 1}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      answer.is_correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {answer.is_correct ? "Correct" : "Incorrect"}
                  </span>
                </div>

                {/* Question Text */}
                <p className="text-slate-700 mb-4 leading-relaxed">{answer.quiz_questions?.question_text}</p>

                {/* Options */}
                <div className="space-y-2">
                  {[
                    { value: "A", label: answer.quiz_questions?.option_a },
                    { value: "B", label: answer.quiz_questions?.option_b },
                    { value: "C", label: answer.quiz_questions?.option_c },
                    { value: "D", label: answer.quiz_questions?.option_d },
                  ].map((option) => {
                    const isStudentAnswer = answer.selected_answer === option.value
                    const isCorrectAnswer = answer.quiz_questions?.correct_answer === option.value
                    const isWrongAnswer = isStudentAnswer && !isCorrectAnswer

                    return (
                      <div
                        key={option.value}
                        className={`p-3 rounded-lg border-2 ${
                          isCorrectAnswer
                            ? "border-green-300 bg-green-50"
                            : isWrongAnswer
                              ? "border-red-300 bg-red-50"
                              : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm flex-1">
                            <strong className="text-slate-900">{option.value}.</strong>{" "}
                            <span className="text-slate-700">{option.label}</span>
                          </p>
                          <div className="flex gap-2">
                            {isCorrectAnswer && (
                              <span className="text-xs font-semibold px-2 py-1 rounded bg-green-600 text-white">
                                Correct Answer
                              </span>
                            )}
                            {isWrongAnswer && (
                              <span className="text-xs font-semibold px-2 py-1 rounded bg-red-600 text-white">
                                Student's Answer
                              </span>
                            )}
                            {isStudentAnswer && isCorrectAnswer && (
                              <span className="text-xs font-semibold px-2 py-1 rounded bg-green-600 text-white">
                                Student's Answer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Link href={`/admin/staff/${staffId}/assessments`} className="flex-1">
          <Button variant="outline" className="w-full bg-transparent">
            Back to All Assessments
          </Button>
        </Link>
        <Link href={`/admin/staff/${staffId}`} className="flex-1">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">View Staff Profile</Button>
        </Link>
      </div>
    </div>
  )
}
