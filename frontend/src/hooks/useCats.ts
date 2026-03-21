import { useCallback, useEffect, useState } from 'react'
import { fetchCats } from '../api/client'
import type { CatListItem } from '../types'

export function useCats() {
  const [cats, setCats] = useState<CatListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const items = await fetchCats()
      setCats(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const addCat = useCallback((cat: CatListItem) => {
    setCats((prev) => [cat, ...prev])
  }, [])

  return { cats, loading, error, reload: load, addCat }
}
