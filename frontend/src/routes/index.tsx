import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Map } from '@/features/map/components/Map'
import { useZones } from '@/features/zones/hooks/useZones'
import { useDamageReports } from '@/features/damage-reports/hooks/useDamageReports'
import { computeProjectCounts } from '@/shared/utils/projectCounts'

export const Route = createFileRoute('/')({
  component: Home,
})

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-primary text-xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-muted-foreground text-sm">{label}</p>
      </CardContent>
    </Card>
  )
}

function Home() {
  const { zones, demoMode } = useZones()
  const { damageReports } = useDamageReports()

  const projectCounts = computeProjectCounts(zones)

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-foreground text-3xl font-bold">Explore Reforestation</h1>
          <Badge variant="outline" className="text-xs">
            Beta
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Track tree planting initiatives and green coverage across Algeria.
        </p>
      </div>

      <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border">
        <Map zones={zones} damageReports={damageReports} demoMode={demoMode} />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-4 md:grid-cols-4">
        <StatCard value={String(projectCounts.total)} label="Total Projects" />
        <StatCard value={String(projectCounts.planting)} label="Planting Zones" />
        <StatCard value={String(projectCounts.trees)} label="Trees Planted" />
        <StatCard
          value={`${projectCounts.trees} / ${projectCounts.treeTarget}`}
          label="Trees Progress"
        />
      </div>
    </div>
  )
}
