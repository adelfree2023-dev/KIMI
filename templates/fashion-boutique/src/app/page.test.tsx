/**
 * Homepage Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
    it('renders homepage', () => {
        render(<HomePage />);

        expect(screen.getByText(/fashion boutique/i)).toBeInTheDocument();
    });

    it('shows hero section', () => {
        render(<HomePage />);

        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
    });

    it('displays shop now button', () => {
        render(<HomePage />);

        const shopButton = screen.getByText(/shop now/i);
        expect(shopButton).toBeInTheDocument();
    });

    it('shows featured products section', () => {
        render(<HomePage />);

        expect(screen.getByText(/featured products/i)).toBeInTheDocument();
    });
});
