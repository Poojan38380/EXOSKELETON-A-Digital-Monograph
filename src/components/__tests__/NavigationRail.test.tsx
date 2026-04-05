import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils'
import { NavigationRail } from '../NavigationRail'

// Mock the image URLs module
vi.mock('../../content/image-urls', () => ({
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
}))

describe('NavigationRail', () => {
  const mockOnPageSelect = vi.fn()

  beforeEach(() => {
    mockOnPageSelect.mockClear()
  })

  describe('rendering', () => {
    it('should render all navigation items', () => {
      renderWithProviders(
        <NavigationRail currentPage={0} onPageSelect={mockOnPageSelect} />
      )

      // Should have 11 pages (Cover through Colophon)
      const navItems = document.querySelectorAll('.nav-rail__item')
      expect(navItems.length).toBe(11)
    })

    it('should render page numbers and labels', () => {
      renderWithProviders(
        <NavigationRail currentPage={0} onPageSelect={mockOnPageSelect} />
      )

      expect(screen.getByText('●')).toBeInTheDocument() // Active page indicator
      expect(screen.getByText('Wings')).toBeInTheDocument()
      expect(screen.getByText('Vision')).toBeInTheDocument()
    })

    it('should render thumbnails for pages with images', () => {
      renderWithProviders(
        <NavigationRail currentPage={0} onPageSelect={mockOnPageSelect} />
      )

      const thumbnails = document.querySelectorAll('.nav-rail__thumb')
      // All pages except Colophon (index 10) should have thumbnails
      expect(thumbnails.length).toBeGreaterThan(0)
    })
  })

  describe('active state', () => {
    it('should highlight the current page', () => {
      renderWithProviders(
        <NavigationRail currentPage={2} onPageSelect={mockOnPageSelect} />
      )

      const navItems = document.querySelectorAll('.nav-rail__item')
      const activeItem = navItems[2]
      expect(activeItem).toHaveClass('nav-rail__item--active')
    })

    it('should show ● indicator for current page', () => {
      renderWithProviders(
        <NavigationRail currentPage={5} onPageSelect={mockOnPageSelect} />
      )

      // The active page should have ● instead of its number
      const navItems = document.querySelectorAll('.nav-rail__item')
      const activeNumber = navItems[5]?.querySelector('.nav-rail__number')
      expect(activeNumber).toHaveTextContent('●')
    })
  })

  describe('user interaction', () => {
    it('should call onPageSelect when a page is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <NavigationRail currentPage={0} onPageSelect={mockOnPageSelect} />
      )

      // Click on the second page (Wings)
      const wingsButton = screen.getByLabelText(/Go to page 2: Wings/i)
      await user.click(wingsButton)

      expect(mockOnPageSelect).toHaveBeenCalledWith(1)
    })

    it('should call onPageSelect with correct page index', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <NavigationRail currentPage={0} onPageSelect={mockOnPageSelect} />
      )

      // Click on the last page (Colophon)
      const colophonButton = screen.getByLabelText(/Go to page 11: Colophon/i)
      await user.click(colophonButton)

      expect(mockOnPageSelect).toHaveBeenCalledWith(10)
    })
  })

  describe('accessibility', () => {
    it('should have aria-label for each navigation button', () => {
      renderWithProviders(
        <NavigationRail currentPage={0} onPageSelect={mockOnPageSelect} />
      )

      const buttons = document.querySelectorAll('.nav-rail__item')
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label')
      })
    })

    it('should have descriptive labels for each page', () => {
      renderWithProviders(
        <NavigationRail currentPage={0} onPageSelect={mockOnPageSelect} />
      )

      expect(screen.getByLabelText(/Go to page 1: Cover/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Go to page 3: Vision/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Go to page 11: Colophon/i)).toBeInTheDocument()
    })
  })
})
