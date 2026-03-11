import { createAdminClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'

/**
 * Get token inventory for all levels
 * Returns: tokens purchased, used, and remaining per level
 *
 * GET /api/admin/tokens/inventory
 */
export async function GET(request: NextRequest) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const adminClient = createAdminClient()

    // Get all levels
    const { data: levels, error: levelsError } = await adminClient
      .from('assessment_levels')
      .select('id, name, order_index')
      .order('order_index')

    if (levelsError || !levels) {
      return NextResponse.json({ error: 'Failed to fetch levels' }, { status: 500 })
    }

    // For each level, calculate token stats
    const inventory = await Promise.all(
      levels.map(async (level) => {
        // Total tokens purchased for this level
        const { data: purchases } = await adminClient
          .from('token_purchases')
          .select('quantity')
          .eq('level_id', level.id)

        const totalPurchased = purchases?.reduce((sum, p) => sum + p.quantity, 0) || 0

        // Count tokens by status
        const { data: tokens } = await adminClient
          .from('access_tokens')
          .select('status')
          .eq('level_id', level.id)

        const unused = tokens?.filter((t) => t.status === 'unused').length || 0
        const used = tokens?.filter((t) => t.status === 'used').length || 0
        const expired = tokens?.filter((t) => t.status === 'expired').length || 0

        return {
          level_id: level.id,
          level_name: level.name,
          total_purchased: totalPurchased,
          tokens_used: used,
          tokens_unused: unused,
          tokens_expired: expired,
          utilization_rate: totalPurchased > 0 ? (used / totalPurchased * 100).toFixed(1) : 0,
        }
      })
    )

    return NextResponse.json({ inventory }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Token inventory error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
