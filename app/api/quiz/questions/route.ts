import { createClient, createAdminClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Fetch quiz questions for a topic — WITHOUT correct_answer.
 * The client receives only the question text and options.
 * Correct answers never leave the server.
 *
 * GET /api/quiz/questions?topicId=xxx&levelId=yyy
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const topicId = searchParams.get("topicId");
  const levelId = searchParams.get("levelId");

  if (!topicId || !levelId) {
    return NextResponse.json(
      { error: "Missing topicId or levelId" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Verify authenticated session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // LEVEL ACCESS CHECK: token-based access, OR course-level (level has course_id)
  const { data: levelRow } = await adminClient
    .from("assessment_levels")
    .select("order_index, course_id")
    .eq("id", levelId)
    .single();

  if (!levelRow) {
    return NextResponse.json({ error: "Level not found" }, { status: 404 });
  }

  const isCourseLevel = !!levelRow.course_id;
  if (!isCourseLevel) {
    const { data: userAccess } = await adminClient
      .from("user_level_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("level_id", levelId)
      .maybeSingle();

    if (!userAccess) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: You do not have access to this assessment level",
        },
        { status: 403 },
      );
    }
  }

  // Verify topic belongs to this level
  const { data: topic } = await adminClient
    .from("assessment_topics")
    .select("id, name")
    .eq("id", topicId)
    .eq("level_id", levelId)
    .single();

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  // BUG FIX: Check if user has already completed this assessment before serving
  // questions.
  const { data: completedAttempt } = await adminClient
    .from("user_assessments")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("topic_id", topicId)
    .eq("status", "completed")
    .maybeSingle();

  if (completedAttempt) {
    return NextResponse.json(
      {
        error: "ALREADY_COMPLETED",
        message:
          "You have already completed this assessment. No retakes are allowed.",
      },
      { status: 409 },
    );
  }

  // Fetch questions — explicitly EXCLUDE correct_answer
  const { data: questions, error } = await adminClient
    .from("quiz_questions")
    .select("id, question_text, option_a, option_b, option_c, option_d")
    .eq("topic_id", topicId)
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { questions: questions || [], topicName: topic.name },
    { status: 200 },
  );
}
