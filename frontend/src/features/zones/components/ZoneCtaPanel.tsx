import { useState } from 'react'
import type { Zone } from '@/shared/types/zone'

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

  return (
    <div className="mt-2 space-y-1.5 border-t border-gray-200 pt-2 dark:border-gray-700">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">How to help</p>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action) => (
          <button
            key={action}
            onClick={() => setShowContact(true)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              action === 'volunteer'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-800'
            }`}
          >
            {ctaLabels[action]}
          </button>
        ))}
      </div>
      {showContact && zone.organizerContact && (
        <p className="text-xs text-gray-600 dark:text-gray-400">Contact: {zone.organizerContact}</p>
      )}
    </div>
  )
}
