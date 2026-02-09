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
  // const response = await endpoints.products.list();
  // return response.data;
  return [] as any[];
}

export default async function ProductsPage() {
  const products: any[] = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>

      {/* TODO: Add filters, sorting, search */}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <p className="text-gray-600">No products found.</p>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      {/* TODO: Add pagination */}
    </div>
  );
}
