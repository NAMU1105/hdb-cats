import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Stable user reference to prevent useEffect dependency loops
vi.mock('../../contexts/AuthContext', () => {
  const user = { credential: 'fake-token', name: 'Cat Fan', email: 'cat@hdb.sg' }
  return { useAuth: () => ({ user }) }
})

const { mockUpdateCat, mockDeleteCat, mockToggleLike, mockGetUploadUrl, mockAddCatPhoto, mockUploadToS3 } =
  vi.hoisted(() => ({
    mockUpdateCat: vi.fn(),
    mockDeleteCat: vi.fn(),
    mockToggleLike: vi.fn(),
    mockGetUploadUrl: vi.fn(),
    mockAddCatPhoto: vi.fn(),
    mockUploadToS3: vi.fn(),
  }))

vi.mock('../../api/client', () => ({
  updateCat: mockUpdateCat,
  deleteCat: mockDeleteCat,
  toggleLike: mockToggleLike,
  getUploadUrl: mockGetUploadUrl,
  addCatPhoto: mockAddCatPhoto,
  uploadToS3: mockUploadToS3,
}))

// Stub PhotoLightbox — full lightbox is tested separately
vi.mock('../../components/Sidebar/PhotoLightbox', () => ({
  PhotoLightbox: () => <div data-testid="lightbox" />,
}))

import { CatDetailSidebar } from '../../components/Sidebar/CatDetailSidebar'
import type { Cat } from '../../types'

const MOCK_CAT: Cat = {
  id: 'cat-1',
  title: 'Orange Tom',
  description: 'A chonky orange boy',
  hdbBlock: '123A',
  town: 'Bedok',
  latitude: 1.3521,
  longitude: 103.8198,
  imageKey: 'uploads/cat-1/original.jpg',
  cdnUrl: 'https://cdn/original.jpg',
  thumbUrl: 'https://cdn/thumb.jpg',
  uploadedAt: '2026-04-12T00:00:00Z',
  status: 'active',
  likeCount: 3,
  likedByMe: false,
  photos: [
    {
      s3Key: 'uploads/cat-1/original.jpg',
      thumbKey: 'uploads/cat-1/thumb.jpg',
      cdnUrl: 'https://cdn/original.jpg',
      thumbUrl: 'https://cdn/thumb.jpg',
      uploadedAt: '2026-04-12T00:00:00Z',
      userId: 'user-1',
    },
  ],
}

function renderSidebar(overrides: { cat?: Cat | null; loading?: boolean } = {}) {
  const onClose = vi.fn()
  const onDeleted = vi.fn()
  const onUpdated = vi.fn()
  render(
    <CatDetailSidebar
      cat={overrides.cat ?? MOCK_CAT}
      loading={overrides.loading ?? false}
      onClose={onClose}
      onDeleted={onDeleted}
      onUpdated={onUpdated}
    />,
  )
  return { onClose, onDeleted, onUpdated }
}

describe('CatDetailSidebar — view mode', () => {
  beforeEach(() => {
    mockUpdateCat.mockReset()
    mockDeleteCat.mockReset()
    mockToggleLike.mockReset()
  })

  it('renders nothing meaningful when cat is null and not loading', () => {
    renderSidebar({ cat: null })
    expect(screen.queryByText('Orange Tom')).not.toBeInTheDocument()
  })

  it('shows loading spinner while loading', () => {
    renderSidebar({ cat: null, loading: true })
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows cat title with emoji in header', () => {
    renderSidebar()
    expect(screen.getByText('🐱 Orange Tom')).toBeInTheDocument()
  })

  it('shows description', () => {
    renderSidebar()
    expect(screen.getByText('A chonky orange boy')).toBeInTheDocument()
  })

  it('shows HDB block and town', () => {
    renderSidebar()
    expect(screen.getByText(/Blk 123A, Bedok/i)).toBeInTheDocument()
  })

  it('shows like count', () => {
    renderSidebar()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows cat photo', () => {
    renderSidebar()
    expect(screen.getByRole('img', { name: 'Orange Tom' })).toBeInTheDocument()
  })

  it('calls onClose when X button is clicked', async () => {
    const { onClose } = renderSidebar()
    await userEvent.click(screen.getByLabelText(/close/i))
    expect(onClose).toHaveBeenCalled()
  })

  it('opens lightbox when photo is clicked', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('img', { name: 'Orange Tom' }))
    expect(screen.getByTestId('lightbox')).toBeInTheDocument()
  })

  it('calls toggleLike when like button is clicked', async () => {
    mockToggleLike.mockResolvedValue({ likeCount: 4, likedByMe: true })
    renderSidebar()
    await userEvent.click(screen.getByTitle(/like/i))
    expect(mockToggleLike).toHaveBeenCalledWith('cat-1', 'fake-token')
  })
})

describe('CatDetailSidebar — edit mode', () => {
  beforeEach(() => mockUpdateCat.mockReset())

  it('switches to edit mode when Edit button is clicked', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    expect(screen.getByText('Edit Details')).toBeInTheDocument()
    // In edit mode there should be text inputs for title, description, etc.
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThanOrEqual(1)
  })

  it('shows header as "Edit Details" in edit mode', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    expect(screen.getByText('Edit Details')).toBeInTheDocument()
  })

  it('calls updateCat and switches back to view on save', async () => {
    mockUpdateCat.mockResolvedValue({ ...MOCK_CAT, title: 'New Name' })
    const { onUpdated } = renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    // First textbox is the title input
    const titleInput = screen.getAllByRole('textbox')[0]
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'New Name')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(onUpdated).toHaveBeenCalled())
  })

  it('returns to view mode on Cancel', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    // "Cancel" button in the footer (not the "Cancel edit" X button in header)
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(screen.getByText('🐱 Orange Tom')).toBeInTheDocument()
  })
})

describe('CatDetailSidebar — delete mode', () => {
  beforeEach(() => mockDeleteCat.mockReset())

  it('shows confirm-delete prompt when Delete is clicked', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText(/delete this cat/i)).toBeInTheDocument()
  })

  it('calls deleteCat and onDeleted on confirm', async () => {
    mockDeleteCat.mockResolvedValue(undefined)
    const { onDeleted } = renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm delete/i }))
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('cat-1'))
  })

  it('returns to view mode on Cancel from delete confirm', async () => {
    renderSidebar()
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText('🐱 Orange Tom')).toBeInTheDocument()
  })
})
