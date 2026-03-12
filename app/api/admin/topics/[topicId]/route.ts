import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { updateTopicSchema } from "@/lib/schemas/assessment"

/**
 * GET /api/admin/topics/[topicId]
 * Fetch a single topic for admin management.
 * Admin-only endpoint.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ topicId: string }> }) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const { topicId } = await params
    const adminClient = createAdminClient()

    const { data: topic, error } = await adminClient
      .from("assessment_topics")
      .select("*")
      .eq("id", topicId)
      .single()

    if (error || !topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    return NextResponse.json({ topic }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/topics/[topicId]
 * Update an existing topic.
 * Admin-only endpoint.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ topicId: string }> }) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const { topicId } = await params
    const body = await request.json()

    // Validate input — allow partial updates
    const validationResult = updateTopicSchema.safeParse({
      ...body,
      topic_id: topicId,
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

    const { topic_id, ...updateData } = validationResult.data

    const adminClient = createAdminClient()

    // Verify topic exists
    const { data: existingTopic, error: fetchError } = await adminClient
      .from("assessment_topics")
      .select("id")
      .eq("id", topicId)
      .single()

    if (fetchError || !existingTopic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Build update object (exclude undefined fields)
    const updatePayload: Record<string, any> = {}
    if (updateData.name !== undefined) updatePayload.name = updateData.name
    if (updateData.description !== undefined) updatePayload.description = updateData.description

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Perform update
    const { data: updatedTopic, error: updateError } = await adminClient
      .from("assessment_topics")
      .update(updatePayload)
      .eq("id", topicId)
      .select()
      .single()

    if (updateError || !updatedTopic) {
      return NextResponse.json({ error: "Failed to update topic" }, { status: 500 })
    }

    return NextResponse.json({ topic: updatedTopic })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/topics/[topicId]
 * Delete a topic and all its questions.
 * Prevents deletion if it would break existing assessments.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ topicId: string }> }) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const { topicId } = await params
    const adminClient = createAdminClient()

    // Fetch the topic
    const { data: topic, error: fetchError } = await adminClient
      .from("assessment_topics")
      .select("id")
      .eq("id", topicId)
      .single()

    if (fetchError || !topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // Check if any user has started or completed this topic's assessment
    const { data: userAssessments, error: checkError } = await adminClient
      .from("user_assessments")
      .select("id")
      .eq("topic_id", topicId)
      .limit(1)

    if (checkError) {
      return NextResponse.json({ error: "Failed to check assessments" }, { status: 500 })
    }

    // Prevent deletion if users have already attempted it
    if ((userAssessments?.length ?? 0) > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete",
          message: "Cannot delete a topic that has user assessment records. Archive it instead.",
        },
        { status: 409 }
      )
    }

    // Safe to delete — cascade will remove questions and answers
    const { error: deleteError } = await adminClient.from("assessment_topics").delete().eq("id", topicId)

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Topic deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
