"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { redirect, useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface Level {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface Topic {
  id: string;
  name: string;
  description: string;
}

interface UserAssessment {
  id: string;
  topic_id: string;
  status: string;
  score: number | null;
}

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
];

const topicOverviews: Record<
  string,
  { code: string; beginnerFocus: string; intermediateFocus?: string }
> = {
  "Care, Treatment, and Services (CTS)": {
    code: "CTS",
    beginnerFocus:
      "Beginner: patient pathway basics (assessment, care plan, treatment, follow-up), informed consent concepts.",
    intermediateFocus:
      "Intermediate: Individual care planning, risk assessment, and continuity of care with complex patient needs.",
  },
  "Environment of Care (EC)": {
    code: "EC",
    beginnerFocus:
      "Beginner: basics of safety in facilities (clean water, waste, fire exits, crowding).",
    intermediateFocus:
      "Intermediate: Hazard surveillance systems, safety management, and preventive maintenance.",
  },
  "Emergency Management (EM)": {
    code: "EM",
    beginnerFocus:
      "Beginner: knowledge of basic emergency types in Edo (outbreaks, mass casualty, fire) and the idea of a facility emergency plan.",
    intermediateFocus:
      "Intermediate: All-hazards planning, drills with lessons learned, and response coordination.",
  },
  "Human Resources Management (HRM)": {
    code: "HRM",
    beginnerFocus:
      "Beginner: basic awareness of required licenses, job descriptions, and orientation.",
    intermediateFocus:
      "Intermediate: Competency verification, performance management, and credential tracking systems.",
  },
  "Infection Prevention and Control (IC)": {
    code: "IC",
    beginnerFocus:
      "Beginner: hand hygiene, PPE basics, isolation basics, safe injection.",
    intermediateFocus:
      "Intermediate: Surveillance systems, outbreak investigation methods, and prevention strategy implementation.",
  },
  "Information Management (IM)": {
    code: "IM",
    beginnerFocus:
      "Beginner: basic documentation rules, confidentiality, record legibility.",
    intermediateFocus:
      "Intermediate: Data quality, consistency verification, security protocols, and system validation.",
  },
  Leadership: {
    code: "LD",
    beginnerFocus:
      "Beginner: awareness that each facility must have responsible leaders.",
    intermediateFocus:
      "Intermediate: Governance structures, accountability mechanisms, and safety culture development.",
  },
  "Life Safety (LS)": {
    code: "LS",
    beginnerFocus: "Beginner: fire exits, alarms, evacuation basics.",
    intermediateFocus:
      "Intermediate: Fire safety systems, egress design compliance, emergency procedures, and utility safety.",
  },
  "Medication Management (MM)": {
    code: "MM",
    beginnerFocus:
      "Beginner: storage, labelling, expiry checking, controlled drugs basics.",
    intermediateFocus:
      "Intermediate: Selection criteria, high-alert medication safeguards, and error prevention systems.",
  },
  "National Patient Safety Goals (NPSG)": {
    code: "NPSG",
    beginnerFocus:
      "Beginner: simple safety goals (correct patient identification, communication, infection prevention).",
    intermediateFocus:
      "Intermediate: Multi-faceted safety systems, equitable outcome measurement, and reduction of healthcare-associated harms.",
  },
  "Performance Improvement (PI)": {
    code: "PI",
    beginnerFocus:
      "Beginner: understanding indicators and simple PDSA cycle basics.",
    intermediateFocus:
      "Intermediate: Data-driven improvement, measurement systems, and sustainability of changes.",
  },
  "Accreditation Participation Requirements (APR)": {
    code: "APR",
    beginnerFocus:
      "Beginner: foundational understanding of accreditation requirements.",
    intermediateFocus:
      "Intermediate: Accreditation cooperation, truthful communication obligations, and reporting requirements.",
  },
};

export default function AssessmentLevelPage() {
  const params = useParams();
  const levelId = params.levelId as string;
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          redirect("/auth/login");
        }

        setUser(currentUser);

        const { data: unlockData } = await supabase
          .from("level_unlocks")
          .select("is_unlocked")
          .eq("level_id", levelId)
          .single();

        const levelUnlocked = unlockData?.is_unlocked || false;
        setIsUnlocked(levelUnlocked);

        if (!levelUnlocked) {
          console.log("[v0] Level not unlocked, redirecting");
          // Redirect after a short delay to allow state update
          setTimeout(() => {
            router.push("/dashboard/assessments");
          }, 500);
          return;
        }

        // Get the level
        const { data: levelData } = await supabase
          .from("assessment_levels")
          .select("*")
          .eq("id", levelId)
          .single();

        setLevel(levelData);

        // Get topics for this level
        const { data: topicsData } = await supabase
          .from("assessment_topics")
          .select("*")
          .eq("level_id", levelId)
          .order("name");

        setTopics(topicsData || []);

        // Get user assessments for these topics
        const { data: assessmentsData } = await supabase
          .from("user_assessments")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("level_id", levelId);

        setUserAssessments(assessmentsData || []);
      } catch (err) {
        console.error("[v0] Error loading level:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [levelId]);

  if (loading) {
    return (
      <div className="px-6 py-12">
        <p>Loading...</p>
      </div>
    );
  }

  if (!level || !isUnlocked) {
    return (
      <div className="px-6 py-12">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-800 mb-4">
              This assessment level is locked. Please contact your
              administrator.
            </p>
            <Link href="/dashboard/assessments">
              <Button>Back to Assessments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 space-y-8">
      {/* EDOHERMA pre-assessment hero section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
                Building a Foundation for Safe and Effective Healthcare
                Regulation
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mission Statement */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm border border-blue-100 space-y-4">
              <p className="text-base leading-relaxed text-slate-800">
                <span className="font-semibold text-blue-900">
                  Pre-assessment testing is a critical first step
                </span>{" "}
                in preparing Cherith Training's workforce to regulate safely and
                effectively against Joint Commission-style standards across all
                domains. This approach allows each participant to see clearly
                which topics are being assessed and how those topics map
                directly to the training modules and regulatory responsibilities
                they hold.
              </p>

              <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="w-1.5 h-full bg-blue-500 rounded-full shrink-0 mt-1" />
                <p className="text-sm leading-relaxed text-slate-700">
                  The pre-assessment results drive an{" "}
                  <strong>individualized learning roadmap</strong>—placing staff
                  into beginner, intermediate, or advanced pathways—so that time
                  and resources are focused on closing the most important
                  knowledge and practice gaps that impact{" "}
                  <strong>inspection quality, risk-based regulation</strong>,
                  and overall health-system performance in Edo State.
                </p>
              </div>
            </div>

            {/* Compliance Domains Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Assessment Domains
                  </h3>
                  <p className="text-sm text-slate-600">
                    Systematically gauging baseline knowledge across 15
                    compliance areas
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {COMPLIANCE_DOMAINS.map((domain, index) => (
                  <motion.div
                    key={domain.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                      <span className="font-bold text-xs text-blue-700">
                        {domain.code}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 leading-tight">
                        {domain.name}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Personalized Learning CTA */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Targeted, Individualized Training
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Cherith Training ensures that training is{" "}
                    <strong>targeted rather than generic</strong>, providing
                    each user with a unique learning experience based on their
                    demonstrated knowledge gaps and learning pathway.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-2">
        <Link
          href="/dashboard/assessments"
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back to Assessments
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">
          {level.name} Assessment
        </h1>
        <p className="text-slate-600">{level.description}</p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Topics</h2>

        <div className="grid gap-4">
          {topics?.map((topic, idx) => {
            const assessment = userAssessments?.find(
              (a) => a.topic_id === topic.id
            );
            const isCompleted = assessment?.status === "completed";
            const score = assessment?.score;
            const overview = topicOverviews[topic.name] || {
              code: topic.name.split("(")[1]?.replace(")", "") || "N/A",
              beginnerFocus:
                topic.description || "Assessment content for this topic",
            };

            const focusText =
              level.name === "Intermediate" && overview.intermediateFocus
                ? overview.intermediateFocus
                : overview.beginnerFocus || topic.description;

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <Card
                  className={isCompleted ? "border-green-200 bg-green-50" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{topic.name}</CardTitle>
                      </div>
                      <p className="text-xs font-semibold text-slate-600">
                        {level.name} level assessment focus
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {focusText}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="pt-2 border-t border-slate-200">
                      <CardDescription>
                        5 multiple-choice questions
                      </CardDescription>
                    </div>
                    {isCompleted && (
                      <div className="flex items-center gap-3 justify-end">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {score}%
                          </p>
                          <p className="text-xs text-green-700">Completed</p>
                        </div>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/assessments/${levelId}/${topic.id}`}
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        {isCompleted ? "Review Results" : "Start Topic"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
