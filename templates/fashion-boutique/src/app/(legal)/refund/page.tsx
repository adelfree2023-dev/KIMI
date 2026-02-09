/**
 * Refund Policy Page
 */

export default function RefundPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto prose">
        <h1>Refund Policy</h1>

        <p className="text-gray-600">Last updated: February 2026</p>

        <h2>1. Return Window</h2>
        <p>
          You have 30 days from the date of delivery to return an item for a
          full refund.
        </p>

        <h2>2. Eligible Items</h2>
        <p>To be eligible for a return, items must be:</p>
        <ul>
          <li>Unused and in the same condition you received them</li>
          <li>In original packaging</li>
          <li>With proof of purchase</li>
        </ul>

        <h2>3. Non-Returnable Items</h2>
        <p>The following items cannot be returned:</p>
        <ul>
          <li>Gift cards</li>
          <li>Downloadable products</li>
          <li>Personal care items</li>
          <li>Sale items (unless defective)</li>
        </ul>

        <h2>4. Refund Process</h2>
        <p>
          Once we receive your returned item, we will inspect it and notify you
          of the approval or rejection of your refund.
        </p>
        <p>
          If approved, your refund will be processed within 5-10 business days
          to your original payment method.
        </p>

        <h2>5. Shipping Costs</h2>
        <p>
          You will be responsible for paying shipping costs for returning items.
          Shipping costs are non-refundable.
        </p>

        <h2>6. Exchanges</h2>
        <p>
          We only replace items if they are defective or damaged. Contact us at
          support@fashionboutique.com for exchanges.
        </p>

        <h2>7. Contact Us</h2>
        <p>
          For questions about returns, please contact us at
          returns@fashionboutique.com
        </p>
      </div>
    </div>
  );
}
