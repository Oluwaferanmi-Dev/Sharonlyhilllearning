import { createAdminClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { priceUpdateSchema } from '@/lib/schemas/pricing'

/**
 * Update assessment level pricing and details.
 * Admin-only endpoint.
 *
 * PUT /api/admin/levels/[levelId]
 * Body: {
 *   price_per_token?: number (must be >= 0)
 *   description?: string
 * }
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ levelId: string }> }) {
  try {
    const { user, error: adminError } = await requireAdmin()
    if (adminError || !user) return adminError ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const body = await request.json()
    const { levelId } = await params

    // Validate price if provided using schema
    if (body.price_per_token !== undefined) {
      const priceValidation = priceUpdateSchema.safeParse({ price_per_token: body.price_per_token })
      if (!priceValidation.success) {
        const errors = priceValidation.error.flatten().fieldErrors
        return NextResponse.json(
          { error: 'Invalid price', details: errors },
          { status: 400 }
        )
      }
    }

    // Validate description if provided
    if (body.description !== undefined) {
      if (typeof body.description !== 'string') {
        return NextResponse.json(
          { error: 'description must be a string' },
          { status: 400 }
        )
      }
      if (body.description.length > 500) {
        return NextResponse.json(
          { error: 'description must be 500 characters or less' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {}
    if (body.price_per_token !== undefined) {
      updateData.price_per_token = body.price_per_token
      updateData.price_updated_at = new Date().toISOString()
      updateData.price_updated_by = user.id
    }
    if (body.description !== undefined) {
      updateData.description = body.description
    }

    // Update level
    const { data: updatedLevel, error: updateError } = await adminClient
      .from('assessment_levels')
      .update(updateData)
      .eq('id', levelId)
      .select()
      .single()

    if (updateError) {
      console.error('[v0] Level update error:', updateError)
      return NextResponse.json({ error: 'Failed to update level' }, { status: 500 })
    }

    if (!updatedLevel) {
      return NextResponse.json({ error: 'Assessment level not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Level updated successfully',
        level: updatedLevel,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Level update fatal error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

/**
 * Get assessment level details.
 * Public endpoint.
 *
 * GET /api/admin/levels/[levelId]
 */
export async function GET(request: NextRequest, { params }: { params: { levelId: string } }) {
  try {
    const adminClient = createAdminClient()
    const { levelId } = await params

    const { data: level, error } = await adminClient
      .from('assessment_levels')
      .select('id, name, order_index, description, price_per_token, price_currency')
      .eq('id', levelId)
      .maybeSingle()

    if (error || !level) {
      return NextResponse.json({ error: 'Assessment level not found' }, { status: 404 })
    }

    return NextResponse.json({ level }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Level fetch fatal error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
