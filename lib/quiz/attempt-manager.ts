import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Get or create an in-progress assessment attempt for a user on a topic.
 *
 * If an in_progress attempt exists, returns it.
 * If a completed attempt exists, returns error (single-attempt policy).
 * If neither exists, creates a new in_progress attempt.
 *
 * This ensures:
 * - Users can only have one completed attempt per topic
 * - Users can resume an in-progress attempt
 * - Submitted assessments are always tied to a valid attempt record
 */
export async function getOrCreateAssessmentAttempt(
  supabase: SupabaseClient,
  userId: string,
  levelId: string,
  topicId: string
) {
  // Check for existing attempts
  const { data: existing, error: checkError } = await supabase
    .from("user_assessments")
    .select("id, status")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle()

  if (checkError) {
    return { assessmentId: null, error: "Failed to check existing attempts" }
  }

  // If completed, reject (single-attempt policy)
  if (existing?.status === "completed") {
    return {
      assessmentId: null,
      error: "ALREADY_COMPLETED",
      message: "This assessment has already been completed. No retakes allowed.",
    }
  }

  // If in_progress, reuse it
  if (existing?.status === "in_progress") {
    return { assessmentId: existing.id, error: null }
  }

  // Create new in_progress attempt
  const { data: newAttempt, error: insertError } = await supabase
    .from("user_assessments")
    .insert({
      user_id: userId,
      level_id: levelId,
      topic_id: topicId,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (insertError || !newAttempt) {
    return { assessmentId: null, error: "Failed to create assessment attempt" }
  }

  return { assessmentId: newAttempt.id, error: null }
}
