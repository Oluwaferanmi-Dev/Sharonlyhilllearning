import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { QuizClient } from "@/components/quiz-client"

export default async function QuizPage({
  params,
}: {
  params: Promise<{ levelId: string; topicId: string }>
}) {
  const { levelId, topicId } = await params
  const supabase = await createClient()

  // Verify authenticated user server-side
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/auth/login")
  }

  // SERVER-SIDE level access: token-based OR course-level (level has course_id)
  const { data: levelData } = await supabase
    .from("assessment_levels")
    .select("order_index, course_id")
    .eq("id", levelId)
    .single()

  if (!levelData) {
    redirect("/dashboard/assessments")
  }

  const isCourseLevel = !!levelData.course_id
  if (!isCourseLevel) {
    const { data: userAccess } = await supabase
      .from("user_level_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("level_id", levelId)
      .maybeSingle()
    if (!userAccess) redirect("/dashboard/assessments")
  }

  // Verify the topic belongs to this level (prevents cross-level access)
  const { data: topic } = await supabase
    .from("assessment_topics")
    .select("id, name, level_id")
    .eq("id", topicId)
    .eq("level_id", levelId)
    .single()

  if (!topic) {
    redirect(`/dashboard/assessments/${levelId}`)
  }

  // NOTE: Questions are NOT passed to the client — the quiz client fetches
  // question text only (no correct_answer field). Scoring happens server-side
  // via /api/quiz/submit. See quiz-client.tsx and /api/quiz/submit/route.ts.

  // SINGLE-ATTEMPT CHECK: Prevent accessing quiz if already completed
  const { data: existingAttempt } = await supabase
    .from("user_assessments")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("topic_id", topicId)
    .maybeSingle()

  if (existingAttempt?.status === "completed") {
    // Instead of blocking at page level, let the quiz client handle it
    // This provides a better UX with explanation and navigation options
  }

  return <QuizClient levelId={levelId} topicId={topicId} topicName={topic.name} userId={user.id} />
}
