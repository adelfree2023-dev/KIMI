/**
 * Product Detail Page
 * 
 * Dynamic route for individual product pages.
 * 
 * @route /products/[slug]
 */

import { notFound } from 'next/navigation';
import { ProductGallery } from '@/components/product/ProductGallery';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { formatPrice } from '@/lib/formatters';

// This would be replaced with actual API call
async function getProduct(slug: string) {
    // TODO: Replace with actual API call
    // const response = await endpoints.products.getBySlug(slug);
    // return response.data;
    return null;
}

export default async function ProductPage({
    params,
}: {
    params: { slug: string };
}) {
    const product = await getProduct(params.slug);

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Product Gallery */}
                <div>
                    <ProductGallery images={product.images} />
                </div>

                {/* Right: Product Info */}
                <div>
                    {/* Breadcrumb */}
                    <nav className="text-sm text-gray-600 mb-4">
                        Home / {product.categoryName} / {product.name}
                    </nav>

                    {/* Product Name */}
                    <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

                    {/* Brand */}
                    {product.brand && (
                        <p className="text-gray-600 mb-4">by {product.brand}</p>
                    )}

                    {/* Rating */}
                    {product.reviewCount > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex text-yellow-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i}>{i < Math.round(product.averageRating) ? '★' : '☆'}</span>
                                ))}
                            </div>
                            <span className="text-sm text-gray-600">
                                ({product.reviewCount} reviews)
                            </span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold">
                                {formatPrice(product.price, product.currency)}
                            </span>
                            {product.compareAtPrice && (
                                <span className="text-xl text-gray-500 line-through">
                                    {formatPrice(product.compareAtPrice, product.currency)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stock Status */}
                    <div className="mb-6">
                        {product.inStock ? (
                            <span className="text-green-600 font-medium">In Stock</span>
                        ) : (
                            <span className="text-red-600 font-medium">Out of Stock</span>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h2 className="font-semibold mb-2">Description</h2>
                        <p className="text-gray-700">{product.description}</p>
                    </div>

                    {/* TODO: Variants Selector */}

                    {/* Add to Cart */}
                    <AddToCartButton product={product} />

                    {/* TODO: Wishlist Button */}
                </div>
            </div>

            {/* TODO: Related Products */}
            {/* TODO: Reviews Section */}
        </div>
    );
}
