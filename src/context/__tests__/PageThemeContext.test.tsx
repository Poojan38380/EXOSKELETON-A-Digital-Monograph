import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageThemeProvider, usePageTheme, PAGE_THEMES } from '../PageThemeContext'

// Test consumer component
function TestThemeConsumer() {
  const { theme, pageIndex } = usePageTheme()
  return (
    <div>
      <span data-testid="accent">{theme.accentColor}</span>
      <span data-testid="page-class">{theme.pageClass}</span>
      <span data-testid="page-index">{pageIndex}</span>
    </div>
  )
}

describe('PageThemeContext', () => {
  describe('theme selection', () => {
    it('should provide the correct theme for a given pageId', () => {
      render(
        <PageThemeProvider pageIndex={0} pageId="cover">
          <TestThemeConsumer />
        </PageThemeProvider>
      )

      expect(screen.getByTestId('accent')).toHaveTextContent('var(--ochre)')
      expect(screen.getByTestId('page-class')).toHaveTextContent('page--cover')
    })

    it('should provide different themes for different pageIds', () => {
      const { rerender } = render(
        <PageThemeProvider pageIndex={1} pageId="wings">
          <TestThemeConsumer />
        </PageThemeProvider>
      )

      expect(screen.getByTestId('accent')).toHaveTextContent('var(--verdigris)')
      expect(screen.getByTestId('page-class')).toHaveTextContent('page--wings')

      rerender(
        <PageThemeProvider pageIndex={3} pageId="metamorphosis">
          <TestThemeConsumer />
        </PageThemeProvider>
      )

      expect(screen.getByTestId('accent')).toHaveTextContent('var(--carmine)')
      expect(screen.getByTestId('page-class')).toHaveTextContent('page--metamorphosis')
    })

    it('should fallback to cover theme for unknown pageId', () => {
      render(
        <PageThemeProvider pageIndex={0} pageId="unknown-page">
          <TestThemeConsumer />
        </PageThemeProvider>
      )

      expect(screen.getByTestId('accent')).toHaveTextContent('var(--ochre)')
      expect(screen.getByTestId('page-class')).toHaveTextContent('page--cover')
    })
  })

  describe('pageIndex', () => {
    it('should provide the correct pageIndex', () => {
      render(
        <PageThemeProvider pageIndex={5} pageId="numbers">
          <TestThemeConsumer />
        </PageThemeProvider>
      )

      expect(screen.getByTestId('page-index')).toHaveTextContent('5')
    })

    it('should update pageIndex on rerender', () => {
      const { rerender } = render(
        <PageThemeProvider pageIndex={0} pageId="cover">
          <TestThemeConsumer />
        </PageThemeProvider>
      )

      expect(screen.getByTestId('page-index')).toHaveTextContent('0')

      rerender(
        <PageThemeProvider pageIndex={10} pageId="colophon">
          <TestThemeConsumer />
        </PageThemeProvider>
      )

      expect(screen.getByTestId('page-index')).toHaveTextContent('10')
    })
  })

  describe('PAGE_THEMES export', () => {
    it('should have themes for all 11 pages', () => {
      const expectedPages = [
        'cover', 'wings', 'vision', 'metamorphosis', 'antennae',
        'numbers', 'records', 'behavior', 'mimicry', 'humans', 'colophon'
      ]

      for (const page of expectedPages) {
        expect(PAGE_THEMES[page]).toBeDefined()
        expect(PAGE_THEMES[page].accentColor).toBeDefined()
        expect(PAGE_THEMES[page].glowPattern).toBeDefined()
        expect(PAGE_THEMES[page].pageClass).toBeDefined()
      }
    })

    it('should have valid theme structure for each page', () => {
      for (const [_pageId, theme] of Object.entries(PAGE_THEMES)) {
        expect(typeof theme.accentColor).toBe('string')
        expect(typeof theme.glowPattern).toBe('string')
        expect(typeof theme.pageClass).toBe('string')
        expect(theme.accentColor.length).toBeGreaterThan(0)
        expect(theme.pageClass.length).toBeGreaterThan(0)
      }
    })
  })

  describe('error handling', () => {
    it('should throw error when usePageTheme is called outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function BrokenConsumer() {
        return <div>{usePageTheme().theme.accentColor}</div>
      }

      expect(() => render(<BrokenConsumer />)).toThrow(
        'usePageTheme must be used within a PageThemeProvider'
      )

      consoleSpy.mockRestore()
    })
  })
})
