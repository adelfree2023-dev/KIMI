/**
 * Login Page Tests
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });

  it('shows email input', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('shows password input', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows login button', () => {
    render(<LoginPage />);

    // Exact match for the button text "Login"
    const loginButton = screen.getByRole('button', { name: /^login$/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('accepts email input', () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('accepts password input', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput).toHaveValue('password123');
  });

  it('shows register link', () => {
    render(<LoginPage />);

    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });
});
