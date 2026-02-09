/**
 * Button Component Tests
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with children', () => {
    const { container } = render(<Button>Click me</Button>);
    const button = container.querySelector('button');

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>);

    const button = screen.getByText('Primary');
    expect(button.className).toContain('bg-primary');
  });

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByText('Secondary');
    expect(button.className).toContain('bg-gray-200');
  });

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByText('Outline');
    expect(button.className).toContain('border-2');
  });

  it('applies small size', () => {
    render(<Button size="sm">Small</Button>);

    const button = screen.getByText('Small');
    expect(button.className).toContain('px-3');
  });

  it('applies medium size by default', () => {
    render(<Button>Medium</Button>);

    const button = screen.getByText('Medium');
    expect(button.className).toContain('px-4');
  });

  it('applies large size', () => {
    render(<Button size="lg">Large</Button>);

    const button = screen.getByText('Large');
    expect(button.className).toContain('px-6');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByText('Click me');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByText('Disabled');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows disabled styling when disabled', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
    expect(button.className).toContain('disabled:opacity-50');
  });
});
