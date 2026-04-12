import { useCallback, useEffect, useState } from 'react'
import { fetchCats } from '../api/client'
import type { Cat, CatListItem } from '../types'

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

  const removeCat = useCallback((id: string) => {
    setCats((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const updateCatInList = useCallback((cat: Cat) => {
    setCats((prev) =>
      prev.map((c) =>
        c.id === cat.id ? { ...c, title: cat.title, hdbBlock: cat.hdbBlock, town: cat.town } : c,
      ),
    )
  }, [])

  return { cats, loading, error, reload: load, addCat, removeCat, updateCatInList }
}
