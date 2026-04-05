import { render, type RenderResult, type RenderOptions } from '@testing-library/react'
import { type ReactElement } from 'react'
import { LayoutProvider } from '../context/LayoutContext'
import { PageThemeProvider } from '../context/PageThemeContext'

/**
 * Render options extended to include context provider configuration.
 */
export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial layout context state */
  layoutContext?: {
    navExpanded?: boolean
  }
  /** Page index for theme context */
  pageIndex?: number
  /** Page ID for theme context */
  pageId?: string
}

/**
 * Creates a wrapper component with all application context providers.
 * Use this when you need the full app context for a component.
 */
export function createWrapper(options: RenderWithProvidersOptions = {}) {
  const { pageIndex = 0, pageId = 'cover' } = options

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <LayoutProvider>
        <PageThemeProvider pageIndex={pageIndex} pageId={pageId}>
          {children}
        </PageThemeProvider>
      </LayoutProvider>
    )
  }
}

/**
 * Render a component with all application context providers.
 * This is the default render function for testing components that
 * consume context (LayoutContext, PageThemeContext, etc.).
 *
 * @example
 * ```tsx
 * const result = renderWithProviders(<MyComponent />)
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const wrapper = createWrapper(options)
  return render(ui, { wrapper, ...options })
}

/**
 * Render a component with only the LayoutContext provider.
 * Use this when you want to test layout-specific behavior in isolation.
 *
 * @example
 * ```tsx
 * const result = renderWithLayoutContext(<MyComponent />, { navExpanded: true })
 * ```
 */
export function renderWithLayoutContext(
  ui: ReactElement,
  options: { navExpanded?: boolean } & Omit<RenderOptions, 'wrapper'> = {},
): RenderResult {
  const { navExpanded = false, ...renderOptions } = options

  // We need to create a wrapper that overrides the default LayoutProvider state
  function LayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
      <LayoutProvider>
        {/* 
          Note: LayoutProvider manages its own state internally.
          To test with specific state, we'd need to extend the provider
          to accept initial state. For now, render with defaults.
        */}
        {children}
      </LayoutProvider>
    )
  }

  return render(ui, { wrapper: LayoutWrapper, ...renderOptions })
}

/**
 * Render a component with only the PageThemeProvider.
 * Use this when testing components that depend on page theme.
 *
 * @example
 * ```tsx
 * const result = renderWithPageTheme(<MyComponent />, { pageIndex: 2, pageId: 'vision' })
 * ```
 */
export function renderWithPageTheme(
  ui: ReactElement,
  options: { pageIndex?: number; pageId?: string } & Omit<RenderOptions, 'wrapper'> = {},
): RenderResult {
  const { pageIndex = 0, pageId = 'cover', ...renderOptions } = options

  function ThemeWrapper({ children }: { children: React.ReactNode }) {
    return (
      <PageThemeProvider pageIndex={pageIndex} pageId={pageId}>
        {children}
      </PageThemeProvider>
    )
  }

  return render(ui, { wrapper: ThemeWrapper, ...renderOptions })
}
