import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

const VALID_ANSWER_OPTIONS = ["A", "B", "C", "D"]
const PASS_THRESHOLD = 70

/**
 * Server-side quiz submission and scoring.
 *
 * The client sends ONLY the user's selected answers — no score, no correct_answer.
 * The server fetches the real correct answers from the database, calculates the
 * score, and persists the result. No client-submitted score is ever trusted.
 *
 * POST /api/quiz/submit
 * Body: { topicId, levelId, answers: { [questionId]: "A" | "B" | "C" | "D" } }
 */
export async function POST(request: NextRequest) {
  // 20 quiz submissions per IP per hour — prevents automated re-submission loops
  const { allowed } = rateLimit(request, { max: 20, windowMs: 60 * 60 * 1000 }, "quiz-submit")
  if (!allowed) {
    return NextResponse.json({ error: "Too many submissions. Please wait before trying again." }, { status: 429 })
  }

  try {
    const supabase = await createClient()

    // Verify authenticated session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { topicId, levelId, answers } = body

    // --- Input validation ---
    if (!topicId || typeof topicId !== "string") {
      return NextResponse.json({ error: "Invalid topicId" }, { status: 400 })
    }
    if (!levelId || typeof levelId !== "string") {
      return NextResponse.json({ error: "Invalid levelId" }, { status: 400 })
    }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid answers format" }, { status: 400 })
    }

    // Validate each submitted answer is a valid option
    for (const [questionId, answer] of Object.entries(answers)) {
      if (typeof questionId !== "string" || !VALID_ANSWER_OPTIONS.includes(answer as string)) {
        return NextResponse.json(
          { error: `Invalid answer value for question ${questionId}. Must be A, B, C, or D.` },
          { status: 400 }
        )
      }
    }

    // Use admin client to fetch questions so RLS doesn't interfere with correct_answer
    const adminClient = createAdminClient()

    // Verify the topic exists and belongs to the given level
    const { data: topic, error: topicError } = await adminClient
      .from("assessment_topics")
      .select("id, name, level_id")
      .eq("id", topicId)
      .eq("level_id", levelId)
      .single()

    if (topicError || !topic) {
      return NextResponse.json({ error: "Topic not found or does not belong to this level" }, { status: 404 })
    }

    // Verify level is unlocked before accepting submission.
    // Beginner (order_index = 1) is always accessible; higher levels require an unlock row.
    const { data: levelRow } = await adminClient
      .from("assessment_levels")
      .select("order_index")
      .eq("id", levelId)
      .single()

    if (!levelRow) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 })
    }

    if (levelRow.order_index > 1) {
      const { data: unlockData } = await adminClient
        .from("level_unlocks")
        .select("is_unlocked")
        .eq("level_id", levelId)
        .single()

      if (!unlockData?.is_unlocked) {
        return NextResponse.json({ error: "This assessment level is locked" }, { status: 403 })
      }
    }

    // Fetch the authoritative questions for this topic from the database
    const { data: questions, error: questionsError } = await adminClient
      .from("quiz_questions")
      .select("id, correct_answer")
      .eq("topic_id", topicId)

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions found for this topic" }, { status: 404 })
    }

    // Reject if the client submitted answers for questions not in this topic
    const validQuestionIds = new Set(questions.map((q) => q.id))
    for (const questionId of Object.keys(answers)) {
      if (!validQuestionIds.has(questionId)) {
        return NextResponse.json(
          { error: `Question ${questionId} does not belong to this topic` },
          { status: 400 }
        )
      }
    }

    // Reject incomplete submissions (must answer all questions)
    if (Object.keys(answers).length !== questions.length) {
      return NextResponse.json(
        {
          error: `Expected ${questions.length} answers, received ${Object.keys(answers).length}`,
        },
        { status: 400 }
      )
    }

    // SERVER-SIDE score calculation — uses DB correct_answer, never the client value
    let correctCount = 0
    const answerResults: { questionId: string; selectedAnswer: string; isCorrect: boolean }[] = []

    for (const question of questions) {
      const selected = answers[question.id] as string
      const isCorrect = selected === question.correct_answer
      if (isCorrect) correctCount++
      answerResults.push({ questionId: question.id, selectedAnswer: selected, isCorrect })
    }

    const score = Math.round((correctCount / questions.length) * 100)
    const passed = score >= PASS_THRESHOLD

    // SINGLE-ATTEMPT ENFORCEMENT: Check for existing completed attempt
    // If already completed, reject this submission (prevent duplicate completions)
    const { data: completedAttempt, error: checkError } = await supabase
      .from("user_assessments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .maybeSingle()

    if (checkError) {
      return NextResponse.json({ error: "Failed to verify attempt status" }, { status: 500 })
    }

    // If already completed, reject this submission with clear error
    if (completedAttempt?.status === "completed") {
      return NextResponse.json(
        {
          error: "ALREADY_COMPLETED",
          message: "This assessment has already been completed. Duplicate submissions are not allowed.",
        },
        { status: 409 }
      )
    }

    // Upsert the assessment record
    // If in_progress exists from when quiz was started, reuse it
    // If not, create new with started_at = now
    const { data: existingAssessment } = await supabase
      .from("user_assessments")
      .select("id")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .eq("status", "in_progress")
      .maybeSingle()

    let assessmentId: string

    if (existingAssessment?.id) {
      // Reuse existing in_progress attempt
      assessmentId = existingAssessment.id
      const { error: updateError } = await adminClient
        .from("user_assessments")
        .update({
          status: "completed",
          score,
          passed,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", assessmentId)

      if (updateError) {
        return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 })
      }
    } else {
      // Create new assessment (in case it wasn't created when quiz started)
      const { data: newAssessment, error: insertError } = await adminClient
        .from("user_assessments")
        .insert({
          user_id: user.id,
          level_id: levelId,
          topic_id: topicId,
          status: "completed",
          score,
          passed,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (insertError || !newAssessment) {
        return NextResponse.json({ error: "Failed to create assessment record" }, { status: 500 })
      }

      assessmentId = newAssessment.id
    }

    // Delete old answers for this assessment to prevent duplicates on retake
    await adminClient.from("user_quiz_answers").delete().eq("assessment_id", assessmentId)

    // Persist individual answers
    const answerRows = answerResults.map(({ questionId, selectedAnswer, isCorrect }) => ({
      user_id: user.id,
      question_id: questionId,
      assessment_id: assessmentId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    }))

    const { error: answersError } = await adminClient.from("user_quiz_answers").insert(answerRows)
    if (answersError) {
      return NextResponse.json({ error: "Failed to save answers" }, { status: 500 })
    }

    return NextResponse.json(
      {
        assessmentId,
        score,
        passed,
        correctCount,
        totalQuestions: questions.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Submission failed" }, { status: 500 })
  }
}
