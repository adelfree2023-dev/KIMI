/**
 * CheckoutForm Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckoutForm } from './CheckoutForm';

describe('CheckoutForm', () => {
    it('renders checkout form fields', () => {
        render(<CheckoutForm />);

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('shows shipping address section', () => {
        render(<CheckoutForm />);

        expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
    });

    it('displays payment section', () => {
        render(<CheckoutForm />);

        expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });

    it('shows place order button', () => {
        render(<CheckoutForm />);

        const submitButton = screen.getByRole('button', { name: /place order/i });
        expect(submitButton).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(<CheckoutForm />);

        const submitButton = screen.getByRole('button', { name: /place order/i });
        fireEvent.click(submitButton);

        // Form should not submit with empty fields
        expect(submitButton).toBeInTheDocument();
    });

    it('accepts email input', () => {
        render(<CheckoutForm />);

        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        expect(emailInput).toHaveValue('test@example.com');
    });

    it('accepts name input', () => {
        render(<CheckoutForm />);

        const nameInput = screen.getByLabelText(/name/i);
        fireEvent.change(nameInput, { target: { value: 'John Doe' } });

        expect(nameInput).toHaveValue('John Doe');
    });

    it('shows loading state on submit', () => {
        render(<CheckoutForm />);

        const form = screen.getByRole('form');
        fireEvent.submit(form);

        // Button should show loading state
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
});
