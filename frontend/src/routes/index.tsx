import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Map } from '@/components/map/Map'
import { getAll } from '@/api/zones'
import { demoZones } from '@/components/map/demo-data'
import type { Zone } from '@/types/zone'

export const Route = createFileRoute('/')({
  loader: async (): Promise<Zone[]> => {
    try {
      return await getAll()
    } catch {
      return demoZones as Zone[]
    }
  },
  component: Home,
})

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-xl text-primary">{value}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function Home() {
  const zones = useLoaderData({ from: '/' })

  const projectCounts = {
    total: zones.length,
    planting: zones.filter((z) => z.type === 'planting').length,
    trees: zones.reduce((sum, z) => sum + (z.currentCount ?? 0), 0),
    treeTarget: zones.reduce((sum, z) => sum + (z.targetCount ?? 0), 0),
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground">Explore Reforestation</h1>
          <Badge variant="outline" className="text-xs">Beta</Badge>
        </div>
        <p className="text-muted-foreground">Track tree planting initiatives and green coverage across Algeria.</p>
      </div>

      <div className="max-w-7xl mx-auto rounded-lg border">
        <Map zones={zones} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard value={String(projectCounts.total)} label="Total Projects" />
        <StatCard value={String(projectCounts.planting)} label="Planting Zones" />
        <StatCard value={String(projectCounts.trees)} label="Trees Planted" />
        <StatCard value={`${projectCounts.trees} / ${projectCounts.treeTarget}`} label="Trees Progress" />
      </div>
    </div>
  )
}
