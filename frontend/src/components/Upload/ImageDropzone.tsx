import { useCallback, useRef, useState } from 'react'

interface Props {
  onFile: (file: File) => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_BYTES = 30 * 1024 * 1024 // 30 MB raw; optimizeImages will compress it

export function ImageDropzone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const validate = useCallback(
    (file: File): boolean => {
      if (!ACCEPTED.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
        setErr('Please upload a JPG, PNG, WebP, or HEIC image.')
        return false
      }
      if (file.size > MAX_BYTES) {
        setErr('Image must be under 30 MB.')
        return false
      }
      setErr(null)
      return true
    },
    [],
  )

  const handleFile = useCallback(
    (file: File) => {
      if (validate(file)) onFile(file)
    },
    [validate, onFile],
  )

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-colors duration-200
        ${dragOver ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400'}
      `}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <div className="text-5xl mb-3">🐱</div>
      <p className="text-gray-700 font-medium">Drop a cat photo here</p>
      <p className="text-gray-400 text-sm mt-1">or click to browse</p>
      <p className="text-gray-400 text-xs mt-2">JPG, PNG, WebP, HEIC · max 30 MB</p>
      {err && <p className="text-red-500 text-sm mt-3">{err}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
