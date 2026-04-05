/**
 * Mock data and modules for testing.
 * Centralize all mocks here to keep tests consistent.
 */

import { vi } from 'vitest'

/**
 * Mock PAGES data for testing navigation components
 */
export const mockPages = [
  { id: 'cover', number: 1, label: 'Cover' },
  { id: 'wings', number: 2, label: 'Wings' },
  { id: 'vision', number: 3, label: 'Vision' },
  { id: 'metamorphosis', number: 4, label: 'Metamorphosis' },
  { id: 'antennae', number: 5, label: 'Antennae' },
  { id: 'numbers', number: 6, label: 'By the Numbers' },
  { id: 'records', number: 7, label: 'Records' },
  { id: 'behavior', number: 8, label: 'Strange Behavior' },
  { id: 'mimicry', number: 9, label: 'Mimicry' },
  { id: 'humans', number: 10, label: 'Insects & Humans' },
  { id: 'colophon', number: 11, label: 'Colophon' },
]

/**
 * Mock image URLs for testing
 */
export const mockImageUrls = {
  IMG_JEWEL_BEETLE: '/mock/jewel-beetle.jpg',
  IMG_DRAGONFLY_WING: '/mock/dragonfly-wing.jpg',
  IMG_HORSEFLY_EYE: '/mock/horsefly-eye.jpg',
  IMG_BUTTERFLY_METAMORPHOSIS: '/mock/butterfly-metamorphosis.jpg',
  IMG_SATURNIID_MOTH: '/mock/saturniid-moth.jpg',
  IMG_HOUSEFLY_FOOT: '/mock/housefly-foot.jpg',
  IMG_ANTARCTIC_MIDGE: '/mock/antarctic-midge.jpg',
  IMG_DUNG_BEETLE: '/mock/dung-beetle.jpg',
  IMG_MONARCH_WING: '/mock/monarch-wing.jpg',
  IMG_MOSQUITO_PROBOSCIS: '/mock/mosquito-proboscis.jpg',
}

/**
 * Mock for the entomology-text module
 */
export function mockEntomologyText() {
  vi.mock('../content/entomology-text', () => ({
    PAGES: mockPages,
  }))
}

/**
 * Mock for the image-urls module
 */
export function mockImageUrlsModule() {
  vi.mock('../content/image-urls', () => mockImageUrls)
}

/**
 * Create a mock book nav global for BookShell testing
 */
export function createMockBookNav() {
  return {
    navigateTo: vi.fn(),
    goNext: vi.fn(),
    goPrev: vi.fn(),
    pageIndex: vi.fn(() => 0),
  }
}

/**
 * Mock TouchEvent for testing swipe gestures
 */
export function createTouchEvent(
  type: 'touchstart' | 'touchend',
  x: number,
  y: number,
  changedTouches?: { clientX: number; clientY: number }[],
): TouchEvent {
  return new TouchEvent(type, {
    touches: type === 'touchstart' ? [{ clientX: x, clientY: y } as Touch] : [],
    changedTouches: changedTouches || [{ clientX: x, clientY: y } as Touch],
  } as TouchEventInit)
}

/**
 * Mock KeyboardEvent for testing keyboard navigation
 */
export function createKeyboardEvent(
  key: string,
  options?: KeyboardEventInit,
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  })
}
