"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

interface StaffProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  role: string;
  created_at: string;
  profile_picture_url?: string; // Added profile picture URL field
}

interface TopicAssessment {
  id: string;
  topicId: string;
  topicName: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  completedAt: string | null;
}

interface LevelAssessments {
  levelId: string;
  levelName: string;
  topics: TopicAssessment[];
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  options: Record<string, string>;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface AssessmentDetail {
  id: string;
  topicName: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
}

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.staffId as string;

  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [assessmentsByLevel, setAssessmentsByLevel] = useState<
    LevelAssessments[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(
    null
  );
  const [assessmentDetails, setAssessmentDetails] = useState<
    Record<string, { assessment: AssessmentDetail; results: QuestionResult[] }>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/staff/${staffId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch staff details");
        }

        const data = await response.json();
        setStaff(data.staff);
        setAssessmentsByLevel(data.assessmentsByLevel);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load staff details";
        console.error("[v0] Error loading staff details:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      fetchStaffDetails();
    }
  }, [staffId]);

  const handleViewDetails = async (assessmentId: string) => {
    if (expandedAssessment === assessmentId) {
      setExpandedAssessment(null);
      return;
    }

    if (assessmentDetails[assessmentId]) {
      setExpandedAssessment(assessmentId);
      return;
    }

    setLoadingDetails((prev) => new Set([...prev, assessmentId]));
    try {
      const response = await fetch(
        `/api/admin/staff/${staffId}/assessment-results?assessmentId=${assessmentId}`
      );
      if (!response.ok) throw new Error("Failed to fetch details");

      const data = await response.json();
      setAssessmentDetails((prev) => ({
        ...prev,
        [assessmentId]: data,
      }));
      setExpandedAssessment(assessmentId);
    } catch (err) {
      console.error("[v0] Error fetching assessment details:", err);
    } finally {
      setLoadingDetails((prev) => {
        const next = new Set(prev);
        next.delete(assessmentId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-12">
        <p>Loading staff details...</p>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="px-6 py-12">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">
              {error || "Staff member not found"}
            </p>
            <Button onClick={() => router.push("/admin/staff")}>
              Back to Staff List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalTopics = assessmentsByLevel.reduce(
    (sum, level) => sum + level.topics.length,
    0
  );
  const completedTopics = assessmentsByLevel.reduce(
    (sum, level) =>
      sum + level.topics.filter((t) => t.status === "completed").length,
    0
  );
  const passedTopics = assessmentsByLevel.reduce(
    (sum, level) => sum + level.topics.filter((t) => t.passed === true).length,
    0
  );

  return (
    <div className="px-6 py-12 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/staff")}
          className="bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Staff Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {staff.profile_picture_url ? (
                <div className="flex-shrink-0">
                  <Image
                    src={staff.profile_picture_url || "/placeholder.svg"}
                    alt={`${staff.first_name} ${staff.last_name}`}
                    width={200}
                    height={200}
                    className="w-48 h-48 rounded-lg object-cover border-4 border-slate-200 shadow-lg"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 rounded-lg bg-slate-200 flex items-center justify-center border-4 border-slate-300 shadow-lg flex-shrink-0">
                  <span className="text-6xl font-bold text-slate-400">
                    {staff.first_name[0]}
                    {staff.last_name[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">
                  {staff.first_name} {staff.last_name}
                </CardTitle>
                <CardDescription className="text-base">
                  {staff.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Department</p>
                <p className="font-medium text-slate-900">{staff.department}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Joined</p>
                <p className="font-medium text-slate-900">
                  {new Date(staff.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200">
              <Link href={`/admin/staff/${staffId}/assessments`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  View All Assessments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalTopics}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {completedTopics}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {passedTopics}
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Assessment Breakdown by Level */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Assessment Progress
        </h2>
        <div className="space-y-6">
          {assessmentsByLevel.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-slate-600">
                  No assessments started yet
                </p>
              </CardContent>
            </Card>
          ) : (
            assessmentsByLevel.map((level, idx) => (
              <Card key={level.levelId}>
                <CardHeader>
                  <CardTitle>{level.levelName} Level</CardTitle>
                  <CardDescription>
                    {
                      level.topics.filter((t) => t.status === "completed")
                        .length
                    }{" "}
                    of {level.topics.length} topics completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {level.topics.map((topic, topicIdx) => (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: topicIdx * 0.05, duration: 0.3 }}
                        className="space-y-2"
                      >
                        <div
                          className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                            topic.status === "completed"
                              ? topic.passed
                                ? "border-green-200 bg-green-50 hover:bg-green-100"
                                : "border-red-200 bg-red-50 hover:bg-red-100"
                              : topic.status === "in_progress"
                              ? "border-blue-200 bg-blue-50"
                              : "border-slate-200 bg-slate-50"
                          }`}
                          onClick={() =>
                            topic.status === "completed" &&
                            handleViewDetails(topic.id)
                          }
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {topic.status === "completed" ? (
                              topic.passed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )
                            ) : topic.status === "in_progress" ? (
                              <Clock className="w-5 h-5 text-blue-600" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                            )}
                            <div>
                              <p className="font-medium text-slate-900">
                                {topic.topicName}
                              </p>
                              <p className="text-xs text-slate-600">
                                {topic.status === "completed"
                                  ? `Completed ${new Date(
                                      topic.completedAt!
                                    ).toLocaleDateString()}`
                                  : topic.status === "in_progress"
                                  ? "In Progress"
                                  : "Not Started"}
                              </p>
                            </div>
                          </div>
                          {topic.status === "completed" && (
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <p
                                  className={`text-2xl font-bold ${
                                    topic.passed
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {topic.score}%
                                </p>
                                <p
                                  className={`text-xs font-semibold ${
                                    topic.passed
                                      ? "text-green-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {topic.passed ? "Passed" : "Failed"}
                                </p>
                              </div>
                              <Link
                                href={`/admin/staff/${staffId}/assessments/${topic.id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white"
                                >
                                  View Details
                                </Button>
                              </Link>
                              <ChevronDown
                                className={`w-5 h-5 text-slate-600 transition-transform ${
                                  expandedAssessment === topic.id
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </div>
                          )}
                        </div>

                        {/* Detailed Results View */}
                        {expandedAssessment === topic.id &&
                          assessmentDetails[topic.id] && (
                            <Card className="ml-4 border-slate-300 bg-slate-50">
                              <CardHeader>
                                <CardTitle className="text-base">
                                  Question-by-Question Results
                                </CardTitle>
                                <CardDescription>
                                  {
                                    assessmentDetails[topic.id].assessment
                                      .correctCount
                                  }{" "}
                                  of{" "}
                                  {
                                    assessmentDetails[topic.id].assessment
                                      .totalQuestions
                                  }{" "}
                                  correct
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {assessmentDetails[topic.id].results.map(
                                  (result, qIdx) => (
                                    <div
                                      key={result.questionId}
                                      className={`p-4 rounded-lg border-2 ${
                                        result.isCorrect
                                          ? "border-green-200 bg-green-50"
                                          : "border-red-200 bg-red-50"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2 mb-3">
                                        <p className="font-semibold text-slate-900">
                                          Q{qIdx + 1}. {result.questionText}
                                        </p>
                                        {result.isCorrect ? (
                                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                                        ) : (
                                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                                        )}
                                      </div>
                                      <div className="space-y-2 text-sm">
                                        {Object.entries(result.options).map(
                                          ([key, value]) => (
                                            <div
                                              key={key}
                                              className={`p-2 rounded ${
                                                key === result.correctAnswer
                                                  ? "bg-green-100 border border-green-300 font-semibold"
                                                  : key ===
                                                      result.studentAnswer &&
                                                    !result.isCorrect
                                                  ? "bg-red-100 border border-red-300 font-semibold"
                                                  : "bg-white border border-slate-200"
                                              }`}
                                            >
                                              <span className="font-medium">
                                                {key}.
                                              </span>{" "}
                                              {value}
                                              {key === result.correctAnswer && (
                                                <span className="ml-2 text-green-700">
                                                  ✓ Correct
                                                </span>
                                              )}
                                              {key === result.studentAnswer &&
                                                !result.isCorrect && (
                                                  <span className="ml-2 text-red-700">
                                                    ✗ Selected
                                                  </span>
                                                )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </CardContent>
                            </Card>
                          )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
