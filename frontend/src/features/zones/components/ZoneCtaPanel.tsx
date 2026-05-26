import { useState } from 'react'
import type { Zone } from '@/shared/types/zone'
import { useVolunteer } from '@/features/zones/hooks/useVolunteer'

interface ZoneCtaPanelProps {
  zone: Zone
}

type CtaAction = 'volunteer' | 'donate'

const ctaActions: Record<Zone['type'], CtaAction[]> = {
  planting: ['volunteer', 'donate'],
  trash: ['volunteer'],
  cleanup: ['volunteer'],
}

const ctaLabels: Record<CtaAction, string> = {
  volunteer: 'Volunteer',
  donate: 'Donate to this Zone',
}

export function ZoneCtaPanel({ zone }: ZoneCtaPanelProps) {
  const [showContact, setShowContact] = useState(false)
  const actions = ctaActions[zone.type]
  const { volunteer, hasVolunteered, isPending } = useVolunteer(zone.id)

  return (
    <div className="mt-2 space-y-1.5 border-t border-gray-200 pt-2 dark:border-gray-700">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">How to help</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {actions.map((action) => (
          <button
            key={action}
            onClick={() => {
              if (action === 'volunteer') {
                volunteer()
              } else {
                setShowContact(true)
              }
            }}
            data-testid={`cta-${action}`}
            disabled={action === 'volunteer' && (hasVolunteered || isPending)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              action === 'volunteer'
                ? hasVolunteered
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-800'
            }`}
          >
            {hasVolunteered && action === 'volunteer' ? 'Joined' : ctaLabels[action]}
          </button>
        ))}
      </div>
      {zone.volunteerCount > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {zone.volunteerCount} {zone.volunteerCount === 1 ? 'volunteer' : 'volunteers'}
        </p>
      )}
      {showContact && zone.organizerContact && (
        <p className="text-xs text-gray-600 dark:text-gray-400">Contact: {zone.organizerContact}</p>
      )}
    </div>
  )
}
