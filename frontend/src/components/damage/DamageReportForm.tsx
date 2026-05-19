import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { create } from '@/api/damage-reports'
import { damageTypeLabels, severityLabels } from '@/components/map/helpers'
import type { DamageReport } from '@/types/damage-report'

interface DamageReportFormProps {
  zoneId: string
  lat: number
  lng: number
  onSuccess?: () => void
}

export function DamageReportForm({ zoneId, lat, lng, onSuccess }: DamageReportFormProps) {
  const [type, setType] = useState<DamageReport['type']>('fire')
  const [severity, setSeverity] = useState<DamageReport['severity']>('medium')
  const [description, setDescription] = useState('')
  const [reportedBy, setReportedBy] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim() || !reportedBy.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      await create({
        zoneId,
        type,
        severity,
        status: 'reported',
        lat,
        lng,
        description: description.trim(),
        reportedBy: reportedBy.trim(),
      })

      toast.success('Damage report submitted')
      setDescription('')
      setReportedBy('')
      onSuccess?.()
    } catch {
      toast.error('Failed to submit damage report')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-red-600 dark:text-red-400">Report Damage</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="damage-report-form">
          <div className="space-y-2">
            <Label htmlFor="damage-type">Damage Type</Label>
            <select
              id="damage-type"
              data-testid="damage-type-select"
              value={type}
              onChange={(e) => setType(e.target.value as DamageReport['type'])}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(damageTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <select
              id="severity"
              data-testid="severity-select"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as DamageReport['severity'])}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(severityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              data-testid="description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the damage..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reported-by">Reported By</Label>
            <Input
              id="reported-by"
              data-testid="reported-by-input"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="Your volunteer ID or name"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700"
            data-testid="submit-report-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}