import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createTopicSchema, updateTopicSchema, reorderTopicsSchema } from "@/lib/schemas/assessment"

/**
 * POST /api/admin/topics
 * Create a new topic in an assessment level.
 * Admin-only endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const body = await request.json()

    // Validate input
    const validationResult = createTopicSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { level_id, name, description } = validationResult.data

    const adminClient = createAdminClient()

    // Verify level exists
    const { data: level, error: levelError } = await adminClient
      .from("assessment_levels")
      .select("id")
      .eq("id", level_id)
      .single()

    if (levelError || !level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 })
    }

    // Get the highest order_index for this level
    const { data: lastTopic } = await adminClient
      .from("assessment_topics")
      .select("order_index")
      .eq("level_id", level_id)
      .order("order_index", { ascending: false })
      .limit(1)
      .single()

    const nextOrderIndex = (lastTopic?.order_index ?? 0) + 1

    // Insert the new topic
    const { data: newTopic, error: insertError } = await adminClient
      .from("assessment_topics")
      .insert({
        level_id,
        name,
        description: description || null,
        order_index: nextOrderIndex,
      })
      .select()
      .single()

    if (insertError || !newTopic) {
      return NextResponse.json({ error: "Failed to create topic" }, { status: 500 })
    }

    return NextResponse.json({ topic: newTopic }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/topics/reorder
 * Reorder topics within a level.
 * Admin-only endpoint.
 */
export async function PUT(request: NextRequest) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const body = await request.json()

    // Validate input
    const validationResult = reorderTopicsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { topics } = validationResult.data
    const adminClient = createAdminClient()

    // Update order_index for each topic
    for (const topic of topics) {
      const { error: updateError } = await adminClient
        .from("assessment_topics")
        .update({ order_index: topic.order_index })
        .eq("id", topic.id)

      if (updateError) {
        return NextResponse.json({ error: "Failed to reorder topics" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Topics reordered successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
