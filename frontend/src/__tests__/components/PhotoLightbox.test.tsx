import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/react'
import { PhotoLightbox } from '../../components/Sidebar/PhotoLightbox'
import type { Photo } from '../../types'

const makePhoto = (n: number): Photo => ({
  s3Key: `uploads/cat-1/photo-${n}.jpg`,
  thumbKey: `uploads/cat-1/thumb-${n}.jpg`,
  cdnUrl: `https://cdn/photo-${n}.jpg`,
  thumbUrl: `https://cdn/thumb-${n}.jpg`,
  uploadedAt: '2026-04-12T00:00:00Z',
  userId: 'user-1',
})

const PHOTOS = [makePhoto(1), makePhoto(2), makePhoto(3)]

function renderLightbox(overrides: { index?: number; photos?: Photo[] } = {}) {
  const onClose = vi.fn()
  const onNavigate = vi.fn()
  render(
    <PhotoLightbox
      photos={overrides.photos ?? PHOTOS}
      index={overrides.index ?? 0}
      catTitle="Orange Tom"
      onClose={onClose}
      onNavigate={onNavigate}
    />,
  )
  return { onClose, onNavigate }
}

describe('PhotoLightbox', () => {
  it('renders the current photo', () => {
    renderLightbox()
    const img = screen.getByRole('img', { name: 'Orange Tom' })
    expect(img).toHaveAttribute('src', 'https://cdn/photo-1.jpg')
  })

  it('shows photo counter when there are multiple photos', () => {
    renderLightbox({ index: 1 })
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('does not show counter for a single photo', () => {
    renderLightbox({ photos: [PHOTOS[0]], index: 0 })
    expect(screen.queryByText(/\/ 1/)).not.toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const { onClose } = renderLightbox()
    // The outer div is the backdrop
    const backdrop = document.querySelector('.fixed.inset-0')!
    await userEvent.click(backdrop as HTMLElement)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', async () => {
    const { onClose } = renderLightbox()
    await userEvent.click(screen.getByLabelText(/close/i))
    expect(onClose).toHaveBeenCalled()
  })

  it('hides Prev button on first photo', () => {
    renderLightbox({ index: 0 })
    expect(screen.queryByLabelText(/previous/i)).not.toBeInTheDocument()
  })

  it('hides Next button on last photo', () => {
    renderLightbox({ index: 2 })
    expect(screen.queryByLabelText(/next/i)).not.toBeInTheDocument()
  })

  it('shows both Prev and Next for a middle photo', () => {
    renderLightbox({ index: 1 })
    expect(screen.getByLabelText(/previous/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/next/i)).toBeInTheDocument()
  })

  it('calls onNavigate with previous index when Prev is clicked', async () => {
    const { onNavigate } = renderLightbox({ index: 2 })
    await userEvent.click(screen.getByLabelText(/previous/i))
    expect(onNavigate).toHaveBeenCalledWith(1)
  })

  it('calls onNavigate with next index when Next is clicked', async () => {
    const { onNavigate } = renderLightbox({ index: 0 })
    await userEvent.click(screen.getByLabelText(/next/i))
    expect(onNavigate).toHaveBeenCalledWith(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const { onClose } = renderLightbox()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onNavigate left on ArrowLeft key', () => {
    const { onNavigate } = renderLightbox({ index: 1 })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onNavigate).toHaveBeenCalledWith(0)
  })

  it('calls onNavigate right on ArrowRight key', () => {
    const { onNavigate } = renderLightbox({ index: 1 })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('does not navigate past first photo on ArrowLeft', () => {
    const { onNavigate } = renderLightbox({ index: 0 })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('does not navigate past last photo on ArrowRight', () => {
    const { onNavigate } = renderLightbox({ index: 2 })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('shows upload date at bottom', () => {
    renderLightbox()
    // The date is formatted as locale string — just check it's rendered
    const dateEl = document.querySelector('.absolute.bottom-4')
    expect(dateEl).toBeInTheDocument()
  })
})
