/**
 * Header Component Tests
 * @vitest-environment jsdom
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

        expect(screen.getByText('Shop')).toBeInTheDocument();
        expect(screen.getByText('Men')).toBeInTheDocument();
        expect(screen.getByText('Women')).toBeInTheDocument();
        expect(screen.getByText('Deals')).toBeInTheDocument();
    });

    it('shows cart link', () => {
        render(<Header />);

        const cartLink = screen.getByRole('link', { name: /0/ }); // The cart badge shows "0"
        expect(cartLink).toBeInTheDocument();
        expect(cartLink).toHaveAttribute('href', '/cart');
    });

    it('shows search button', () => {
        const { container } = render(<Header />);

        // The header has multiple buttons. The search button is the first one in the actions area.
        const searchButton = container.querySelector('button svg path[d*="M21 21"]')?.closest('button');
        expect(searchButton).toBeInTheDocument();
    });
});
