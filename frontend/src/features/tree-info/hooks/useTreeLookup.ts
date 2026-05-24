import { useCallback } from 'react'
import { searchTreeSpecies } from '@/features/tree-info/api/tree-info'

export function useTreeLookup() {
  const lookupSpecies = useCallback(async (scientificName: string) => {
    const results = await searchTreeSpecies(scientificName)
    if (results.length === 0) return null
    return { taxonId: results[0].id, scientificName: results[0].name }
  }, [])

  return { lookupSpecies }
}
