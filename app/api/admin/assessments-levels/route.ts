import { createAdminClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'

/**
 * Get all assessment levels (for admin use)
 *
 * GET /api/admin/assessments-levels
 */
export async function GET(request: NextRequest) {
  try {
    const { error: adminError } = await requireAdmin()
    if (adminError) return adminError

    const adminClient = createAdminClient()

    const { data: levels, error } = await adminClient
      .from('assessment_levels')
      .select('id, name, order_index, description, price, requires_payment')
      .order('order_index')

    if (error) {
      console.error('[v0] Failed to fetch levels:', error)
      return NextResponse.json({ error: 'Failed to fetch levels' }, { status: 500 })
    }

    return NextResponse.json({ levels: levels || [] }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Levels fetch error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
