import { z } from "zod"

/**
 * Validation schemas for assessment content management.
 * Used in admin API routes to validate question and topic data.
 */

// Valid answer options
const ANSWER_OPTIONS = ["A", "B", "C", "D"] as const

export const createQuestionSchema = z.object({
  topic_id: z.string().uuid("Invalid topic ID"),
  question_text: z.string().min(10, "Question must be at least 10 characters").max(1000, "Question too long"),
  option_a: z.string().min(2, "Option A too short").max(200, "Option A too long"),
  option_b: z.string().min(2, "Option B too short").max(200, "Option B too long"),
  option_c: z.string().min(2, "Option C too short").max(200, "Option C too long"),
  option_d: z.string().min(2, "Option D too short").max(200, "Option D too long"),
  correct_answer: z.enum(ANSWER_OPTIONS, {
    errorMap: () => ({ message: "Correct answer must be A, B, C, or D" }),
  }),
  explanation: z.string().min(5, "Explanation too short").max(500, "Explanation too long").optional(),
})

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>

export const updateQuestionSchema = createQuestionSchema.partial().extend({
  // Allow partial updates but validate what's provided
  question_id: z.string().uuid("Invalid question ID"),
})

export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>

export const createTopicSchema = z.object({
  level_id: z.string().uuid("Invalid level ID"),
  name: z.string().min(3, "Topic name too short").max(100, "Topic name too long"),
  description: z.string().min(5, "Description too short").max(500, "Description too long").optional(),
})

export type CreateTopicInput = z.infer<typeof createTopicSchema>

export const updateTopicSchema = createTopicSchema.partial().extend({
  topic_id: z.string().uuid("Invalid topic ID"),
})

export type UpdateTopicInput = z.infer<typeof updateTopicSchema>

export const reorderTopicsSchema = z.object({
  topics: z.array(
    z.object({
      id: z.string().uuid(),
      order_index: z.number().int().min(1),
    })
  ),
})

export type ReorderTopicsInput = z.infer<typeof reorderTopicsSchema>
