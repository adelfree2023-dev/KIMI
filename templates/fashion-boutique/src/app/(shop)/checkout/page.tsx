/**
 * Checkout Page
 * 
 * One-page checkout with shipping, payment, and order summary.
 * 
 * @route /checkout
 */

'use client';

import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { formatPrice } from '@/lib/formatters';

export default function CheckoutPage() {
    // TODO: Get cart from state
    const cart = {
        items: [],
        subtotal: 0,
        total: 0,
        currency: 'USD',
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Checkout Form */}
                <div className="lg:col-span-2">
                    <CheckoutForm />
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                        {/* Cart Items Preview */}
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                            {cart.items.length === 0 ? (
                                <p className="text-gray-500 text-sm">No items in cart</p>
                            ) : (
                                cart.items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>
                                            {item.quantity}x {item.product.name}
                                        </span>
                                        <span className="font-medium">
                                            {formatPrice(item.product.price * item.quantity, cart.currency)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-gray-300 pt-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatPrice(cart.subtotal, cart.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="text-sm text-gray-500">To be calculated</span>
                            </div>
                            <div className="border-t border-gray-300 pt-2 mt-2">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>{formatPrice(cart.total, cart.currency)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
