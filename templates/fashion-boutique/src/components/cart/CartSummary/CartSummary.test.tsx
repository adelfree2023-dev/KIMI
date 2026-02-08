/**
 * CartSummary Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartSummary } from './CartSummary';

const mockCart = {
    items: [],
    subtotal: 100,
    discount: 10,
    shipping: 5,
    tax: 8,
    total: 103,
};

describe('CartSummary', () => {
    it('renders cart totals', () => {
        render(<CartSummary cart={mockCart} />);

        expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
        expect(screen.getByText(/total/i)).toBeInTheDocument();
    });

    it('displays subtotal correctly', () => {
        render(<CartSummary cart={mockCart} />);

        expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('shows discount when present', () => {
        render(<CartSummary cart={mockCart} />);

        expect(screen.getByText(/discount/i)).toBeInTheDocument();
        expect(screen.getByText('-$10.00')).toBeInTheDocument();
    });

    it('displays final total', () => {
        render(<CartSummary cart={mockCart} />);

        expect(screen.getByText('$103.00')).toBeInTheDocument();
    });

    it('shows checkout button', () => {
        render(<CartSummary cart={mockCart} />);

        const checkoutButton = screen.getByRole('button', { name: /checkout/i });
        expect(checkoutButton).toBeInTheDocument();
    });

    it('displays shipping cost', () => {
        render(<CartSummary cart={mockCart} />);

        expect(screen.getByText(/shipping/i)).toBeInTheDocument();
        expect(screen.getByText('$5.00')).toBeInTheDocument();
    });

    it('shows tax amount', () => {
        render(<CartSummary cart={mockCart} />);

        expect(screen.getByText(/tax/i)).toBeInTheDocument();
        expect(screen.getByText('$8.00')).toBeInTheDocument();
    });
});
