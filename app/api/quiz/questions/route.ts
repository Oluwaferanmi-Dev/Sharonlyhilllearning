import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Fetch quiz questions for a topic — WITHOUT correct_answer.
 * The client receives only the question text and options.
 * Correct answers never leave the server.
 *
 * GET /api/quiz/questions?topicId=xxx&levelId=yyy
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const topicId = searchParams.get("topicId")
  const levelId = searchParams.get("levelId")

  if (!topicId || !levelId) {
    return NextResponse.json({ error: "Missing topicId or levelId" }, { status: 400 })
  }

  const supabase = await createClient()

  // Verify authenticated session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify level is unlocked before serving questions
  const { data: unlockData } = await supabase
    .from("level_unlocks")
    .select("is_unlocked")
    .eq("level_id", levelId)
    .single()

  if (!unlockData?.is_unlocked) {
    return NextResponse.json({ error: "This assessment level is locked" }, { status: 403 })
  }

  const adminClient = createAdminClient()

  // Verify topic belongs to this level
  const { data: topic } = await adminClient
    .from("assessment_topics")
    .select("id, name")
    .eq("id", topicId)
    .eq("level_id", levelId)
    .single()

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 })
  }

  // Fetch questions — explicitly EXCLUDE correct_answer
  const { data: questions, error } = await adminClient
    .from("quiz_questions")
    .select("id, question_text, option_a, option_b, option_c, option_d")
    .eq("topic_id", topicId)
    .order("order_index", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }

  return NextResponse.json({ questions: questions || [], topicName: topic.name }, { status: 200 })
}
