import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageDropzone } from '../../components/Upload/ImageDropzone'

function renderDropzone(onFile = vi.fn()) {
  render(<ImageDropzone onFile={onFile} />)
  return { onFile }
}

function makeFile(type = 'image/jpeg', size = 1024, name = 'cat.jpg') {
  return new File(['x'.repeat(size)], name, { type })
}

describe('ImageDropzone', () => {
  it('renders the prompt text', () => {
    renderDropzone()
    expect(screen.getByText(/drop a cat photo here/i)).toBeInTheDocument()
    expect(screen.getByText(/click to browse/i)).toBeInTheDocument()
  })

  it('calls onFile when a valid jpeg is selected via input', async () => {
    const { onFile } = renderDropzone()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = makeFile('image/jpeg')
    await userEvent.upload(input, file)
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('calls onFile when a valid png is selected', async () => {
    const { onFile } = renderDropzone()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = makeFile('image/png', 512, 'cat.png')
    await userEvent.upload(input, file)
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('shows error and does NOT call onFile for unsupported type', () => {
    const { onFile } = renderDropzone()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = makeFile('image/gif', 512, 'cat.gif')
    // Use fireEvent.change to bypass userEvent's accept-attribute filtering
    fireEvent.change(input, { target: { files: [file] } })
    expect(onFile).not.toHaveBeenCalled()
    expect(screen.getByText(/JPG, PNG, WebP, or HEIC/i)).toBeInTheDocument()
  })

  it('shows error and does NOT call onFile when file exceeds 30 MB', async () => {
    const { onFile } = renderDropzone()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    // 31 MB
    const file = makeFile('image/jpeg', 31 * 1024 * 1024)
    await userEvent.upload(input, file)
    expect(onFile).not.toHaveBeenCalled()
    expect(screen.getByText(/under 30 MB/i)).toBeInTheDocument()
  })

  it('calls onFile when a valid file is dropped', () => {
    const { onFile } = renderDropzone()
    // The dropzone is the root div returned by the component
    const dropzone = screen.getByText(/drop a cat photo here/i).closest('div')!
    const file = makeFile('image/jpeg')
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    })
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('sets drag-over style on dragover and removes it on dragleave', () => {
    renderDropzone()
    const dropzone = screen.getByText(/drop a cat photo here/i).closest('div')!
    fireEvent.dragOver(dropzone)
    expect(dropzone.className).toContain('border-red-500')
    fireEvent.dragLeave(dropzone)
    expect(dropzone.className).not.toContain('border-red-500')
  })

  it('accepts .heic files by name even if type is empty', () => {
    const { onFile } = renderDropzone()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    // HEIC files often have an empty/generic MIME type
    const file = new File(['data'], 'cat.heic', { type: '' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(onFile).toHaveBeenCalledWith(file)
  })
})
