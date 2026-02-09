/**
 * CartSummary Component Tests
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    // Use exact string to avoid matching "Subtotal"
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('displays subtotal correctly', () => {
    render(<CartSummary cart={mockCart} />);

    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('shows discount when present', () => {
    render(<CartSummary cart={mockCart} />);

    expect(screen.getByText('Discount')).toBeInTheDocument();
    expect(screen.getByText('-$10.00')).toBeInTheDocument();
  });

  it('displays final total', () => {
    render(<CartSummary cart={mockCart} />);

    expect(screen.getByText('$103.00')).toBeInTheDocument();
  });

  it('shows checkout button', () => {
    render(<CartSummary cart={mockCart} />);

    // It's a link, not a button
    const checkoutLink = screen.getByRole('link', {
      name: /proceed to checkout/i,
    });
    expect(checkoutLink).toBeInTheDocument();
  });

  it('displays shipping information', () => {
    render(<CartSummary cart={mockCart} />);

    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText(/calculated at checkout/i)).toBeInTheDocument();
  });
});
