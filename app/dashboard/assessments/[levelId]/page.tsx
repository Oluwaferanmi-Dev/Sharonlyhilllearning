import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { AssessmentLevelTopics } from "@/components/assessment-level-topics"

const COMPLIANCE_DOMAINS = [
  { code: "APR", name: "Accreditation Participation Requirements" },
  { code: "CTS", name: "Care, Treatment, and Services" },
  { code: "EC", name: "Environment of Care" },
  { code: "EM", name: "Emergency Management" },
  { code: "HRM", name: "Human Resources Management" },
  { code: "IC", name: "Infection Prevention and Control" },
  { code: "IM", name: "Information Management" },
  { code: "LD", name: "Leadership" },
  { code: "LS", name: "Life Safety" },
  { code: "MM", name: "Medication Management" },
  { code: "NPSG", name: "National Patient Safety Goals" },
  { code: "PI", name: "Performance Improvement" },
  { code: "RC", name: "Record of Care, Treatment, and Services" },
  { code: "RI", name: "Rights and Responsibilities of the Individual" },
  { code: "WT", name: "Waived Testing" },
]

export default async function AssessmentLevelPage({
  params,
}: {
  params: Promise<{ levelId: string }>
}) {
  const { levelId } = await params
  const supabase = await createClient()

  // Verify authenticated user server-side
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/auth/login")
  }

  // Fetch level details first (needed for order_index to decide lock logic)
  const { data: level } = await supabase
    .from("assessment_levels")
    .select("id, name, description, price, order_index, requires_payment")
    .eq("id", levelId)
    .single()

  if (!level) {
    redirect("/dashboard/assessments")
  }

  // SERVER-SIDE level lock check — cannot be bypassed by URL typing.
  // Beginner (order_index = 1) is always accessible.
  // All other levels require an active level_unlocks row with is_unlocked = true.
  if (level.order_index > 1) {
    const { data: unlockData } = await supabase
      .from("level_unlocks")
      .select("is_unlocked")
      .eq("level_id", levelId)
      .single()

    if (!unlockData?.is_unlocked) {
      redirect("/dashboard/assessments")
    }
  }

  // Fetch topics for this level
  const { data: topics } = await supabase
    .from("assessment_topics")
    .select("id, name, description")
    .eq("level_id", levelId)
    .order("name")

  // Fetch this user's assessments for this level
  const { data: userAssessments } = await supabase
    .from("user_assessments")
    .select("id, topic_id, status, score")
    .eq("user_id", user.id)
    .eq("level_id", levelId)

  return (
    <div className="px-6 py-12 space-y-8">
      {/* Pre-assessment hero section */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 shadow-lg">
        <CardHeader className="pb-4">
          <div className="space-y-3">
            <div className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full mb-2">
              Cherith Training Compliance Excellence
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              Pre-Assessment Testing for Healthcare Compliance Excellence
            </CardTitle>
            <CardDescription className="text-base text-slate-700 font-medium">
              Building a Foundation for Safe and Effective Healthcare Regulation
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm border border-blue-100 space-y-4">
            <p className="text-base leading-relaxed text-slate-800">
              <span className="font-semibold text-blue-900">
                Pre-assessment testing is a critical first step
              </span>{" "}
              in preparing Cherith Training&apos;s workforce to regulate safely and
              effectively against Joint Commission-style standards across all
              domains.
            </p>
            <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="w-1.5 h-full bg-blue-500 rounded-full shrink-0 mt-1" />
              <p className="text-sm leading-relaxed text-slate-700">
                The pre-assessment results drive an{" "}
                <strong>individualized learning roadmap</strong>&mdash;placing staff
                into beginner, intermediate, or advanced pathways&mdash;so that time
                and resources are focused on closing the most important knowledge
                and practice gaps.
              </p>
            </div>
          </div>

          {/* Compliance Domains */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Assessment Domains</h3>
                <p className="text-sm text-slate-600">15 compliance areas assessed</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {COMPLIANCE_DOMAINS.map((domain) => (
                <div
                  key={domain.code}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-100"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs text-blue-700">{domain.code}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 leading-tight mt-1">{domain.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Targeted learning note */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold text-slate-900">Targeted, Individualized Training</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Cherith Training ensures that training is{" "}
                  <strong>targeted rather than generic</strong>, providing each user
                  with a unique learning experience based on their demonstrated
                  knowledge gaps and learning pathway.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Link href="/dashboard/assessments" className="text-blue-600 hover:underline text-sm">
          &larr; Back to Assessments
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">{level.name} Assessment</h1>
        <p className="text-slate-600">{level.description}</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Topics</h2>
        <AssessmentLevelTopics
          topics={topics || []}
          userAssessments={userAssessments || []}
          levelId={levelId}
          levelName={level.name}
        />
      </div>
    </div>
  )
}
