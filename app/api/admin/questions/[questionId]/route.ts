import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { updateQuestionSchema } from "@/lib/schemas/assessment"

/**
 * PUT /api/admin/questions/[questionId]
 * Update an existing question.
 * Admin-only endpoint.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const { questionId } = await params
    const body = await request.json()

    // Validate input — allow partial updates
    const validationResult = updateQuestionSchema.safeParse({
      ...body,
      question_id: questionId,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { question_id, ...updateData } = validationResult.data

    const adminClient = createAdminClient()

    // Verify question exists
    const { data: existingQuestion, error: fetchError } = await adminClient
      .from("quiz_questions")
      .select("id")
      .eq("id", questionId)
      .single()

    if (fetchError || !existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Build update object (exclude undefined fields)
    const updatePayload: Record<string, any> = {}
    if (updateData.question_text !== undefined) updatePayload.question_text = updateData.question_text
    if (updateData.option_a !== undefined) updatePayload.option_a = updateData.option_a
    if (updateData.option_b !== undefined) updatePayload.option_b = updateData.option_b
    if (updateData.option_c !== undefined) updatePayload.option_c = updateData.option_c
    if (updateData.option_d !== undefined) updatePayload.option_d = updateData.option_d
    if (updateData.correct_answer !== undefined) updatePayload.correct_answer = updateData.correct_answer
    if (updateData.explanation !== undefined) updatePayload.explanation = updateData.explanation

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Perform update
    const { data: updatedQuestion, error: updateError } = await adminClient
      .from("quiz_questions")
      .update(updatePayload)
      .eq("id", questionId)
      .select()
      .single()

    if (updateError || !updatedQuestion) {
      return NextResponse.json({ error: "Failed to update question" }, { status: 500 })
    }

    return NextResponse.json({ question: updatedQuestion })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/questions/[questionId]
 * Delete a question.
 * Prevents deletion if it would break assessment integrity (no assessment with only 1 question per topic).
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const { questionId } = await params
    const adminClient = createAdminClient()

    // Fetch the question to get its topic_id
    const { data: question, error: fetchError } = await adminClient
      .from("quiz_questions")
      .select("id, topic_id")
      .eq("id", questionId)
      .single()

    if (fetchError || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Check how many questions are in this topic
    const { data: allQuestions, error: countError } = await adminClient
      .from("quiz_questions")
      .select("id", { count: "exact" })
      .eq("topic_id", question.topic_id)

    if (countError) {
      return NextResponse.json({ error: "Failed to check question count" }, { status: 500 })
    }

    // Prevent deleting if it's the only question in the topic
    if ((allQuestions?.length ?? 0) <= 1) {
      return NextResponse.json(
        {
          error: "Cannot delete",
          message: "Topics must have at least 1 question. Add another question before deleting this one.",
        },
        { status: 409 }
      )
    }

    // Delete the question
    const { error: deleteError } = await adminClient.from("quiz_questions").delete().eq("id", questionId)

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Question deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
