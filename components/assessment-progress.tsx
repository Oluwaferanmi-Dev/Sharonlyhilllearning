import { Card, CardContent } from "@/components/ui/card"

interface AssessmentsByLevel {
  level: {
    id: string
    name: string
    description?: string
  }
  total: number
  completed: number
  passed: number
  inProgress?: any
  isLocked: boolean
}

export function AssessmentProgress({
  assessmentsByLevel,
}: {
  assessmentsByLevel: AssessmentsByLevel[]
}) {
  if (!assessmentsByLevel) return null

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {assessmentsByLevel.map(({ level, total, completed, passed, isLocked }) => {
            const progress = total > 0 ? (completed / total) * 100 : 0

            return (
              <div key={level.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{level.name} Level</p>
                    {isLocked && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-semibold">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    {completed} of {total} topics completed • {passed} topics passed
                  </p>
                </div>
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
