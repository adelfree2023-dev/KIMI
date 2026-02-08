/**
 * ProductGallery Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductGallery } from './ProductGallery';

const mockImages = [
    { url: '/image1.jpg', alt: 'Image 1', isPrimary: true },
    { url: '/image2.jpg', alt: 'Image 2' },
    { url: '/image3.jpg', alt: 'Image 3' },
];

describe('ProductGallery', () => {
    it('renders main image', () => {
        render(<ProductGallery images={mockImages} />);

        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
    });

    it('shows empty state when no images', () => {
        render(<ProductGallery images={[]} />);

        expect(screen.getByText(/no image available/i)).toBeInTheDocument();
    });

    it('displays thumbnails when multiple images', () => {
        render(<ProductGallery images={mockImages} />);

        const thumbnailButtons = screen.getAllByRole('button');
        expect(thumbnailButtons).toHaveLength(3);
    });

    it('switches main image on thumbnail click', () => {
        render(<ProductGallery images={mockImages} />);

        const thumbnails = screen.getAllByRole('button');
        fireEvent.click(thumbnails[1]);

        // Primary image should now be the second one
        const images = screen.getAllByRole('img');
        expect(images[0]).toHaveAttribute('alt', 'Image 2');
    });

    it('highlights selected thumbnail', () => {
        render(<ProductGallery images={mockImages} />);

        const firstThumbnail = screen.getAllByRole('button')[0];
        expect(firstThumbnail.className).toContain('border-primary');
    });

    it('shows only main image when single image', () => {
        const singleImage = [mockImages[0]];
        render(<ProductGallery images={singleImage} />);

        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(0);
    });
});
