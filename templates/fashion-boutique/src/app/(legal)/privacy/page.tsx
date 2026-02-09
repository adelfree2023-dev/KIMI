/**
 * Privacy Policy Page
 *
 * Legal page for privacy policy.
 *
 * @route /privacy
 */

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto prose">
        <h1>Privacy Policy</h1>

        <p className="text-gray-600">Last updated: February 2026</p>

        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us when you create an
          account, make a purchase, or contact us.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to process your orders, communicate
          with you, and improve our services.
        </p>

        <h2>3. Information Sharing</h2>
        <p>
          We do not sell your personal information. We may share information
          with service providers who help us operate our business.
        </p>

        <h2>4. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal
          information.
        </p>

        <h2>5. Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal
          information.
        </p>

        <h2>6. Contact Us</h2>
        <p>
          If you have questions about this privacy policy, please contact us at
          privacy@fashionboutique.com
        </p>
      </div>
    </div>
  );
}
