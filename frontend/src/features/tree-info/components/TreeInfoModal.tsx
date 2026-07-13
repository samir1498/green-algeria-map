import { useTreeInfo } from '@/features/tree-info/hooks/useTreeInfo'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

interface TreeInfoModalProps {
  taxonId: number
  scientificName: string
  onClose: () => void
}

export function TreeInfoModal({ taxonId, scientificName, onClose }: TreeInfoModalProps) {
  const { data, isLoading, isError } = useTreeInfo(taxonId, scientificName)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg" data-testid="tree-info-scientific-name">
              {scientificName}
            </CardTitle>
            {data && data.commonName && (
              <p className="text-muted-foreground text-sm" data-testid="tree-info-common-name">
                {data.commonName}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {data?.photos?.[0] && (
              <img
                src={data.photos[0]}
                alt={scientificName}
                className="mb-3 h-48 w-full rounded-md object-cover"
                data-testid="tree-info-photo"
              />
            )}
            {isLoading && (
              <p className="text-muted-foreground text-sm" data-testid="tree-info-loading">
                Loading species information...
              </p>
            )}
            {isError && (
              <p className="text-sm text-red-500" data-testid="tree-info-error">
                Failed to load species information.
              </p>
            )}
            {data && (
              <div className="space-y-3" data-testid="tree-info-content">
                {data.gbifCount !== null && (
                  <p className="text-sm" data-testid="tree-info-gbif">
                    <span className="font-medium">Observations in Algeria:</span> {data.gbifCount}
                  </p>
                )}
                {data.wikipediaUrl && (
                  <a
                    href={data.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                    data-testid="tree-info-wikipedia"
                  >
                    Read on Wikipedia
                  </a>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="border-input bg-background hover:bg-muted mt-3 w-full rounded-md border px-3 py-2 text-sm transition-colors"
              data-testid="tree-info-close"
            >
              Close
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
