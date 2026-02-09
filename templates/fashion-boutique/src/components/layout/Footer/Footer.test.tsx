/**
 * Footer Component Tests
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
    it('renders footer content', () => {
        render(<Footer />);

        expect(screen.getByRole('heading', { name: /fashion boutique/i, level: 3 })).toBeInTheDocument();
    });

    it('displays links to legal pages', () => {
        render(<Footer />);

        expect(screen.getByText(/privacy/i)).toBeInTheDocument();
        expect(screen.getByText(/terms/i)).toBeInTheDocument();
        expect(screen.getByText(/refund/i)).toBeInTheDocument();
    });

    it('shows copyright notice', () => {
        render(<Footer />);

        const currentYear = new Date().getFullYear();
        expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    it('displays social media links', () => {
        render(<Footer />);

        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(3);
    });
});
