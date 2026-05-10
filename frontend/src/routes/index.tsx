import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/')({
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
  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-foreground">Explore Reforestation</h1>
          <Badge variant="outline" className="text-xs">Beta</Badge>
        </div>
        <p className="text-muted-foreground">Track tree planting initiatives and green coverage across Algeria.</p>
      </div>

      <div className="border rounded-lg bg-muted h-[18.75rem] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75v12m6-6v-6.75m-3 3H15m-3 0v-1.5M12 9v8.25m0-8.25h3.75M12 18h3.75M9.75 9h4.5M9.75 9a2.25 2.25 0 1 1 0 4.5h-4.5v3h4.5ZM12 9v6" />
          </svg>
          <p className="mt-4 text-muted-foreground font-medium">Map View</p>
          <p className="mt-1 text-sm text-muted-foreground/60">Interactive map coming soon</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard value="0" label="Active Projects" />
        <StatCard value="0" label="Trees Planted" />
        <StatCard value="0 ha" label="Area Covered" />
      </div>
    </div>
  )
}