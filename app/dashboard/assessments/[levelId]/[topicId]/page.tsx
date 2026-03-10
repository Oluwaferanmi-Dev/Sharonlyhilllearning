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

  // SERVER-SIDE level lock check — cannot be bypassed by URL typing
  const { data: unlockData } = await supabase
    .from("level_unlocks")
    .select("is_unlocked")
    .eq("level_id", levelId)
    .single()

  if (!unlockData?.is_unlocked) {
    redirect("/dashboard/assessments")
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

  return <QuizClient levelId={levelId} topicId={topicId} topicName={topic.name} userId={user.id} />
}
