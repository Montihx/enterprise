import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AnimeCard } from '@/components/AnimeCard'

const mockAnime = {
  id: '123',
  slug: 'test-anime',
  title: 'Test Anime Title',
  poster_url: 'https://shikimori.one/system/animes/original/1.jpg',
  score: 8.5,
  year: 2024,
  kind: 'tv',
  episodes_total: 12,
  genres: ['Action', 'Fantasy']
}

describe('AnimeCard Component', () => {
  it('renders anime title and primary metadata', () => {
    render(<AnimeCard anime={mockAnime} />)
    
    expect(screen.getByText('Test Anime Title')).toBeInTheDocument()
    expect(screen.getByText('8.5')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('12 Episodes')).toBeInTheDocument()
  })

  it('contains valid link to watch page', () => {
    render(<AnimeCard anime={mockAnime} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/anime/test-anime')
  })
})
