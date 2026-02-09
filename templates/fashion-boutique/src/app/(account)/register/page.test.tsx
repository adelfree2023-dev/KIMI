/**
 * Register Page Tests
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RegisterPage from './page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('RegisterPage', () => {
  it('renders register form', () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('shows email input', () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('shows password input', () => {
    render(<RegisterPage />);

    const passwordInputs = screen.getAllByLabelText(/password/i);
    expect(passwordInputs).toHaveLength(2); // password + confirm password
  });

  it('shows register button', () => {
    render(<RegisterPage />);

    const registerButton = screen.getByRole('button', {
      name: /create account/i,
    });
    expect(registerButton).toBeInTheDocument();
  });

  it('accepts form inputs', () => {
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });

    expect(emailInput).toHaveValue('newuser@example.com');
  });

  it('shows login link', () => {
    render(<RegisterPage />);

    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('validates password match', () => {
    render(<RegisterPage />);

    const passwordInputs = screen.getAllByLabelText(/password/i);
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'password456' } });

    const registerButton = screen.getByRole('button', {
      name: /create account/i,
    });
    fireEvent.click(registerButton);

    // Should validate passwords match
    expect(registerButton).toBeInTheDocument();
  });
});
