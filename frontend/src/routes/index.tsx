import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Map } from '@/components/map/Map'
import { zoneService } from '@/services/zones'
import { damageReportService } from '@/services/damage-reports'
import { demoZones } from '@/components/map/demo-data'
import { demoDamageReports } from '@/components/map/demo-damage-data'
import { isValidCoordinate } from '@/components/map/helpers'
import { computeProjectCounts } from '@/helpers/projectCounts'
import type { Zone } from '@/types/zone'
import type { DamageReport } from '@/types/damage-report'

interface LoaderResult {
  zones: Zone[]
  damageReports: DamageReport[]
  demoMode: boolean
}

export const Route = createFileRoute('/')({
  loader: async (): Promise<LoaderResult> => {
    const [zonesResult, damageResult] = await Promise.allSettled([
      zoneService.getAll(),
      damageReportService.getAll(),
    ])

    const zonesResultData = zonesResult.status === 'fulfilled' ? zonesResult.value : null
    const damageResultData = damageResult.status === 'fulfilled' ? damageResult.value : null

    if (zonesResultData) {
      console.info(`[${new Date().toISOString()}] Zones loaded from backend`)
      return {
        zones: zonesResultData,
        damageReports: damageResultData ?? [],
        demoMode: false,
      }
    }

    const reason = zonesResult.status === 'rejected' ? zonesResult.reason : 'unknown error'
    console.error(`[${new Date().toISOString()}] Backend unavailable, using demo data:`, reason)
    return {
      zones: demoZones.filter((z) => isValidCoordinate(z.lat, z.lng)),
      damageReports: damageResultData ?? demoDamageReports,
      demoMode: true,
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
  const { zones, damageReports, demoMode } = useLoaderData({ from: '/' })

  const projectCounts = computeProjectCounts(zones)

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground">Explore Reforestation</h1>
          <Badge variant="outline" className="text-xs">Beta</Badge>
        </div>
        <p className="text-muted-foreground">Track tree planting initiatives and green coverage across Algeria.</p>
      </div>

      <div className="max-w-7xl mx-auto rounded-lg border overflow-hidden">
        <Map zones={zones} damageReports={damageReports} demoMode={demoMode} />
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