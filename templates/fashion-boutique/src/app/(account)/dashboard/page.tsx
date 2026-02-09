/**
 * Account Dashboard
 *
 * User account overview.
 *
 * @route /dashboard
 */

import Link from 'next/link';

export default function DashboardPage() {
  // TODO: Get user from auth context
  const user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Info */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Name:</span> {user.firstName}{' '}
              {user.lastName}
            </p>
            <p>
              <span className="font-medium">Email:</span> {user.email}
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="inline-block mt-4 text-primary hover:underline text-sm"
          >
            Edit Profile
          </Link>
        </div>

        {/* Quick Links */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-3">
            <li>
              <Link
                href="/dashboard/orders"
                className="text-primary hover:underline"
              >
                My Orders
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/wishlist"
                className="text-primary hover:underline"
              >
                Wishlist
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/addresses"
                className="text-primary hover:underline"
              >
                Addresses
              </Link>
            </li>
          </ul>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <p className="text-sm text-gray-600">No recent orders</p>
          <Link
            href="/products"
            className="inline-block mt-4 text-primary hover:underline text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
