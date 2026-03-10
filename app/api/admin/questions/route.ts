import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createQuestionSchema } from "@/lib/schemas/assessment"

/**
 * POST /api/admin/questions
 * Create a new question in a topic.
 * Admin-only endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const body = await request.json()

    // Validate input against schema
    const validationResult = createQuestionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { topic_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation } =
      validationResult.data

    const adminClient = createAdminClient()

    // Verify topic exists
    const { data: topic, error: topicError } = await adminClient
      .from("assessment_topics")
      .select("id")
      .eq("id", topic_id)
      .single()

    if (topicError || !topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Get the highest order_index for this topic to add new question at the end
    const { data: lastQuestion } = await adminClient
      .from("quiz_questions")
      .select("order_index")
      .eq("topic_id", topic_id)
      .order("order_index", { ascending: false })
      .limit(1)
      .single()

    const nextOrderIndex = (lastQuestion?.order_index ?? 0) + 1

    // Insert the new question
    const { data: newQuestion, error: insertError } = await adminClient
      .from("quiz_questions")
      .insert({
        topic_id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation: explanation || null,
        order_index: nextOrderIndex,
      })
      .select()
      .single()

    if (insertError || !newQuestion) {
      return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
    }

    return NextResponse.json({ question: newQuestion }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
