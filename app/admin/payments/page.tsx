import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TokenManagementPanel } from "@/components/token-management-panel"

export default async function AdminPaymentsPage() {
  const adminClient = createAdminClient()

  // Staff count
  const { data: staffProfiles } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("role", "staff")

  const totalStaff = staffProfiles?.length ?? 0

  // Level pricing
  const { data: levels } = await adminClient
    .from("assessment_levels")
    .select("id, name, price_per_token")
    .order("order_index", { ascending: true })

  // Token purchases summary
  const { data: purchases } = await adminClient
    .from("token_purchases")
    .select("quantity, amount_paid")

  const totalTokensPurchased =
    purchases?.reduce((sum, p: any) => sum + (p.quantity || 0), 0) ?? 0
  const totalAmountPaid =
    purchases?.reduce((sum, p: any) => sum + Number(p.amount_paid || 0), 0) ?? 0

  // Access tokens summary
  const { data: tokens } = await adminClient
    .from("access_tokens")
    .select("status")

  const totalUnusedTokens =
    tokens?.filter((t: any) => t.status === "unused").length ?? 0
  const totalUsedTokens =
    tokens?.filter((t: any) => t.status === "used").length ?? 0
  const totalExpiredTokens =
    tokens?.filter((t: any) => t.status === "expired").length ?? 0

  // Staff access statistics per level
  const { data: accessRows } = await adminClient
    .from("user_level_access")
    .select("level_id, user_id")

  const accessByLevel = new Map<
    string,
    { levelName: string; userIds: Set<string> }
  >()

  ;(levels || []).forEach((level: any) => {
    accessByLevel.set(level.id, {
      levelName: level.name,
      userIds: new Set<string>(),
    })
  })

  ;(accessRows || []).forEach((row: any) => {
    const entry = accessByLevel.get(row.level_id)
    if (entry) {
      entry.userIds.add(row.user_id)
    }
  })

  return (
    <div className="px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments & Tokens</h1>
          <p className="text-slate-600 mt-2">
            Manage billing, token purchases, and staff assessment access.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Billing Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Overview</CardTitle>
          <CardDescription>
            High-level snapshot of staff, tokens, and payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-slate-600 font-medium mb-1">
                Total Staff
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {totalStaff}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium mb-1">
                Tokens Purchased
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {totalTokensPurchased}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium mb-1">
                Tokens Used
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {totalUsedTokens}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium mb-1">
                Tokens Remaining
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {totalUnusedTokens}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Expired: {totalExpiredTokens}
              </p>
            </div>
          </div>
          <div className="mt-6 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Total amount paid via token purchases:</span>{" "}
              ${totalAmountPaid.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Level Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Level Pricing</CardTitle>
          <CardDescription>
            Current price per token for each assessment level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {levels && levels.length > 0 ? (
            <div className="space-y-2">
              {levels.map((level: any) => (
                <div
                  key={level.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="font-medium text-slate-900">
                    {level.name}
                  </div>
                  <div className="text-sm text-slate-700">
                    ${Number(level.price_per_token || 0).toFixed(2)} per token
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              No assessment levels found. Configure levels on the Assessments
              page.
            </p>
          )}
          <div className="mt-4">
            <Link href="/admin/assessments">
              <Button variant="outline" size="sm">
                Manage level pricing
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Token Management (purchase + inventory) */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Tokens</CardTitle>
          <CardDescription>
            Buy tokens with Stripe or create manual purchases, then distribute
            codes to staff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokenManagementPanel />
        </CardContent>
      </Card>

      {/* Access Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Access Statistics</CardTitle>
          <CardDescription>
            Number of staff with access to each assessment level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {levels && levels.length > 0 ? (
            <div className="space-y-2">
              {levels.map((level: any) => {
                const entry = accessByLevel.get(level.id)
                const count = entry ? entry.userIds.size : 0
                return (
                  <div
                    key={level.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="font-medium text-slate-900">
                      {level.name}
                    </div>
                    <div className="text-sm text-slate-700">
                      {count} staff member{count === 1 ? "" : "s"} with access
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              No levels found. Access statistics will appear once levels are
              configured.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
