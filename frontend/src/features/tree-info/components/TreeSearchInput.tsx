import { useState, useEffect, useRef } from 'react'
import { Input } from '@/shared/components/ui/input'
import { useTreeSearch } from '@/features/tree-info/hooks/useTreeSearch'
import { DEBOUNCE_MS } from '@/features/tree-info/hooks/useTreeSearch'

interface TreeSearchInputProps {
  onSelect: (scientificName: string) => void
  placeholder?: string
}

export function TreeSearchInput({
  onSelect,
  placeholder = 'Search tree species...',
}: TreeSearchInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [inputValue])

  const { data: results, isFetching } = useTreeSearch(debouncedValue)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(name: string, commonName: string | null) {
    setInputValue(commonName ?? name)
    setIsOpen(false)
    onSelect(name)
  }

  const showDropdown = isOpen && debouncedValue.trim().length >= 2 && results !== undefined

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        data-testid="tree-search-input"
      />
      {isFetching && debouncedValue.trim().length >= 2 && (
        <div className="absolute top-1/2 right-3 -translate-y-1/2">
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
            data-testid="tree-search-spinner"
          />
        </div>
      )}
      {showDropdown && (
        <div
          className="border-input bg-background absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-lg"
          data-testid="tree-search-dropdown"
        >
          {results.length === 0 ? (
            <p className="text-muted-foreground px-3 py-2 text-sm">No species found</p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.name, r.commonName)}
                className="hover:bg-muted w-full px-3 py-2 text-left text-sm transition-colors"
                data-testid={`tree-search-result-${r.id}`}
              >
                <span className="font-medium">{r.name}</span>
                {r.commonName && (
                  <span className="text-muted-foreground ml-2">({r.commonName})</span>
                )}
                <span className="text-muted-foreground ml-2 text-xs">{r.rank}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
