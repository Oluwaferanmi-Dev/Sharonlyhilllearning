import { z } from "zod"

export const priceUpdateSchema = z.object({
  price_per_token: z
    .number()
    .min(0, "Price must be non-negative")
    .max(999999.99, "Price is too high")
    .finite("Price must be a valid number"),
})

export const levelPriceSchema = z.object({
  id: z.string().uuid("Invalid level ID"),
  name: z.string().min(1, "Level name is required"),
  price_per_token: z
    .number()
    .min(0, "Price must be non-negative")
    .max(999999.99, "Price is too high")
    .finite("Price must be a valid number"),
  price_currency: z.string().default("NGN"),
})

export const tokenPurchaseRequestSchema = z.object({
  level_id: z.string().uuid("Invalid level ID"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(10000, "Quantity cannot exceed 10,000"),
  amount_paid: z
    .number()
    .min(0, "Amount must be non-negative")
    .finite("Amount must be a valid number"),
})

export type PriceUpdate = z.infer<typeof priceUpdateSchema>
export type LevelPrice = z.infer<typeof levelPriceSchema>
export type TokenPurchaseRequest = z.infer<typeof tokenPurchaseRequestSchema>
