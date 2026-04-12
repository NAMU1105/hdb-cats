import { useCallback, useState } from 'react'
import { fetchCat } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import type { Cat } from '../types'

export function useSelectedCat() {
  const { user } = useAuth()
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null)
  const [loadingCat, setLoadingCat] = useState(false)

  const selectCat = useCallback(
    async (id: string) => {
      setLoadingCat(true)
      try {
        const cat = await fetchCat(id, user?.credential)
        setSelectedCat(cat)
      } finally {
        setLoadingCat(false)
      }
    },
    [user?.credential],
  )

  const clearSelectedCat = useCallback(() => {
    setSelectedCat(null)
  }, [])

  const updateSelectedCat = useCallback((cat: Cat) => {
    setSelectedCat(cat)
  }, [])

  return { selectedCat, loadingCat, selectCat, clearSelectedCat, updateSelectedCat }
}
