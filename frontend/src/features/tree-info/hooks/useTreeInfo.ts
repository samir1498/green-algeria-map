import { useQuery } from '@tanstack/react-query'
import { getTreeSpeciesDetail, getGbifObservations } from '@/features/tree-info/api/tree-info'
import type { TreeSpeciesDetail } from '@/features/tree-info/api/tree-info'

export interface TreeInfoResult extends TreeSpeciesDetail {
  gbifCount: number | null
}

export function useTreeInfo(taxonId: number | null, scientificName: string | null) {
  return useQuery<TreeInfoResult>({
    queryKey: ['tree-info', taxonId, scientificName],
    queryFn: async () => {
      const detail = await getTreeSpeciesDetail(taxonId!)
      let gbifCount: number | null = null
      if (scientificName) {
        gbifCount = await getGbifObservations(scientificName)
      }
      return { ...detail, gbifCount }
    },
    enabled: taxonId !== null && taxonId > 0,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  })
}
