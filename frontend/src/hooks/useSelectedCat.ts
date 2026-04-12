import { useCallback, useEffect, useState } from 'react'
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
        history.replaceState(null, '', `?cat=${id}`)
      } finally {
        setLoadingCat(false)
      }
    },
    [user?.credential],
  )

  const clearSelectedCat = useCallback(() => {
    setSelectedCat(null)
    history.replaceState(null, '', window.location.pathname)
  }, [])

  const updateSelectedCat = useCallback((cat: Cat) => {
    setSelectedCat(cat)
  }, [])

  // On mount: open cat from URL if present
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('cat')
    if (id) void selectCat(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { selectedCat, loadingCat, selectCat, clearSelectedCat, updateSelectedCat }
}
