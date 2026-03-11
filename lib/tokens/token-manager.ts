import crypto from 'crypto'

/**
 * Token utilities for the seat-based access system.
 * Handles token code generation, validation, and redemption.
 */

/**
 * Generate a unique, hard-to-guess token code.
 * Format: CHR-XXXX-XXXX-XXXX (uppercase alphanumeric segments)
 * Example: CHR-A3K9-X2L7-M9P5
 * Entropy: ~60 bits (safe for brute force resistance)
 *
 * Uses cryptographically secure random generation to prevent guessing.
 */
export function generateTokenCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const charCount = chars.length
  const segments = 3 // 3 segments after "CHR-"
  const charsPerSegment = 4
  const totalChars = segments * charsPerSegment

  // Generate cryptographically secure random bytes
  const randomBytes = crypto.getRandomValues(new Uint8Array(totalChars))

  let result = 'CHR-'
  for (let i = 0; i < totalChars; i++) {
    // Use modulo to map random bytes to character set
    result += chars[randomBytes[i] % charCount]

    // Add segment separator
    if ((i + 1) % charsPerSegment === 0 && i < totalChars - 1) {
      result += '-'
    }
  }

  return result
}

/**
 * Validate token code format
 * Expects format: CHR-XXXX-XXXX-XXXX
 */
export function isValidTokenCode(code: string): boolean {
  // Pattern: CHR-4chars-4chars-4chars (all uppercase alphanumeric)
  return /^CHR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)
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
