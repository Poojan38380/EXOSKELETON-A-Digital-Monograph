import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileNav } from '../MobileNav'

describe('MobileNav', () => {
  const mockOnPrev = vi.fn()
  const mockOnNext = vi.fn()

  beforeEach(() => {
    mockOnPrev.mockClear()
    mockOnNext.mockClear()
  })

  describe('rendering', () => {
    it('should render with correct page info', () => {
      render(
        <MobileNav
          currentPage={0}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      expect(screen.getByText('1 — Cover')).toBeInTheDocument()
    })

    it('should render prev and next buttons', () => {
      render(
        <MobileNav
          currentPage={5}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
      expect(buttons[0]).toHaveAttribute('aria-label', 'Previous page')
      expect(buttons[1]).toHaveAttribute('aria-label', 'Next page')
    })

    it('should display ‹ and › symbols', () => {
      render(
        <MobileNav
          currentPage={3}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      expect(screen.getByText('‹')).toBeInTheDocument()
      expect(screen.getByText('›')).toBeInTheDocument()
    })
  })

  describe('navigation buttons', () => {
    it('should call onPrev when prev button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <MobileNav
          currentPage={5}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      const prevButton = screen.getByLabelText('Previous page')
      await user.click(prevButton)

      expect(mockOnPrev).toHaveBeenCalled()
    })

    it('should call onNext when next button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <MobileNav
          currentPage={5}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      const nextButton = screen.getByLabelText('Next page')
      await user.click(nextButton)

      expect(mockOnNext).toHaveBeenCalled()
    })
  })

  describe('disabled states', () => {
    it('should disable prev button on first page', () => {
      render(
        <MobileNav
          currentPage={0}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      const prevButton = screen.getByLabelText('Previous page')
      expect(prevButton).toBeDisabled()
    })

    it('should disable next button on last page', () => {
      render(
        <MobileNav
          currentPage={10}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      const nextButton = screen.getByLabelText('Next page')
      expect(nextButton).toBeDisabled()
    })

    it('should enable both buttons on middle pages', () => {
      render(
        <MobileNav
          currentPage={5}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      const prevButton = screen.getByLabelText('Previous page')
      const nextButton = screen.getByLabelText('Next page')

      expect(prevButton).not.toBeDisabled()
      expect(nextButton).not.toBeDisabled()
    })

    it('should disable both buttons when there is only one page', () => {
      render(
        <MobileNav
          currentPage={0}
          total={1}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      const prevButton = screen.getByLabelText('Previous page')
      const nextButton = screen.getByLabelText('Next page')

      expect(prevButton).toBeDisabled()
      expect(nextButton).toBeDisabled()
    })
  })

  describe('page display', () => {
    it('should show correct page number and label for different pages', () => {
      const { rerender } = render(
        <MobileNav
          currentPage={2}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      expect(screen.getByText('3 — Vision')).toBeInTheDocument()

      rerender(
        <MobileNav
          currentPage={10}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      expect(screen.getByText('11 — Colophon')).toBeInTheDocument()
    })

    it('should handle invalid currentPage gracefully', () => {
      render(
        <MobileNav
          currentPage={99}
          total={11}
          onPrev={mockOnPrev}
          onNext={mockOnNext}
        />
      )

      // Should not crash, should show empty or fallback
      const pageDisplay = document.querySelector('.mobile-nav__page')
      expect(pageDisplay).toBeInTheDocument()
    })
  })
})
