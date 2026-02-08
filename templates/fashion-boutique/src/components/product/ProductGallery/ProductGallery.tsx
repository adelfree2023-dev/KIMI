/**
 * ProductGallery Component
 * 
 * Image gallery with thumbnails for product detail page.
 * 
 * @module components/product/ProductGallery
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@apex/validators';

export interface ProductGalleryProps {
    images: ProductImage[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedImage = images[selectedIndex];

    if (!images || images.length === 0) {
        return (
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <Image
                    src={selectedImage.url}
                    alt={selectedImage.alt || 'Product image'}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${index === selectedIndex
                                    ? 'border-primary'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Image
                                src={image.url}
                                alt={image.alt || `Thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 25vw, 12.5vw"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
