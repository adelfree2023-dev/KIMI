/**
 * Header Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

describe('Header', () => {
    it('renders logo and navigation', () => {
        render(<Header />);

        expect(screen.getByText('Fashion Boutique')).toBeInTheDocument();
    });

    it('displays navigation links', () => {
        render(<Header />);

        expect(screen.getByText('Products')).toBeInTheDocument();
        expect(screen.getByText('Categories')).toBeInTheDocument();
    });

    it('shows cart icon', () => {
        render(<Header />);

        const cartButton = screen.getByRole('button', { name: /cart/i });
        expect(cartButton).toBeInTheDocument();
    });

    it('shows search input', () => {
        render(<Header />);

        const searchInput = screen.getByPlaceholderText(/search/i);
        expect(searchInput).toBeInTheDocument();
    });
});
