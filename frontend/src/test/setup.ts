import '@testing-library/jest-dom'

// Stub browser APIs not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Leaflet references these — silence the errors in unit tests
Object.defineProperty(URL, 'createObjectURL', { writable: true, value: () => 'blob:mock' })
Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: () => {} })
