/**
 * ProductCard Component Tests
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductCard } from './ProductCard';

// Mock product data
const mockProduct = {
  id: '1',
  slug: 'test-product',
  name: 'Test Product',
  price: 99.99,
  currency: 'USD',
  compareAtPrice: null,
  inStock: true,
  images: [{ url: '/test.jpg', alt: 'Test image', isPrimary: true }],
  tags: [],
  brand: 'Test Brand',
  reviewCount: 10,
  averageRating: 4.5,
};

describe('ProductCard', () => {
  it('renders product name and price', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
  });

  it('displays discount badge when compareAtPrice is present', () => {
    const productWithDiscount = {
      ...mockProduct,
      price: 80,
      compareAtPrice: 100,
    };

    render(<ProductCard product={productWithDiscount} />);

    expect(screen.getByText('-20%')).toBeInTheDocument();
  });

  it('shows out of stock state', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };

    render(<ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} />);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('calls onAddToCart when button is clicked', () => {
    const handleAddToCart = vi.fn();

    render(<ProductCard product={mockProduct} onAddToCart={handleAddToCart} />);

    const button = screen.getByText('Add to Cart');
    button.click();

    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
