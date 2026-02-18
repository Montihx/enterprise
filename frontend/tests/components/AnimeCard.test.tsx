
import { render, screen } from '@testing-library/react';
import { AnimeCard } from '@/components/AnimeCard';
import { Anime } from '@/lib/services/anime';

// Mock Next/Image as it's not supported in jsdom
vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} />,
}));

// Mock Link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

describe('AnimeCard', () => {
    const mockAnime: Anime = {
        id: '1',
        slug: 'cowboy-bebop',
        title: 'Cowboy Bebop',
        poster_url: '/bebop.jpg',
        score: 9.8,
        year: 1998,
        kind: 'tv',
        status: 'finished',
    };

    it('renders anime title', () => {
        render(<AnimeCard anime={mockAnime} />);
        expect(screen.getByText('Cowboy Bebop')).toBeInTheDocument();
    });

    it('renders anime score', () => {
        render(<AnimeCard anime={mockAnime} />);
        expect(screen.getByText('9.8')).toBeInTheDocument();
    });

    it('links to correct anime page', () => {
        render(<AnimeCard anime={mockAnime} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/anime/cowboy-bebop');
    });
});
