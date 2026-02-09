/**
 * Homepage Tests
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
    expect(heading).toHaveTextContent(/fashion boutique/i);
  });

  it('shows coming soon message', () => {
    render(<HomePage />);

    expect(screen.getByText(/homepage - coming soon/i)).toBeInTheDocument();
  });
});
