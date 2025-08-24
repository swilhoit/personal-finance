import Link from "next/link";

export default function SecurityPage() {
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
            Security & Data Protection
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            How we protect your financial data with industry-leading security measures
          </p>
        </div>

        {/* Hero Security Badge */}
        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-2xl p-8 mb-12 border border-cyan-200 dark:border-cyan-800">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Bank-Level Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Your financial data is protected with the same security standards used by major financial institutions
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🔒 Data Encryption
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  In Transit
                </h3>
                <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                  <li>• TLS 1.3 encryption for all data transmission</li>
                  <li>• 256-bit AES encryption standards</li>
                  <li>• End-to-end encrypted connections</li>
                  <li>• Certificate pinning for API security</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  At Rest
                </h3>
                <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                  <li>• AES-256 encryption for stored data</li>
                  <li>• Encrypted database storage</li>
                  <li>• Secure key management systems</li>
                  <li>• Regular encryption key rotation</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🏦 Plaid Security Partnership
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                Why We Trust Plaid
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                Plaid is a leading financial technology company that securely connects thousands of financial apps to users' bank accounts. 
                They are trusted by major financial institutions and consumer apps alike.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🏆</div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">SOC 2 Certified</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type II compliance</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🔐</div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">ISO 27001</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">International security standard</p>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🛡️</div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">PCI DSS</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment security compliant</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                What This Means for You:
              </h4>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Your banking credentials are never shared with us - they remain secure with Plaid</li>
                <li>We only receive the financial data you authorize (balances, transactions, etc.)</li>
                <li>All connections use read-only access - we cannot initiate transactions</li>
                <li>You can disconnect your accounts at any time through your account settings</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🔐 Access Controls
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  User Authentication
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                  <li>Multi-factor authentication (MFA) support</li>
                  <li>Secure password requirements</li>
                  <li>Session timeout protection</li>
                  <li>Account lockout after failed attempts</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Internal Access
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                  <li>Role-based access controls (RBAC)</li>
                  <li>Principle of least privilege</li>
                  <li>Regular access reviews and audits</li>
                  <li>Comprehensive audit logging</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🛡️ Infrastructure Security
            </h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Cloud Security
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                  <li>Enterprise-grade cloud infrastructure</li>
                  <li>Network segmentation and firewalls</li>
                  <li>DDoS protection and mitigation</li>
                  <li>24/7 security monitoring</li>
                  <li>Automatic security updates and patches</li>
                </ul>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Data Protection
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                  <li>Regular automated backups</li>
                  <li>Geographic data replication</li>
                  <li>Secure data disposal procedures</li>
                  <li>Data integrity monitoring</li>
                  <li>Disaster recovery planning</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              📋 Compliance & Auditing
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Regulatory Compliance
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                  <li>GDPR compliance for data protection</li>
                  <li>CCPA compliance for California residents</li>
                  <li>Financial data protection regulations</li>
                  <li>Regular compliance assessments</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Security Auditing
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                  <li>Regular penetration testing</li>
                  <li>Vulnerability assessments</li>
                  <li>Third-party security audits</li>
                  <li>Continuous security monitoring</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              👥 Team Security
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Human Security Measures
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>Background checks for all team members</li>
                <li>Regular security training and awareness programs</li>
                <li>Confidentiality agreements and security policies</li>
                <li>Secure development practices and code reviews</li>
                <li>Incident response procedures and training</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🚨 Incident Response
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We have comprehensive incident response procedures in place to quickly identify, contain, and resolve any security issues:
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl mb-2">🔍</div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200">Detection</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">24/7 monitoring systems</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl mb-2">⚡</div>
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Response</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Immediate containment</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl mb-2">🔧</div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Recovery</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">Service restoration</p>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
                <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  🚨 Breach Notification
                </h4>
                <p className="text-orange-700 dark:text-orange-300 text-sm">
                  In the unlikely event of a data breach, we commit to notifying affected users within 72 hours and will work with 
                  appropriate authorities to investigate and resolve the issue quickly.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🔧 Your Security Controls
            </h2>
            <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <h3 className="text-lg font-semibold text-cyan-800 dark:text-cyan-200 mb-3">
                You're in Control
              </h3>
              <p className="text-cyan-700 dark:text-cyan-300 mb-4">
                We believe you should have complete control over your financial data. Here's what you can do:
              </p>
              <ul className="list-disc list-inside text-cyan-700 dark:text-cyan-300 space-y-2">
                <li>View and manage connected accounts at any time</li>
                <li>Disconnect financial accounts instantly</li>
                <li>Request data exports or deletion</li>
                <li>Enable/disable specific data sharing features</li>
                <li>Set up account alerts and notifications</li>
                <li>Review access logs and activity history</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              📞 Security Questions?
            </h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We're committed to transparency about our security practices. If you have questions about how we protect your data, 
                please don't hesitate to reach out through our support channels.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/legal/privacy-policy"
                  className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                >
                  Privacy Policy →
                </Link>
                <Link
                  href="/legal/terms-of-service"
                  className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                >
                  Terms of Service →
                </Link>
                <a
                  href="https://plaid.com/safety/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                >
                  Plaid Security →
                </a>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                🛡️ Our Security Promise
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Your financial security is our top priority. We continuously invest in the latest security technologies and practices 
                to ensure your data remains safe and secure. We will never compromise on security or privacy.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
