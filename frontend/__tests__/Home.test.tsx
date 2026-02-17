import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Home from '@/app/page'
import { QueryProvider } from '@/components/providers/QueryProvider'

// Mock the queries hook
vi.mock('@/hooks/queries', () => ({
  useAnimeList: vi.fn(() => ({
    data: [],
    isLoading: false
  }))
}))

// Mock components that might cause issues in shallow render
vi.mock('@/components/Hero', () => ({
  Hero: () => <div data-testid="hero">Hero Section</div>
}))

vi.mock('@/components/AnimeCard', () => ({
  AnimeCard: () => <div data-testid="anime-card">Anime Card</div>
}))

describe('Home Page', () => {
  it('renders the hero section and sections', () => {
    render(
      <QueryProvider>
        <Home />
      </QueryProvider>
    )
    
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByText('Trending Now')).toBeInTheDocument()
    expect(screen.getByText('Simulcast & Ongoing')).toBeInTheDocument()
  })
})