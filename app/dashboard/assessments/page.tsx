"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
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
import { Lock, AlertCircle, Ticket } from "lucide-react";
import { TokenRedemptionDialog } from "@/components/token-redemption-dialog";

interface AssessmentLevel {
  id: string;
  name: string;
  description: string;
  order_index: number;
}

interface UserAssessment {
  id: string;
  level_id: string;
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

export default function AssessmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [levels, setLevels] = useState<AssessmentLevel[]>([]);
  const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([]);
  const [userAccess, setUserAccess] = useState<Record<string, boolean>>({});
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showPreAssessment, setShowPreAssessment] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);

  const supabase = createClient();

  const loadData = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        redirect("/auth/login");
      }

      setUser(currentUser);

      // Get all levels
      const { data: levelsData } = await supabase
        .from("assessment_levels")
        .select("*")
        .order("order_index");

      setLevels(levelsData || []);

      if (levelsData) {
        const counts: Record<string, number> = {};
        for (const level of levelsData) {
          const { count } = await supabase
            .from("assessment_topics")
            .select("*", { count: "exact", head: true })
            .eq("level_id", level.id);
          counts[level.id] = count || 0;
        }
        setTopicCounts(counts);
      }

      // Get user level access (token-based)
      const { data: accessData } = await supabase
        .from("user_level_access")
        .select("level_id")
        .eq("user_id", currentUser.id);

      const accessMap: Record<string, boolean> = {};
      accessData?.forEach((a: any) => {
        accessMap[a.level_id] = true;
      });
      setUserAccess(accessMap);

      // Get user assessments
      const { data: assessmentsData } = await supabase
        .from("user_assessments")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      setUserAssessments(assessmentsData || []);

      // Show pre-assessment on first visit
      const hasSeenPreAssessment =
        typeof window !== "undefined" &&
        localStorage.getItem("seen_pre_assessment");
      if (!hasSeenPreAssessment) {
        setShowPreAssessment(true);
        localStorage.setItem("seen_pre_assessment", "true");
      }
    } catch (err) {
      console.error("[v0] Error loading assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTokenRedeemed = () => {
    // Reload user access after token redemption
    loadData();
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-8 sm:py-12">
        <p className="text-slate-600">Loading assessments...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
      {showPreAssessment && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div className="space-y-3 flex-1">
                  <div className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full mb-2">
                    Cherith Learning Compliance Excellence
                  </div>
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                    Pre-Assessment Testing for Healthcare Compliance Excellence
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-slate-700 font-medium">
                    Building a Foundation for Safe and Effective Healthcare
                    Regulation
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreAssessment(false)}
                  className="text-slate-600 hover:text-slate-700 hover:bg-white/50 shrink-0"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Mission Statement */}
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 sm:p-6 shadow-sm border border-blue-100 space-y-4">
                <p className="text-sm sm:text-base leading-relaxed text-slate-800">
                  <span className="font-semibold text-blue-900">
                    Pre-assessment testing is a critical first step
                  </span>{" "}
                  in preparing Cherith Learning's workforce to regulate safely
                  and effectively against Joint Commission-style standards
                  across all domains. This approach allows each participant to
                  see clearly which topics are being assessed and how those
                  topics map directly to the learning modules and regulatory
                  responsibilities they hold.
                </p>

                <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="w-1.5 h-full bg-blue-500 rounded-full shrink-0 mt-1" />
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                    The pre-assessment results drive an{" "}
                    <strong>individualized learning roadmap</strong>—placing
                    staff into beginner, intermediate, or advanced pathways—so
                    that time and resources are focused on closing the most
                    important knowledge and practice gaps that impact{" "}
                    <strong>inspection quality, risk-based regulation</strong>,
                    and overall health-system performance in Edo State.
                  </p>
                </div>
              </div>

              {/* Compliance Domains Section */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4">
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
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Assessment Domains
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Systematically gauging baseline knowledge across 15
                      compliance areas
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {COMPLIANCE_DOMAINS.map((domain, index) => (
                    <motion.div
                      key={domain.code}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="font-bold text-xs text-blue-700">
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

              {/* Personalized Learning CTA */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Targeted, Individualized Training
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      Cherith Learning ensures that training is{" "}
                      <strong>targeted rather than generic</strong>, providing
                      each user with a unique learning experience based on their
                      demonstrated knowledge gaps and learning pathway.
                    </p>
                    <Button
                      onClick={() => setShowPreAssessment(false)}
                      className="bg-amber-600 hover:bg-amber-700 text-white shadow-md mt-2 text-xs sm:text-sm"
                    >
                      Begin Your Assessment Journey
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
            Assessment Levels
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Complete assessments to demonstrate your healthcare compliance
            knowledge and advance your career
          </p>
        </div>
        <Button
          onClick={() => setShowTokenDialog(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Ticket className="w-4 h-4" />
          <span className="hidden sm:inline">Redeem Token</span>
          <span className="sm:hidden">Token</span>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        {levels?.map((level, idx) => {
          const assessments =
            userAssessments?.filter((a) => a.level_id === level.id) || [];
          const completedCount = assessments.filter(
            (a) => a.status === "completed",
          ).length;
          const hasAccess = userAccess[level.id];
          const totalTopics = topicCounts[level.id] || 0;

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card
                className={
                  !hasAccess ? "opacity-75 border-slate-200 bg-slate-50" : ""
                }
              >
                {!hasAccess && (
                  <div className="absolute top-4 right-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                      className="text-yellow-600"
                    >
                      <Lock className="w-5 h-5" />
                    </motion.div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    {level.name}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {level.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!hasAccess ? (
                    <div className="text-center py-6 sm:py-8">
                      <p className="text-xs sm:text-sm text-slate-600 mb-4">
                        Redeem a token to unlock this assessment level.
                      </p>
                      <Button
                        onClick={() => setShowTokenDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                      >
                        <Ticket className="w-4 h-4 mr-2" />
                        Redeem Token
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-700 mb-2">
                          Your Progress
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600">
                          {completedCount} of {totalTopics} topics completed
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/assessments/${level.id}`}
                        className="w-full"
                      >
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm">
                          Start Assessment
                        </Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <TokenRedemptionDialog
        isOpen={showTokenDialog}
        onClose={() => setShowTokenDialog(false)}
        onSuccess={handleTokenRedeemed}
      />
    </div>
  );
}
