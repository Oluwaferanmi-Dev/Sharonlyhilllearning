"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { redirect, useRouter } from "next/navigation";
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
];

export default function AssessmentLevelPage({
  params,
}: {
  params: { levelId: string };
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const levelId = params.levelId;

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (!currentUser) redirect("/auth/login");
        setUser(currentUser);

        const { data: unlockData } = await supabase
          .from("level_unlocks")
          .select("is_unlocked")
          .eq("level_id", levelId)
          .single();

        const levelUnlocked = unlockData?.is_unlocked || false;
        setIsUnlocked(levelUnlocked);

        if (!levelUnlocked) {
          setTimeout(() => router.push("/dashboard/assessments"), 500);
          return;
        }

        const { data: levelData } = await supabase
          .from("assessment_levels")
          .select("*")
          .eq("id", levelId)
          .single();
        setLevel(levelData);

        const { data: topicsData } = await supabase
          .from("assessment_topics")
          .select("*")
          .eq("level_id", levelId)
          .order("name");
        setTopics(topicsData || []);

        const { data: assessmentsData } = await supabase
          .from("user_assessments")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("level_id", levelId);
        setUserAssessments(assessmentsData || []);
      } catch (err) {
        console.error("Error loading level:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [levelId]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-8 sm:py-12">
        <p className="text-center text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!level || !isUnlocked) {
    return (
      <div className="px-4 sm:px-6 py-8 sm:py-12">
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

  const topicOverviews: Record<
    string,
    { code: string; beginnerFocus: string }
  > = {
    "Care, Treatment, and Services (CTS)": {
      code: "CTS",
      beginnerFocus:
        "Beginner: patient pathway basics (assessment, care plan, treatment, follow-up), informed consent concepts.",
    },
    // ... add all other topics here
  };

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full mb-2">
                EDOHERMA Workforce Development
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                Pre-Assessment Testing for Healthcare Compliance Excellence
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-slate-700 font-medium">
                Building a Foundation for Safe and Effective Healthcare
                Regulation
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 sm:p-6 shadow-sm border border-blue-100 space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base leading-relaxed text-slate-800">
                <span className="font-semibold text-blue-900">
                  Pre-assessment testing is a critical first step
                </span>{" "}
                in preparing EDOHERMA's workforce to regulate safely and
                effectively against Joint Commission-style standards across all
                domains.
              </p>
              <div className="flex gap-3 bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                <div className="w-1.5 h-full bg-blue-500 rounded-full shrink-0 mt-1 hidden sm:block" />
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                  The pre-assessment results drive an{" "}
                  <strong>individualized learning roadmap</strong>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Assessment Domains
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Systematically gauging baseline knowledge across 15
                    compliance areas
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {COMPLIANCE_DOMAINS.map((domain, index) => (
                  <motion.div
                    key={domain.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                  >
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                      <span className="font-bold text-xs sm:text-sm text-blue-700">
                        {domain.code}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-900 leading-tight">
                        {domain.name}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-2">
        <Link
          href="/dashboard/assessments"
          className="text-blue-600 hover:underline text-xs sm:text-sm"
        >
          ← Back to Assessments
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {level.name} Assessment
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          {level.description}
        </p>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
          Topics
        </h2>
        <div className="grid gap-3 sm:gap-4">
          {topics?.map((topic, idx) => {
            const assessment = userAssessments?.find(
              (a) => a.topic_id === topic.id
            );
            const isCompleted = assessment?.status === "completed";
            const score = assessment?.score;

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
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base sm:text-lg">
                        {topic.name}
                      </CardTitle>
                      <p className="text-xs font-semibold text-slate-600">
                        Pre-assessment focus
                      </p>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {topic.description}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="pt-2 border-t border-slate-200">
                      <CardDescription className="text-xs sm:text-sm">
                        5 multiple-choice questions
                      </CardDescription>
                    </div>
                    {isCompleted && (
                      <div className="flex items-center gap-2 sm:gap-3 justify-end">
                        <div className="text-right">
                          <p className="text-xl sm:text-2xl font-bold text-green-600">
                            {score}%
                          </p>
                          <p className="text-xs text-green-700">Completed</p>
                        </div>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/assessments/${levelId}/${topic.id}`}
                      className="block w-full"
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base">
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
