"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initAssessmentProtection } from "@/lib/utils/assessment-protection";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

interface Topic {
  id: string;
  name: string;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = params.levelId as string;
  const topicId = params.topicId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    const cleanup = initAssessmentProtection();
    return cleanup;
  }, []);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        // Get topic
        const { data: topicData } = await supabase
          .from("assessment_topics")
          .select("*")
          .eq("id", topicId)
          .single();

        setTopic(topicData);

        // Get questions
        const { data: questionsData } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("topic_id", topicId);

        setQuestions(questionsData || []);
      } catch (error) {
        console.error("Error loading quiz:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuiz();
  }, [topicId, supabase]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Calculate score
      let correctCount = 0;
      for (const question of questions) {
        if (answers[question.id] === question.correct_answer) {
          correctCount++;
        }
      }

      const calculatedScore = Math.round(
        (correctCount / questions.length) * 100
      );

      // Create or update assessment record
      let assessmentId: string;
      const { data: existingAssessment } = await supabase
        .from("user_assessments")
        .select("id")
        .eq("user_id", user.id)
        .eq("topic_id", topicId)
        .single();

      if (existingAssessment) {
        assessmentId = existingAssessment.id;
        await supabase
          .from("user_assessments")
          .update({
            status: "completed",
            score: calculatedScore,
            passed: calculatedScore >= 70,
            completed_at: new Date(),
          })
          .eq("id", assessmentId);
      } else {
        const { data: newAssessment } = await supabase
          .from("user_assessments")
          .insert({
            user_id: user.id,
            level_id: levelId,
            topic_id: topicId,
            status: "completed",
            score: calculatedScore,
            passed: calculatedScore >= 70,
            completed_at: new Date(),
          })
          .select("id")
          .single();

        assessmentId = newAssessment?.id || "";
      }

      // Save individual answers
      for (const question of questions) {
        const isCorrect = answers[question.id] === question.correct_answer;

        await supabase.from("user_quiz_answers").insert({
          user_id: user.id,
          question_id: question.id,
          assessment_id: assessmentId,
          selected_answer: answers[question.id],
          is_correct: isCorrect,
        });
      }

      setScore(calculatedScore);
      setShowResults(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-slate-600">Loading quiz...</p>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="px-6 py-12 max-w-2xl mx-auto">
        <Card
          className={
            score >= 70
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardHeader className="text-center">
            <CardTitle
              className={score >= 70 ? "text-green-900" : "text-red-900"}
            >
              Quiz Complete!
            </CardTitle>
            <CardDescription
              className={score >= 70 ? "text-green-800" : "text-red-800"}
            >
              {topic?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p
                className={`text-5xl font-bold ${
                  score >= 70 ? "text-green-600" : "text-red-600"
                }`}
              >
                {score}%
              </p>
              <p
                className={`text-lg font-semibold mt-2 ${
                  score >= 70 ? "text-green-900" : "text-red-900"
                }`}
              >
                {score >= 70 ? "Passed!" : "Not Passed"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {
                    questions.filter((q) => answers[q.id] === q.correct_answer)
                      .length
                  }
                </p>
                <p className="text-sm text-slate-600">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {
                    questions.filter((q) => answers[q.id] !== q.correct_answer)
                      .length
                  }
                </p>
                <p className="text-sm text-slate-600">Incorrect</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-2">
              <p className="font-semibold text-slate-900">Results Summary</p>
              <p className="text-sm text-slate-700">
                You answered {Object.keys(answers).length} out of{" "}
                {questions.length} questions.
              </p>
              {score >= 70 && (
                <p className="text-sm text-green-700 font-semibold">
                  Congratulations! You passed this assessment.
                </p>
              )}
              {score < 70 && (
                <p className="text-sm text-red-700 font-semibold">
                  Please review the material and try again.
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => router.push(`/dashboard/assessments/${levelId}`)}
              >
                Back to Level
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-slate-600">No questions found for this topic.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = Math.round(
    ((currentQuestionIndex + 1) / questions.length) * 100
  );

  return (
    <div className="px-6 py-12 max-w-2xl mx-auto space-y-8">
      {/* Back button */}
      <Button
        variant="outline"
        className="mb-4 bg-transparent"
        onClick={() => router.back()}
      >
        ← Back
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">{topic?.name}</h1>
        <p className="text-slate-600">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Progress</span>
          <span className="font-semibold text-slate-900">{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className="assessment-protected">
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={(value) =>
              handleAnswerChange(currentQuestion.id, value)
            }
          >
            <div className="space-y-4">
              {[
                { value: "A", label: currentQuestion.option_a },
                { value: "B", label: currentQuestion.option_b },
                { value: "C", label: currentQuestion.option_c },
                { value: "D", label: currentQuestion.option_d },
              ].map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50"
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="flex-1 cursor-pointer"
                  >
                    <strong>{option.value}.</strong> {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() =>
            setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
          }
          disabled={currentQuestionIndex === 0}
          className="flex-1"
        >
          Previous
        </Button>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            disabled={!answers[currentQuestion.id]}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={
              !answers[currentQuestion.id] ||
              isSubmitting ||
              Object.keys(answers).length !== questions.length
            }
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        )}
      </div>

      {/* Answer summary */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">Answer Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                  answers[q.id]
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                } ${
                  currentQuestionIndex === idx ? "ring-2 ring-blue-400" : ""
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
