import { useCallback, useState } from 'react'
import { createCat, getUploadUrl, uploadToS3 } from '../api/client'
import type { Cat, UploadStep } from '../types'
import { optimizeImages } from '../utils/imageOptimize'
import { useAuth } from '../contexts/AuthContext'

interface UploadState {
  step: UploadStep
  file: File | null
  previewUrl: string | null
  location: [number, number] | null
  title: string
  description: string
  hdbBlock: string
  town: string
  error: string | null
  progress: number
}

const INITIAL_STATE: UploadState = {
  step: 'idle',
  file: null,
  previewUrl: null,
  location: null,
  title: '',
  description: '',
  hdbBlock: '',
  town: '',
  error: null,
  progress: 0,
}

export function useUpload(onSuccess: (cat: Cat) => void) {
  const { user } = useAuth()
  const [state, setState] = useState<UploadState>(INITIAL_STATE)

  const updateState = useCallback((partial: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...partial }))
  }, [])

  const openModal = useCallback(() => {
    updateState({ step: 'picking-image' })
  }, [updateState])

  const closeModal = useCallback(() => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl)
    setState(INITIAL_STATE)
  }, [state.previewUrl])

  const setFile = useCallback(
    (file: File) => {
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl)
      const previewUrl = URL.createObjectURL(file)
      updateState({ file, previewUrl, step: 'picking-location' })
    },
    [state.previewUrl, updateState],
  )

  const setLocation = useCallback(
    (lat: number, lng: number) => {
      updateState({ location: [lat, lng], step: 'filling-details' })
    },
    [updateState],
  )

  const setField = useCallback(
    (field: 'title' | 'description' | 'hdbBlock' | 'town', value: string) => {
      updateState({ [field]: value })
    },
    [updateState],
  )

  const submit = useCallback(async () => {
    const { file, location, title, hdbBlock, town, description } = state
    if (!file || !location || !title.trim()) return
    if (!user) {
      updateState({ step: 'error', error: 'Please sign in to upload' })
      return
    }

    updateState({ step: 'uploading', error: null, progress: 0 })

    try {
      // Step 1: optimize images
      updateState({ progress: 10 })
      const { original, thumb, contentType } = await optimizeImages(file)

      // Step 2: get presigned URLs
      updateState({ progress: 25 })
      const { uploadUrl, thumbUploadUrl, imageKey, thumbKey, catId } = await getUploadUrl(
        { filename: file.name, contentType, fileSizeBytes: original.size },
        user.credential,
      )

      // Step 3: upload original
      updateState({ progress: 40 })
      await uploadToS3(uploadUrl, original, contentType)

      // Step 4: upload thumbnail
      updateState({ progress: 70 })
      await uploadToS3(thumbUploadUrl, thumb, contentType)

      // Step 5: save metadata
      updateState({ progress: 90 })
      const cat = await createCat(
        {
          catId,
          imageKey,
          thumbKey,
          title: title.trim(),
          description: description.trim() || undefined,
          hdbBlock: hdbBlock.trim() || undefined,
          town: town || undefined,
          latitude: location[0],
          longitude: location[1],
        },
        user.credential,
      )

      updateState({ progress: 100, step: 'success' })
      onSuccess(cat)
    } catch (err) {
      updateState({
        step: 'error',
        error: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }, [state, updateState, onSuccess])

  const goBack = useCallback(() => {
    if (state.step === 'picking-location') updateState({ step: 'picking-image' })
    else if (state.step === 'filling-details') updateState({ step: 'picking-location' })
    else if (state.step === 'error') updateState({ step: 'filling-details', error: null })
  }, [state.step, updateState])

  return {
    ...state,
    openModal,
    closeModal,
    setFile,
    setLocation,
    setField,
    submit,
    goBack,
  }
}
