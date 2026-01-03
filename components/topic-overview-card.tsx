import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopicOverviewProps {
  code: string
  name: string
  beginnerFocus: string
}

export function TopicOverviewCard({ code, name, beginnerFocus }: TopicOverviewProps) {
  return (
    <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">Pre-assessment focus</p>
          <p className="text-sm text-slate-700 leading-relaxed">{beginnerFocus}</p>
        </div>
      </CardContent>
    </Card>
  )
}
