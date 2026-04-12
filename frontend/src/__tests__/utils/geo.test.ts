import { describe, it, expect } from 'vitest'
import {
  isWithinSingapore,
  SINGAPORE_CENTER,
  SINGAPORE_BOUNDS,
  SINGAPORE_ZOOM,
  SINGAPORE_MIN_ZOOM,
  SINGAPORE_MAX_ZOOM,
  HDB_TOWNS,
} from '../../utils/geo'

describe('isWithinSingapore', () => {
  it('returns true for Singapore city centre', () => {
    expect(isWithinSingapore(1.3521, 103.8198)).toBe(true)
  })

  it('returns true for coordinates on the boundary', () => {
    expect(isWithinSingapore(1.1, 103.5)).toBe(true)
    expect(isWithinSingapore(1.5, 104.1)).toBe(true)
  })

  it('returns false for Tokyo', () => {
    expect(isWithinSingapore(35.6895, 139.6917)).toBe(false)
  })

  it('returns false for latitude too far south', () => {
    expect(isWithinSingapore(1.09, 103.8)).toBe(false)
  })

  it('returns false for latitude too far north', () => {
    expect(isWithinSingapore(1.51, 103.8)).toBe(false)
  })

  it('returns false for longitude too far west', () => {
    expect(isWithinSingapore(1.35, 103.49)).toBe(false)
  })

  it('returns false for longitude too far east', () => {
    expect(isWithinSingapore(1.35, 104.11)).toBe(false)
  })
})

describe('geo constants', () => {
  it('SINGAPORE_CENTER is roughly at city centre', () => {
    const [lat, lng] = SINGAPORE_CENTER
    expect(lat).toBeCloseTo(1.35, 1)
    expect(lng).toBeCloseTo(103.82, 1)
  })

  it('SINGAPORE_BOUNDS forms a valid bounding box', () => {
    const [[swLat, swLng], [neLat, neLng]] = SINGAPORE_BOUNDS
    expect(swLat).toBeLessThan(neLat)
    expect(swLng).toBeLessThan(neLng)
  })

  it('zoom levels are ordered min < default < max', () => {
    expect(SINGAPORE_MIN_ZOOM).toBeLessThan(SINGAPORE_ZOOM)
    expect(SINGAPORE_ZOOM).toBeLessThan(SINGAPORE_MAX_ZOOM)
  })

  it('HDB_TOWNS is a non-empty list of strings', () => {
    expect(HDB_TOWNS.length).toBeGreaterThan(0)
    expect(typeof HDB_TOWNS[0]).toBe('string')
  })
})
