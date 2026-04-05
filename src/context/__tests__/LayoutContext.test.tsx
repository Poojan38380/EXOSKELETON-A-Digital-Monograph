import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayoutProvider, useLayout } from '../LayoutContext'

// Test consumer component
function TestConsumer() {
  const { navExpanded, setNavExpanded } = useLayout()
  return (
    <div>
      <span data-testid="nav-state">{navExpanded ? 'expanded' : 'collapsed'}</span>
      <button onClick={() => setNavExpanded(true)}>Expand</button>
      <button onClick={() => setNavExpanded(false)}>Collapse</button>
    </div>
  )
}

describe('LayoutContext', () => {
  describe('default state', () => {
    it('should provide default navExpanded as false', () => {
      render(
        <LayoutProvider>
          <TestConsumer />
        </LayoutProvider>
      )

      expect(screen.getByTestId('nav-state')).toHaveTextContent('collapsed')
    })
  })

  describe('state updates', () => {
    it('should update navExpanded when setNavExpanded is called', async () => {
      const user = userEvent.setup()
      render(
        <LayoutProvider>
          <TestConsumer />
        </LayoutProvider>
      )

      const expandButton = screen.getByText('Expand')
      await user.click(expandButton)

      expect(screen.getByTestId('nav-state')).toHaveTextContent('expanded')
    })

    it('should allow toggling back to collapsed', async () => {
      const user = userEvent.setup()
      render(
        <LayoutProvider>
          <TestConsumer />
        </LayoutProvider>
      )

      // Expand
      await user.click(screen.getByText('Expand'))
      expect(screen.getByTestId('nav-state')).toHaveTextContent('expanded')

      // Collapse
      await user.click(screen.getByText('Collapse'))
      expect(screen.getByTestId('nav-state')).toHaveTextContent('collapsed')
    })
  })

  describe('error handling', () => {
    it('should throw error when useLayout is called outside LayoutProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function BrokenConsumer() {
        return <div>{useLayout().navExpanded ? 'yes' : 'no'}</div>
      }

      expect(() => render(<BrokenConsumer />)).toThrow(
        'useLayout must be used within a LayoutProvider'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('multiple consumers', () => {
    it('should share state across multiple consumers', async () => {
      const user = userEvent.setup()

      function Consumer1() {
        const { navExpanded, setNavExpanded } = useLayout()
        return (
          <div>
            <span data-testid="consumer1-state">{navExpanded ? 'expanded' : 'collapsed'}</span>
            <button onClick={() => setNavExpanded(true)}>Expand from C1</button>
          </div>
        )
      }

      function Consumer2() {
        const { navExpanded } = useLayout()
        return <span data-testid="consumer2-state">{navExpanded ? 'expanded' : 'collapsed'}</span>
      }

      render(
        <LayoutProvider>
          <Consumer1 />
          <Consumer2 />
        </LayoutProvider>
      )

      // Both should start collapsed
      expect(screen.getByTestId('consumer1-state')).toHaveTextContent('collapsed')
      expect(screen.getByTestId('consumer2-state')).toHaveTextContent('collapsed')

      // Update from consumer 1
      await user.click(screen.getByText('Expand from C1'))

      // Both should see the update
      expect(screen.getByTestId('consumer1-state')).toHaveTextContent('expanded')
      expect(screen.getByTestId('consumer2-state')).toHaveTextContent('expanded')
    })
  })
})
