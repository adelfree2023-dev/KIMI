/**
 * Search Page Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SearchPage from './page';

// Mock useSearchParams
vi.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: (key: string) => key === 'q' ? 'test query' : null,
    }),
}));

describe('SearchPage', () => {
    it('renders search page', () => {
        render(<SearchPage />);

        expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
    });

    it('shows search button', () => {
        render(<SearchPage />);

        const searchButton = screen.getByRole('button', { name: /search/i });
        expect(searchButton).toBeInTheDocument();
    });

    it('displays search results heading when query present', async () => {
        render(<SearchPage />);

        // Wait for Suspense to resolve
        await screen.findByText(/search results for/i);
        expect(screen.getByText(/search results for "test query"/i)).toBeInTheDocument();
    });

    it('shows no results message when empty', async () => {
        render(<SearchPage />);

        await screen.findByText(/no products found/i);
        expect(screen.getByText(/no products found matching "test query"/i)).toBeInTheDocument();
    });
});
