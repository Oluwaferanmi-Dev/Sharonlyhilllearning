import crypto from 'crypto'

/**
 * Token utilities for the seat-based access system.
 * Handles token code generation, validation, and redemption.
 */

/**
 * Generate a unique, hard-to-guess token code.
 * Format: 8 uppercase alphanumeric characters (e.g., "A3K9X2L7")
 * Entropy: ~42 bits (safe for brute force resistance)
 */
export function generateTokenCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const tokenLength = 8
  let token = ''
  const randomBytes = crypto.getRandomValues(new Uint8Array(tokenLength))
  for (let i = 0; i < tokenLength; i++) {
    token += chars[randomBytes[i] % chars.length]
  }
  return token
}

/**
 * Validate token code format
 */
export function isValidTokenCode(code: string): boolean {
  // Must be 8 uppercase alphanumeric characters
  return /^[A-Z0-9]{8}$/.test(code)
}

/**
 * Token redemption result types
 */
export type RedemptionResult =
  | { success: true; userId: string; levelId: string }
  | { success: false; error: string }

/**
 * Token status enum
 */
export const TOKEN_STATUS = {
  UNUSED: 'unused',
  USED: 'used',
  EXPIRED: 'expired',
} as const

export type TokenStatus = typeof TOKEN_STATUS[keyof typeof TOKEN_STATUS]

/**
 * Payment status enum
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]
