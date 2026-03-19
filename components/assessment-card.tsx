"use client";

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
import { Lock } from "lucide-react";
import { ProgressRing } from "./progress-ring";

interface AssessmentCardProps {
  levelId: string;
  name: string;
  description: string;
  completedCount: number;
  totalTopics: number;
  isLocked: boolean;
  onStart?: () => void;
}

const TOPIC_OVERVIEWS: Record<string, { title: string; focus: string }> = {
  "Care, Treatment, and Services": {
    title: "Care, Treatment, and Services (CTS)",
    focus:
      "patient pathway basics (assessment, care plan, treatment, follow-up), informed consent concepts.",
  },
  "Environment of Care": {
    title: "Environment of Care (EC)",
    focus:
      "basics of safety in facilities (clean water, waste, fire exits, crowding).",
  },
  "Emergency Management": {
    title: "Emergency Management (EM)",
    focus:
      "knowledge of basic emergency types in Edo (outbreaks, mass casualty, fire) and the idea of a facility emergency plan.",
  },
  "Human Resources Management": {
    title: "Human Resources Management (HRM)",
    focus:
      "basic awareness of required licenses, job descriptions, and orientation.",
  },
  "Infection Prevention and Control": {
    title: "Infection Prevention and Control (IC)",
    focus: "hand hygiene, PPE basics, isolation basics, safe injection.",
  },
  "Information Management": {
    title: "Information Management (IM)",
    focus: "basic documentation rules, confidentiality, record legibility.",
  },
  Leadership: {
    title: "Leadership (LD)",
    focus: "awareness that each facility must have responsible leaders.",
  },
  "Life Safety": {
    title: "Life Safety (LS)",
    focus: "fire exits, alarms, evacuation basics.",
  },
  "Medication Management": {
    title: "Medication Management (MM)",
    focus: "storage, labelling, expiry checking, controlled drugs basics.",
  },
  "National Patient Safety Goals": {
    title: "National Patient Safety Goals (NPSG)",
    focus:
      "simple safety goals (correct patient identification, communication, infection prevention).",
  },
  "Performance Improvement": {
    title: "Performance Improvement (PI)",
    focus: "understanding indicators and simple PDSA cycle basics.",
  },
};

export function AssessmentCard({
  levelId,
  name,
  description,
  completedCount,
  totalTopics,
  isLocked,
  onStart,
}: AssessmentCardProps) {
  const progress = Math.round((completedCount / totalTopics) * 100);

  // BUG FIX
  const topicOverview =
    TOPIC_OVERVIEWS[name] ??
    TOPIC_OVERVIEWS[name.replace(/\s*\([^)]*\)\s*$/, "")];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={!isLocked ? { y: -8 } : {}}
      className="h-full"
    >
      <Card
        className={`relative h-full transition-all duration-300 ${
          isLocked
            ? "opacity-75 border-slate-200 bg-slate-50"
            : "border-slate-200 hover:shadow-xl hover:border-blue-200"
        }`}
      >
        {isLocked && (
          <div className="absolute top-4 right-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="text-yellow-600"
            >
              <Lock className="w-5 h-5" />
            </motion.div>
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {topicOverview && !isLocked && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2"
            >
              <p className="text-sm font-semibold text-blue-900">
                Pre-assessment focus
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Beginner:</span>{" "}
                {topicOverview.focus}
              </p>
            </motion.div>
          )}

          {isLocked ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4 text-center py-8"
            >
              <p className="text-sm text-slate-600">
                Admin payment required to unlock this assessment level.
              </p>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                disabled
              >
                <Lock className="w-4 h-4 mr-2" />
                Locked
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <ProgressRing progress={progress} size={100} strokeWidth={6} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-semibold text-slate-900">
                    {completedCount}/{totalTopics} completed
                  </span>
                </div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  origin="left"
                  className="w-full bg-slate-200 rounded-full h-2 overflow-hidden"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="bg-blue-600 h-2 rounded-full"
                  />
                </motion.div>
              </div>

              <Link href={`/dashboard/assessments/${levelId}`}>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={onStart}
                >
                  {completedCount > 0 ? "Continue Assessment" : "Start Topic"}
                </Button>
              </Link>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
