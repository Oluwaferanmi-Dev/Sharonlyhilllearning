import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminPaymentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: staffProfiles } = await supabase.from("profiles").select("*").eq("role", "staff")

  const { data: paymentStatus } = await supabase.from("organization_payments").select("*").limit(1).single()

  const totalStaff = staffProfiles?.length || 0
  const amountDue = totalStaff * 100

  return (
    <div className="px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payment Management</h1>
          <p className="text-slate-600 mt-2">EdoHerma subscription and payment details</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">Subscription Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-orange-800 font-medium mb-2">Status</p>
              <div className="px-3 py-2 bg-orange-100 rounded-lg border border-orange-300">
                <p className="text-lg font-bold text-orange-900">{paymentStatus?.status || "Unpaid"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-orange-800 font-medium mb-2">Total Staff</p>
              <p className="text-4xl font-bold text-orange-900">{totalStaff}</p>
            </div>
            <div>
              <p className="text-sm text-orange-800 font-medium mb-2">Amount Due</p>
              <p className="text-4xl font-bold text-orange-900">${amountDue.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-orange-200 space-y-3">
            <p className="font-semibold text-slate-900">Payment Calculation</p>
            <div className="text-sm text-slate-700 space-y-2">
              <p>Unit Price: $100 per staff member</p>
              <p>Total Staff: {totalStaff}</p>
              <p className="border-t border-slate-200 pt-2 font-semibold">Total Due: ${amountDue.toLocaleString()}</p>
            </div>
          </div>

          {paymentStatus?.status === "unpaid" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="font-semibold text-red-900">Action Required</p>
              <p className="text-sm text-red-800">
                Payment must be processed to unlock assessment access for staff members. Once payment is received:
              </p>
              <ul className="text-sm text-red-800 list-disc list-inside space-y-1 ml-2">
                <li>Beginner assessment level will be unlocked</li>
                <li>All registered staff can begin assessments</li>
                <li>Intermediate & Advanced levels remain locked pending further approval</li>
              </ul>
              <Button className="w-full bg-red-600 hover:bg-red-700 mt-4">Simulate Payment (Demo Only)</Button>
            </div>
          )}

          {paymentStatus?.status === "paid" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Payment Received:</strong> Beginner assessments are now unlocked for all staff members.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Level Access</CardTitle>
          <CardDescription>Current access levels for staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                level: "Beginner",
                status: paymentStatus?.status === "paid" ? "✓ Unlocked" : "✗ Locked",
                color: "green",
              },
              { level: "Intermediate", status: "✗ Locked", color: "gray" },
              { level: "Advanced", status: "✗ Locked", color: "gray" },
            ].map((item) => (
              <div
                key={item.level}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="font-medium text-slate-900">{item.level}</div>
                <div
                  className={`px-3 py-1 rounded text-sm font-semibold ${
                    item.color === "green" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Payment records and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Invoice #001 - Beginner Assessment License</p>
                <p className="text-sm text-slate-600">EdoHerma Organization</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">${amountDue.toLocaleString()}</p>
                <p className="text-sm text-slate-600">{paymentStatus?.status || "Unpaid"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
