import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"

/**
 * Get detailed assessment results with individual questions and answers.
 * Admin-only endpoint.
 *
 * GET /api/admin/staff/[staffId]/assessment-results?assessmentId=[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ staffId: string }> }) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const { staffId } = await params
    const searchParams = request.nextUrl.searchParams
    const assessmentId = searchParams.get("assessmentId")

    if (!assessmentId) {
      return NextResponse.json({ error: "Assessment ID required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get the assessment with topic details
    const { data: assessment, error: assessmentError } = await supabase
      .from("user_assessments")
      .select(
        `
        *,
        assessment_topics(name, id)
      `,
      )
      .eq("id", assessmentId)
      .eq("user_id", staffId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    // Get all quiz answers for this assessment with question details
    const { data: answers, error: answersError } = await supabase
      .from("user_quiz_answers")
      .select(
        `
        *,
        quiz_questions(question_text, option_a, option_b, option_c, option_d, correct_answer)
      `,
      )
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: true })

    if (answersError) {
      throw answersError
    }

    // Format the response with questions and answers
    const detailedResults = answers?.map((answer: any) => ({
      questionId: answer.question_id,
      questionText: answer.quiz_questions?.question_text,
      options: {
        A: answer.quiz_questions?.option_a,
        B: answer.quiz_questions?.option_b,
        C: answer.quiz_questions?.option_c,
        D: answer.quiz_questions?.option_d,
      },
      studentAnswer: answer.selected_answer,
      correctAnswer: answer.quiz_questions?.correct_answer,
      isCorrect: answer.is_correct,
    }))

    return NextResponse.json(
      {
        assessment: {
          id: assessment.id,
          topicName: assessment.assessment_topics?.name,
          score: assessment.score,
          passed: assessment.passed,
          completedAt: assessment.completed_at,
          totalQuestions: detailedResults?.length || 0,
          correctCount: detailedResults?.filter((r: any) => r.isCorrect).length || 0,
        },
        results: detailedResults,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("[v0] Assessment results error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch assessment results" }, { status: 500 })
  }
}
