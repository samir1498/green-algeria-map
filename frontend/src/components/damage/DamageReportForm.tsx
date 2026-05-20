import { useForm } from '@tanstack/react-form'
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
  const form = useForm({
    defaultValues: {
      type: 'fire' as DamageReport['type'],
      severity: 'medium' as DamageReport['severity'],
      description: '',
      reportedBy: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await create({
          zoneId,
          type: value.type,
          severity: value.severity,
          status: 'reported',
          lat,
          lng,
          description: value.description.trim(),
          reportedBy: value.reportedBy.trim(),
        })

        toast.success('Damage report submitted')
        form.reset()
        onSuccess?.()
      } catch {
        toast.error('Failed to submit damage report')
      }
    },
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-red-600 dark:text-red-400">Report Damage</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
          data-testid="damage-report-form"
        >
          <form.Field
            name="type"
            children={({ state: { value }, handleChange, name }) => (
              <div className="space-y-2">
                <Label htmlFor={name}>Damage Type</Label>
                <select
                  id={name}
                  data-testid="damage-type-select"
                  value={value}
                  onChange={(e) => handleChange(e.target.value as DamageReport['type'])}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(damageTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />

          <form.Field
            name="severity"
            children={({ state: { value }, handleChange, name }) => (
              <div className="space-y-2">
                <Label htmlFor={name}>Severity</Label>
                <select
                  id={name}
                  data-testid="severity-select"
                  value={value}
                  onChange={(e) => handleChange(e.target.value as DamageReport['severity'])}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(severityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />

          <form.Field
            name="description"
            validators={{
              onChange: ({ value }) =>
                value ? undefined : 'Description is required',
            }}
            children={({ state: { value }, handleChange, name, state: { meta: { isTouched, errors } } }) => (
              <div className="space-y-2">
                <Label htmlFor={name}>Description</Label>
                <Input
                  id={name}
                  data-testid="description-input"
                  value={value}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="Describe the damage..."
                />
                {isTouched && errors.length ? (
                  <p className="text-sm text-red-500">{errors.join(', ')}</p>
                ) : null}
              </div>
            )}
          />

          <form.Field
            name="reportedBy"
            validators={{
              onChange: ({ value }) =>
                value ? undefined : 'Volunteer ID or name is required',
            }}
            children={({ state: { value }, handleChange, name, state: { meta: { isTouched, errors } } }) => (
              <div className="space-y-2">
                <Label htmlFor={name}>Reported By</Label>
                <Input
                  id={name}
                  data-testid="reported-by-input"
                  value={value}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="Your volunteer ID or name"
                />
                {isTouched && errors.length ? (
                  <p className="text-sm text-red-500">{errors.join(', ')}</p>
                ) : null}
              </div>
            )}
          />

          <form.Subscribe
            selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
            children={({ canSubmit, isSubmitting }) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700"
                data-testid="submit-report-button"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            )}
          />
        </form>
      </CardContent>
    </Card>
  )
}
