"use client"

import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Topic {
  id: string
  name: string
  description: string
}

interface UserAssessment {
  id: string
  topic_id: string
  status: string
  score: number | null
}

interface Props {
  topics: Topic[]
  userAssessments: UserAssessment[]
  levelId: string
  levelName: string
}

const topicOverviews: Record<string, { beginnerFocus: string; intermediateFocus?: string }> = {
  "Care, Treatment, and Services (CTS)": {
    beginnerFocus: "Beginner: patient pathway basics (assessment, care plan, treatment, follow-up), informed consent concepts.",
    intermediateFocus: "Intermediate: Individual care planning, risk assessment, and continuity of care with complex patient needs.",
  },
  "Environment of Care (EC)": {
    beginnerFocus: "Beginner: basics of safety in facilities (clean water, waste, fire exits, crowding).",
    intermediateFocus: "Intermediate: Hazard surveillance systems, safety management, and preventive maintenance.",
  },
  "Emergency Management (EM)": {
    beginnerFocus: "Beginner: knowledge of basic emergency types and the idea of a facility emergency plan.",
    intermediateFocus: "Intermediate: All-hazards planning, drills with lessons learned, and response coordination.",
  },
  "Human Resources Management (HRM)": {
    beginnerFocus: "Beginner: basic awareness of required licenses, job descriptions, and orientation.",
    intermediateFocus: "Intermediate: Competency verification, performance management, and credential tracking systems.",
  },
  "Infection Prevention and Control (IC)": {
    beginnerFocus: "Beginner: hand hygiene, PPE basics, isolation basics, safe injection.",
    intermediateFocus: "Intermediate: Surveillance systems, outbreak investigation methods, and prevention strategy implementation.",
  },
  "Information Management (IM)": {
    beginnerFocus: "Beginner: basic documentation rules, confidentiality, record legibility.",
    intermediateFocus: "Intermediate: Data quality, consistency verification, security protocols, and system validation.",
  },
  Leadership: {
    beginnerFocus: "Beginner: awareness that each facility must have responsible leaders.",
    intermediateFocus: "Intermediate: Governance structures, accountability mechanisms, and safety culture development.",
  },
  "Life Safety (LS)": {
    beginnerFocus: "Beginner: fire exits, alarms, evacuation basics.",
    intermediateFocus: "Intermediate: Fire safety systems, egress design compliance, emergency procedures, and utility safety.",
  },
  "Medication Management (MM)": {
    beginnerFocus: "Beginner: storage, labelling, expiry checking, controlled drugs basics.",
    intermediateFocus: "Intermediate: Selection criteria, high-alert medication safeguards, and error prevention systems.",
  },
  "National Patient Safety Goals (NPSG)": {
    beginnerFocus: "Beginner: simple safety goals (correct patient identification, communication, infection prevention).",
    intermediateFocus: "Intermediate: Multi-faceted safety systems, equitable outcome measurement, and reduction of healthcare-associated harms.",
  },
  "Performance Improvement (PI)": {
    beginnerFocus: "Beginner: understanding indicators and simple PDSA cycle basics.",
    intermediateFocus: "Intermediate: Data-driven improvement, measurement systems, and sustainability of changes.",
  },
  "Accreditation Participation Requirements (APR)": {
    beginnerFocus: "Beginner: foundational understanding of accreditation requirements.",
    intermediateFocus: "Intermediate: Accreditation cooperation, truthful communication obligations, and reporting requirements.",
  },
}

export function AssessmentLevelTopics({ topics, userAssessments, levelId, levelName }: Props) {
  return (
    <div className="grid gap-4">
      {topics.map((topic, idx) => {
        const assessment = userAssessments.find((a) => a.topic_id === topic.id)
        const isCompleted = assessment?.status === "completed"
        const isInProgress = assessment?.status === "in_progress"
        const score = assessment?.score
        const overview = topicOverviews[topic.name]
        const focusText =
          levelName === "Intermediate" && overview?.intermediateFocus
            ? overview.intermediateFocus
            : overview?.beginnerFocus || topic.description

        return (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
          >
            <Card className={isCompleted ? "border-green-200 bg-green-50" : isInProgress ? "border-yellow-200 bg-yellow-50" : ""}>
              <CardHeader className="pb-3">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{topic.name}</CardTitle>
                    {isCompleted && (
                      <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                        Completed
                      </span>
                    )}
                    {isInProgress && (
                      <span className="inline-block px-2 py-1 bg-yellow-600 text-white text-xs font-semibold rounded">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-600">{levelName} level assessment focus</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{focusText}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pt-2 border-t border-slate-200">
                  <CardDescription>5 multiple-choice questions</CardDescription>
                </div>
                {isCompleted && (
                  <div className="flex items-center gap-3 justify-end">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{score}%</p>
                      <p className="text-xs text-green-700">Completed</p>
                    </div>
                  </div>
                )}
                <Link href={`/dashboard/assessments/${levelId}/${topic.id}`}>
                  <Button
                    className="w-full"
                    disabled={isCompleted}
                    variant={isCompleted ? "outline" : "default"}
                    style={isCompleted ? { backgroundColor: "#e5e7eb", color: "#6b7280", cursor: "not-allowed" } : { backgroundColor: "#2563eb" }}
                  >
                    {isCompleted ? "No Retakes Allowed" : isInProgress ? "Continue Topic" : "Start Topic"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
