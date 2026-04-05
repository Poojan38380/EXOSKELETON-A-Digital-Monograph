import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Automatically clean up after each test
afterEach(() => {
  cleanup()
})

// Mock window.__bookNav global used by BookShell
Object.defineProperty(window, '__bookNav', {
  writable: true,
  value: undefined,
})

// Mock scrollTo
window.scrollTo = vi.fn()

// Mock document.querySelector for .book-page
const originalQuerySelector = document.querySelector.bind(document)
document.querySelector = (selectors: string) => {
  if (selectors === '.book-page') {
    return { scrollTop: 0 } as unknown as Element
  }
  return originalQuerySelector(selectors)
}
