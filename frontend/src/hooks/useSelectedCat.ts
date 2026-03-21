import { useCallback, useState } from 'react'
import { fetchCat } from '../api/client'
import type { Cat } from '../types'

export function useSelectedCat() {
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null)
  const [loadingCat, setLoadingCat] = useState(false)

  const selectCat = useCallback(async (id: string) => {
    setLoadingCat(true)
    try {
      const cat = await fetchCat(id)
      setSelectedCat(cat)
    } finally {
      setLoadingCat(false)
    }
  }, [])

  const clearSelectedCat = useCallback(() => {
    setSelectedCat(null)
  }, [])

  return { selectedCat, loadingCat, selectCat, clearSelectedCat }
}
