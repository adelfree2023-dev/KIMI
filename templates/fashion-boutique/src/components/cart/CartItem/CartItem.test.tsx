/**
 * CartItem Component Tests
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CartItem } from './CartItem';

// Mock cart item data
const mockCartItem = {
  id: '1',
  product: {
    id: 'p1',
    slug: 'test-product',
    name: 'Test Product',
    price: 99.99,
    currency: 'USD',
    images: [{ url: '/test.jpg', alt: 'Test image' }],
  },
  quantity: 2,
};

describe('CartItem', () => {
  it('renders product name and quantity', () => {
    render(<CartItem item={mockCartItem} />);

    expect(screen.getByText(mockCartItem.product.name)).toBeInTheDocument();
    expect(
      screen.getByText(mockCartItem.quantity.toString())
    ).toBeInTheDocument();
  });

  it('displays variant attributes if present', () => {
    const itemWithVariant = {
      ...mockCartItem,
      variant: {
        id: '1',
        name: 'Large Red',
        attributes: { size: 'L', color: 'Red' },
      },
    };

    render(<CartItem item={itemWithVariant} />);

    expect(screen.getByText(/size: L/i)).toBeInTheDocument();
    expect(screen.getByText(/color: Red/i)).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const handleRemove = vi.fn();

    render(<CartItem item={mockCartItem} onRemove={handleRemove} />);

    const removeButton = screen.getByText('Remove');
    removeButton.click();

    expect(handleRemove).toHaveBeenCalledWith(mockCartItem.id);
  });

  it('calls onUpdateQuantity when quantity is changed', () => {
    const handleUpdate = vi.fn();

    render(<CartItem item={mockCartItem} onUpdateQuantity={handleUpdate} />);

    const increaseButton = screen.getByText('+');
    increaseButton.click();

    expect(handleUpdate).toHaveBeenCalledWith(mockCartItem.id, 3);
  });
});
