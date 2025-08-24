import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 mb-6"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By accessing and using this personal finance application ("Service"), you accept and agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Use of Plaid Services
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Our Service integrates with Plaid Inc. ("Plaid") to securely connect to your financial institutions and retrieve your financial data. 
              By using our Service, you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Your financial data will be accessed and processed through Plaid's secure platform</li>
              <li>You consent to Plaid's processing of your financial information in accordance with Plaid's Privacy Policy</li>
              <li>We do not store your banking credentials - these are handled exclusively by Plaid</li>
              <li>You authorize us to access your financial account information through Plaid for the purposes described in these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Data Usage and Protection
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We are committed to protecting your financial data. We agree that:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>We will not sell, rent, or share your financial data with marketers or other third parties for marketing purposes</li>
              <li>Your data will only be used to provide and improve our financial advisory services</li>
              <li>We implement industry-standard security measures to protect your information</li>
              <li>We comply with all applicable laws regarding financial data protection and privacy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Compliance with Laws
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We comply with all applicable local, state, national, and international laws and regulations, especially those pertaining to 
              financial data, data protection, privacy, and data security. You agree to use our Service only for lawful purposes and in 
              accordance with these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Prohibited Conduct
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Use automated systems to access the Service without our express written permission</li>
              <li>Reverse engineer, decompile, or attempt to extract source code from our Service</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. User Responsibilities
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring the accuracy of information you provide</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Service Availability
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              While we strive to maintain continuous service availability, we do not guarantee that the Service will be available at all times. 
              We may temporarily suspend or restrict access to some or all of the Service for maintenance, updates, or other operational reasons.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Disclaimer of Warranties
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              The Service is provided "as is" and "as available" without warranties of any kind. We disclaim all warranties, express or implied, 
              including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive 
              damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Termination
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Either party may terminate this agreement at any time. Upon termination, your right to use the Service will cease immediately. 
              We may also suspend or terminate your account if you violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Changes to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last updated" 
              date at the top of this page. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              12. Contact Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through our support channels available in the application.
            </p>
          </section>

          <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Third-Party Services:</strong> This service uses Plaid to connect to your financial institutions. 
              Plaid's use of your information is governed by their privacy policy, which can be found at{" "}
              <a
                href="https://plaid.com/legal/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                https://plaid.com/legal/privacy/
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
