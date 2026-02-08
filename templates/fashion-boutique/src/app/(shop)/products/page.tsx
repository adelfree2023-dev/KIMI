/**
 * Product Listing Page
 * 
 * Lists all products with filters and pagination.
 * 
 * @route /products
 */

import { ProductCard } from '@/components/product/ProductCard';

// TODO: Replace with actual API call
async function getProducts() {
    return {
        products: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
}

export default async function ProductsPage() {
    const { products } = await getProducts();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">All Products</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No products available
                    </div>
                ) : (
                    products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))
                )}
            </div>

            {/* TODO: Add Pagination */}
            {/* TODO: Add Filters */}
        </div>
    );
}
