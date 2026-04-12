import { useCallback } from 'react'
import type { Cat } from './types'
import { SingaporeMap } from './components/Map/SingaporeMap'
import { CatDetailSidebar } from './components/Sidebar/CatDetailSidebar'
import { UploadModal } from './components/Upload/UploadModal'
import { LoginButton } from './components/Auth/LoginButton'
import { useCats } from './hooks/useCats'
import { useSelectedCat } from './hooks/useSelectedCat'
import { useUpload } from './hooks/useUpload'
import { useAuth } from './contexts/AuthContext'

export default function App() {
  const { user } = useAuth()
  const { cats, loading: catsLoading, addCat, removeCat, updateCatInList } = useCats()
  const { selectedCat, loadingCat, selectCat, clearSelectedCat, updateSelectedCat } = useSelectedCat()

  const handleUploadSuccess = useCallback(
    (cat: Cat) => {
      addCat({
        id: cat.id,
        title: cat.title,
        latitude: cat.latitude,
        longitude: cat.longitude,
        thumbUrl: cat.thumbUrl,
        hdbBlock: cat.hdbBlock,
        town: cat.town,
        uploadedAt: cat.uploadedAt,
      })
    },
    [addCat],
  )

  const upload = useUpload(handleUploadSuccess)

  const handleDeleted = useCallback(
    (id: string) => {
      removeCat(id)
      clearSelectedCat()
    },
    [removeCat, clearSelectedCat],
  )

  const handleUpdated = useCallback(
    (cat: Cat) => {
      updateCatInList(cat)
      updateSelectedCat(cat)
    },
    [updateCatInList, updateSelectedCat],
  )

  const handleLocationFromSearch = useCallback(
    (lat: number, lng: number, block: string, town: string) => {
      upload.setLocation(lat, lng)
      if (block) upload.setField('hdbBlock', block)
      if (town) upload.setField('town', town)
    },
    [upload],
  )

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-red-600 text-white shadow-md z-[1000] relative">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐱</span>
          <div>
            <h1 className="font-bold text-lg leading-none">HDB Cats</h1>
            <p className="text-red-200 text-xs">Singapore's Community Cat Map</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {catsLoading && (
            <div className="text-red-200 text-xs animate-pulse">Loading cats…</div>
          )}
          {!catsLoading && (
            <div className="text-red-200 text-xs">
              {cats.length} {cats.length === 1 ? 'cat' : 'cats'} spotted
            </div>
          )}
          <LoginButton />
          {user && (
            <button
              onClick={upload.openModal}
              className="flex items-center gap-1.5 bg-white text-red-600 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-red-50 transition-colors shadow-sm"
            >
              <span>+</span>
              <span>Spot a Cat</span>
            </button>
          )}
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <SingaporeMap
          cats={cats}
          onCatSelect={selectCat}
          pickingLocation={upload.step === 'picking-location'}
          pickedLocation={upload.location}
          onLocationPick={upload.setLocation}
          onMapClick={user ? upload.openModalAtLocation : undefined}
        />

        {/* Sidebar overlay */}
        <CatDetailSidebar
          cat={selectedCat}
          loading={loadingCat}
          onClose={clearSelectedCat}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
      </div>

      {/* Upload modal */}
      <UploadModal
        step={upload.step}
        file={upload.file}
        previewUrl={upload.previewUrl}
        location={upload.location}
        title={upload.title}
        description={upload.description}
        hdbBlock={upload.hdbBlock}
        town={upload.town}
        error={upload.error}
        progress={upload.progress}
        onClose={upload.closeModal}
        onFile={upload.setFile}
        onLocationPick={upload.setLocation}
        onField={upload.setField}
        onSubmit={upload.submit}
        onBack={upload.goBack}
        onLocationFromSearch={handleLocationFromSearch}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}
