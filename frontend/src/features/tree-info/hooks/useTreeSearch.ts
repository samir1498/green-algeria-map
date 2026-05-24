import { useQuery } from '@tanstack/react-query'
import { searchTreeSpecies } from '@/features/tree-info/api/tree-info'
import type { TreeSearchResult } from '@/features/tree-info/api/tree-info'

const DEBOUNCE_MS = 300

export function useTreeSearch(query: string) {
  const normalizedQuery = query.trim()

  return useQuery<TreeSearchResult[]>({
    queryKey: ['tree-search', normalizedQuery],
    queryFn: () => searchTreeSpecies(normalizedQuery),
    enabled: normalizedQuery.length >= 2,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  })
}

export { DEBOUNCE_MS }
