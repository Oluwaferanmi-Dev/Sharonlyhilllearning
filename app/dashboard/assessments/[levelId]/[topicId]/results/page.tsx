import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ levelId: string; topicId: string }>
}) {
  const { levelId, topicId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get assessment
  const { data: assessment } = await supabase
    .from("user_assessments")
    .select("*")
    .eq("user_id", user.id)
    .eq("topic_id", topicId)
    .single()

  // Get topic
  const { data: topic } = await supabase.from("assessment_topics").select("*").eq("id", topicId).single()

  // Get answers
  const { data: answers } = await supabase
    .from("user_quiz_answers")
    .select(`
      *,
      quiz_questions(question_text, option_a, option_b, option_c, option_d, correct_answer)
    `)
    .eq("assessment_id", assessment?.id)

  if (!assessment) {
    redirect(`/dashboard/assessments/${levelId}/${topicId}`)
  }

  return (
    <div className="px-6 py-12 max-w-3xl mx-auto space-y-8">
      <Link href={`/dashboard/assessments/${levelId}`} className="text-blue-600 hover:underline text-sm">
        ← Back to Assessment
      </Link>

      {/* Score Card */}
      <Card className={assessment.passed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <CardHeader className="text-center">
          <CardTitle className={assessment.passed ? "text-green-900" : "text-orange-900"}>{topic?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className={`text-6xl font-bold ${assessment.passed ? "text-green-600" : "text-orange-600"}`}>
            {assessment.score}%
          </p>
          <p className={`text-lg font-semibold ${assessment.passed ? "text-green-900" : "text-orange-900"}`}>
            {assessment.passed ? "Passed!" : "Did Not Pass"}
          </p>
          <p className="text-sm text-slate-600">
            Completed on {new Date(assessment.completed_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Detailed Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {answers?.map((answer: any, idx) => (
              <div key={answer.id} className="border-b border-slate-200 pb-6 last:border-0">
                <p className="font-semibold text-slate-900 mb-3">Question {idx + 1}</p>
                <p className="text-slate-700 mb-4">{answer.quiz_questions?.question_text}</p>

                <div className="space-y-2 mb-4">
                  {[
                    { value: "A", label: answer.quiz_questions?.option_a },
                    { value: "B", label: answer.quiz_questions?.option_b },
                    { value: "C", label: answer.quiz_questions?.option_c },
                    { value: "D", label: answer.quiz_questions?.option_d },
                  ].map((option) => {
                    const isUserAnswer = answer.selected_answer === option.value
                    const isCorrectAnswer = answer.quiz_questions?.correct_answer === option.value
                    const isWrong = isUserAnswer && !isCorrectAnswer

                    return (
                      <div
                        key={option.value}
                        className={`p-3 rounded-lg border ${
                          isCorrectAnswer
                            ? "border-green-200 bg-green-50"
                            : isWrong
                              ? "border-red-200 bg-red-50"
                              : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <p className="text-sm">
                          <strong>{option.value}.</strong> {option.label}
                          {isCorrectAnswer && <span className="text-green-600 font-semibold ml-2">✓ Correct</span>}
                          {isWrong && <span className="text-red-600 font-semibold ml-2">✗ Your answer</span>}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href={`/dashboard/assessments/${levelId}`} className="flex-1">
          <Button variant="outline" className="w-full bg-transparent">
            Back to Assessment
          </Button>
        </Link>
        <Link href="/dashboard" className="flex-1">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
