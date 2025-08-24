import Link from "next/link";

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              This Privacy Policy describes how we collect, use, store, and protect your personal and financial information when you use our 
              personal finance application ("Service"). We are committed to protecting your privacy and ensuring the security of your financial data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Information We Collect
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Financial Information via Plaid
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use Plaid, a trusted third-party financial technology service, to securely connect to your financial institutions and retrieve:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-6">
              <li>Account balances and transaction histories</li>
              <li>Account and routing numbers</li>
              <li>Account holder names and contact information</li>
              <li>Financial institution information</li>
              <li>Transaction categorization data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Personal Information
            </h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-6">
              <li>Name and email address (for account creation)</li>
              <li>Usage data and application interactions</li>
              <li>Device information and IP address</li>
              <li>Chat conversations with our AI advisor</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Important: What We Don't Collect
            </h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>We never collect or store your banking passwords or credentials</li>
              <li>Your banking login information is handled exclusively by Plaid</li>
              <li>We do not have access to your online banking credentials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use your information solely to provide and improve our financial advisory services:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Analyze your spending patterns and financial behavior</li>
              <li>Provide personalized financial insights and recommendations</li>
              <li>Categorize and organize your transactions</li>
              <li>Generate financial reports and budgeting tools</li>
              <li>Train our AI models to provide better personalized advice</li>
              <li>Improve our Service and develop new features</li>
              <li>Communicate with you about your account and our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Data Sharing and Disclosure
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              We DO NOT:
            </h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-6">
              <li>Sell your financial data to any third parties</li>
              <li>Rent or share your data with marketers</li>
              <li>Use your data for advertising purposes</li>
              <li>Share your information for any commercial purposes outside of providing our Service</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Limited Sharing:
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We may share your information only in these limited circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li><strong>With Plaid:</strong> As required for the financial data connection service</li>
              <li><strong>With service providers:</strong> Third-party vendors who help us operate our Service (under strict confidentiality agreements)</li>
              <li><strong>For legal compliance:</strong> When required by law, court order, or government request</li>
              <li><strong>For safety:</strong> To protect our rights, property, or safety, or that of our users or others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Data Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>256-bit encryption for data transmission and storage</li>
              <li>Secure servers with multiple layers of protection</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Strict access controls and employee training</li>
              <li>Compliance with industry security standards (SOC 2, ISO 27001)</li>
              <li>Partnership with Plaid's bank-level security infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Plaid's Privacy Practices
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Plaid is a trusted financial technology company that powers thousands of financial apps. Key points about Plaid's privacy practices:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4 mb-4">
              <li>Plaid uses bank-level security and encryption</li>
              <li>Plaid does not sell or rent your financial data</li>
              <li>Plaid is certified for various security standards and compliance requirements</li>
              <li>Your banking credentials are never shared with us - they remain with Plaid</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              For complete details on Plaid's privacy practices, please review{" "}
              <a
                href="https://plaid.com/legal/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Plaid's Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Data Retention
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We retain your information only as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Active account data is retained while you use our Service</li>
              <li>Historical transaction data may be retained for up to 7 years for financial analysis purposes</li>
              <li>Account data is deleted within 90 days of account closure (unless required by law)</li>
              <li>Anonymized usage data may be retained indefinitely for service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Your Rights and Choices
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal requirements)</li>
              <li><strong>Data Portability:</strong> Request your data in a portable format</li>
              <li><strong>Revoke Consent:</strong> Disconnect your financial accounts at any time through your account settings</li>
              <li><strong>Restrict Processing:</strong> Request limitations on how we process your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Cookies and Tracking
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Maintain your login session</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns to improve our Service</li>
              <li>Provide security features and fraud protection</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You can control cookie settings through your browser, though some features may not work properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Children's Privacy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our Service is not intended for children under 18 years of age. We do not knowingly collect personal information from children 
              under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us 
              so we can delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. International Data Transfers
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Your information may be processed and stored in the United States or other countries where we or our service providers operate. 
              We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last updated" 
              date at the top of this policy and, where appropriate, providing additional notice through our Service or via email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              13. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us through our support channels 
              available in the application.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              For questions specifically about Plaid's handling of your data, please refer to{" "}
              <a
                href="https://plaid.com/legal/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Plaid's Privacy Policy
              </a>{" "}
              and contact information.
            </p>
          </section>

          <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-cyan-800 dark:text-cyan-200 mb-2">
                🔒 Your Data Security Commitment
              </h3>
              <p className="text-cyan-700 dark:text-cyan-300 text-sm leading-relaxed">
                We are committed to protecting your financial data with the highest standards of security and privacy. 
                Your trust is essential to us, and we will never sell, rent, or misuse your personal financial information.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
