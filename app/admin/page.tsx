import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, BookOpen, CreditCard } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <div className="px-6 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Manage staff, assessments, and payments</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base">Staff Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">View and manage all staff members, their assessments, and progress.</p>
            <Link href="/admin/staff">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Go to Staff</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Assessment Content</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">Create, edit, and manage assessment topics and questions.</p>
            <Link href="/admin/assessments">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">Manage Assessments</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-green-600" />
              <CardTitle className="text-base">Payments & Subscriptions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">View payment history and manage token purchases.</p>
            <Link href="/admin/payments">
              <Button className="w-full bg-green-600 hover:bg-green-700">View Payments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
