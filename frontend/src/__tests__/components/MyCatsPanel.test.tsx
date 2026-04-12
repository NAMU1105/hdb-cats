import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockFetchMyCats } = vi.hoisted(() => ({ mockFetchMyCats: vi.fn() }))
vi.mock('../../api/client', () => ({
  fetchMyCats: mockFetchMyCats,
}))

vi.mock('../../contexts/AuthContext', () => {
  // Stable reference — creating a new object every call would change `user` identity
  // on every render, which would cause the fetchMyCats effect to re-run infinitely.
  const user = { credential: 'fake-token', name: 'Cat Fan', email: 'cat@hdb.sg' }
  return { useAuth: () => ({ user }) }
})

import { MyCatsPanel } from '../../components/MyCats/MyCatsPanel'

const MOCK_CATS = [
  {
    id: 'cat-1', title: 'Orange Tom', latitude: 1.35, longitude: 103.82,
    thumbUrl: 'https://cdn/thumb1.jpg', uploadedAt: '2026-04-12T00:00:00Z',
    town: 'Bedok', hdbBlock: '123A',
  },
  {
    id: 'cat-2', title: 'Tabby Luna', latitude: 1.36, longitude: 103.83,
    thumbUrl: 'https://cdn/thumb2.jpg', uploadedAt: '2026-04-10T00:00:00Z',
    town: 'Tampines',
  },
]

function renderPanel(overrides: { open?: boolean; onClose?: () => void; onSelectCat?: (id: string) => void } = {}) {
  const props = {
    open: true,
    onClose: vi.fn(),
    onSelectCat: vi.fn(),
    ...overrides,
  }
  return { ...render(<MyCatsPanel {...props} />), props }
}

describe('MyCatsPanel', () => {
  beforeEach(() => {
    mockFetchMyCats.mockReset()
    mockFetchMyCats.mockResolvedValue(MOCK_CATS)
  })

  it('does not fetch when panel is closed', () => {
    renderPanel({ open: false })
    expect(mockFetchMyCats).not.toHaveBeenCalled()
  })

  it('fetches cats when panel opens', async () => {
    renderPanel()
    await waitFor(() => expect(mockFetchMyCats).toHaveBeenCalledOnce())
  })

  it('shows loading spinner while fetching', () => {
    // Keep the promise pending so loading stays true
    mockFetchMyCats.mockReturnValue(new Promise(() => {}))
    renderPanel()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders cat list after fetch resolves', async () => {
    renderPanel()
    await waitFor(() => expect(screen.getByText('Orange Tom')).toBeInTheDocument())
    expect(screen.getByText('Tabby Luna')).toBeInTheDocument()
  })

  it('shows empty state message when user has no cats', async () => {
    mockFetchMyCats.mockResolvedValueOnce([])
    renderPanel()
    await waitFor(() => expect(screen.getByText(/no cats spotted yet/i)).toBeInTheDocument())
  })

  it('shows error message when fetch fails', async () => {
    mockFetchMyCats.mockRejectedValueOnce(new Error('Network error'))
    renderPanel()
    await waitFor(() => expect(screen.getByText(/failed to load your cats/i)).toBeInTheDocument())
  })

  it('shows cat count in footer', async () => {
    renderPanel()
    await waitFor(() => expect(screen.getByText(/2 cats spotted/i)).toBeInTheDocument())
  })

  it('calls onSelectCat and onClose when a cat is clicked', async () => {
    const onSelectCat = vi.fn()
    const onClose = vi.fn()
    renderPanel({ onSelectCat, onClose })
    await waitFor(() => screen.getByText('Orange Tom'))
    await userEvent.click(screen.getByText('Orange Tom'))
    expect(onSelectCat).toHaveBeenCalledWith('cat-1')
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when the X button is clicked', async () => {
    const onClose = vi.fn()
    renderPanel({ onClose })
    await waitFor(() => screen.getByText('Orange Tom'))
    await userEvent.click(screen.getByLabelText(/close/i))
    expect(onClose).toHaveBeenCalled()
  })

  it('is hidden when open is false', () => {
    renderPanel({ open: false })
    // Panel should have -translate-x-full class (slide off screen)
    const panel = document.querySelector('.-translate-x-full')
    expect(panel).toBeInTheDocument()
  })
})
