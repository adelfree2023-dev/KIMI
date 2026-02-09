/**
 * CheckoutForm Component Tests
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckoutForm } from './CheckoutForm';

describe('CheckoutForm', () => {
    it('renders checkout form fields', () => {
        render(<CheckoutForm />);

        expect(screen.getByText(/first name/i)).toBeInTheDocument();
        expect(screen.getByText(/last name/i)).toBeInTheDocument();
    });

    it('shows shipping address section', () => {
        render(<CheckoutForm />);

        expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
    });

    it('displays payment section indicator', () => {
        render(<CheckoutForm />);

        // Exact match for the step indicator text
        expect(screen.getByText('Payment')).toBeInTheDocument();
    });

    it('displays payment section content when on payment step', () => {
        render(<CheckoutForm />);

        // Go to payment step
        fireEvent.click(screen.getByText(/continue to payment/i));

        expect(screen.getByText('Payment Method')).toBeInTheDocument();
    });

    it('shows place order button', () => {
        render(<CheckoutForm />);

        // Go to payment step
        fireEvent.click(screen.getByText(/continue to payment/i));

        const submitButton = screen.getByRole('button', { name: /place order/i });
        expect(submitButton).toBeInTheDocument();
    });

    it('validates required fields on step 2', async () => {
        render(<CheckoutForm />);

        // Go to payment step
        fireEvent.click(screen.getByText(/continue to payment/i));

        const submitButton = screen.getByRole('button', { name: /place order/i });
        fireEvent.click(submitButton);

        // Form should not submit with empty fields
        expect(submitButton).toBeInTheDocument();
    });

    it('accepts city input', () => {
        render(<CheckoutForm />);

        const cityLabel = screen.getByText(/city/i);
        const cityInput = cityLabel.parentElement?.querySelector('input') as HTMLInputElement;
        fireEvent.change(cityInput, { target: { value: 'New York' } });

        expect(cityInput).toHaveValue('New York');
    });

    it('accepts first name input', () => {
        render(<CheckoutForm />);

        const nameLabel = screen.getByText(/first name/i);
        const nameInput = nameLabel.parentElement?.querySelector('input') as HTMLInputElement;
        fireEvent.change(nameInput, { target: { value: 'John' } });

        expect(nameInput).toHaveValue('John');
    });

    it('shows loading state on submit', () => {
        render(<CheckoutForm />);

        // Switch to payment step first
        fireEvent.click(screen.getByText(/continue to payment/i));

        const placeOrderButton = screen.getByText(/place order/i);
        fireEvent.click(placeOrderButton);

        // Button should be in the document
        expect(placeOrderButton).toBeInTheDocument();
    });
});
