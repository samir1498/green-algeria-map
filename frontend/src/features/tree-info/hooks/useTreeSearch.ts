import { useQuery } from '@tanstack/react-query'
import { searchTreeSpecies } from '@/features/tree-info/api/tree-info'
import type { TreeSearchResult } from '@/features/tree-info/api/tree-info'

const DEBOUNCE_MS = 300

export function useTreeSearch(query: string) {
  return useQuery<TreeSearchResult[]>({
    queryKey: ['tree-search', query],
    queryFn: () => searchTreeSpecies(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  })
}

export { DEBOUNCE_MS }
