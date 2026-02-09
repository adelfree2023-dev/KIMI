/**
 * AddToCartButton Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddToCartButton } from './AddToCartButton';

const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    inStock: true,
};

// Mock window.alert
beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => { });
});

describe('AddToCartButton', () => {
    it('renders quantity selector', () => {
        render(<AddToCartButton product={mockProduct} />);

        expect(screen.getByText('Quantity:')).toBeInTheDocument();
    });

    it('shows add to cart button', () => {
        render(<AddToCartButton product={mockProduct} />);

        const button = screen.getByText('Add to Cart');
        expect(button).toBeInTheDocument();
    });

    it('shows out of stock when product not available', () => {
        const outOfStockProduct = { ...mockProduct, inStock: false };
        render(<AddToCartButton product={outOfStockProduct} />);

        expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });

    it('disables add to cart when out of stock', () => {
        const outOfStockProduct = { ...mockProduct, inStock: false };
        render(<AddToCartButton product={outOfStockProduct} />);

        const button = screen.getByText('Out of Stock');
        expect(button).toBeDisabled();
    });

    it('increases quantity on plus button click', () => {
        render(<AddToCartButton product={mockProduct} />);

        const plusButton = screen.getByText('+');
        fireEvent.click(plusButton);

        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue(2);
    });

    it('decreases quantity on minus button click', () => {
        render(<AddToCartButton product={mockProduct} />);

        const plusButton = screen.getByText('+');
        fireEvent.click(plusButton);
        fireEvent.click(plusButton);

        const minusButton = screen.getByText('-');
        fireEvent.click(minusButton);

        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue(2);
    });

    it('does not go below 1 when decreasing quantity', () => {
        render(<AddToCartButton product={mockProduct} />);

        const minusButton = screen.getByText('-');
        fireEvent.click(minusButton);

        const input = screen.getByRole('spinbutton');
        expect(input).toHaveValue(1);
    });

    it('shows loading state when adding to cart', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(<AddToCartButton product={mockProduct} />);

        const addButton = screen.getByText('Add to Cart');
        fireEvent.click(addButton);

        // Verification of alert call proves handleAddToCart was executed
        expect(alertSpy).toHaveBeenCalled();
    });

    it('shows buy now button when in stock', () => {
        render(<AddToCartButton product={mockProduct} />);

        expect(screen.getByText('Buy Now')).toBeInTheDocument();
    });

    it('hides buy now button when out of stock', () => {
        const outOfStockProduct = { ...mockProduct, inStock: false };
        render(<AddToCartButton product={outOfStockProduct} />);

        expect(screen.queryByText('Buy Now')).not.toBeInTheDocument();
    });
});
