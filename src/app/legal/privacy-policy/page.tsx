export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-cyan-50 via-sky-50 to-teal-50 dark:from-gray-900 dark:via-cyan-950 dark:to-teal-950">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-['Bungee'] mb-8 bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-4 border-cyan-400 dark:border-cyan-600 p-8 shadow-2xl">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Your privacy is important to us. This policy describes how we collect, use, and protect your information.
            </p>
            
            <h2 className="text-2xl font-['Bungee'] mt-8 mb-4 text-cyan-600 dark:text-cyan-400">
              Information We Collect
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We collect information you provide directly to us, such as when you create an account or connect your financial institutions through Plaid.
            </p>
            
            <h2 className="text-2xl font-['Bungee'] mt-8 mb-4 text-cyan-600 dark:text-cyan-400">
              How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We use your information to provide and improve our services, including AI-powered financial insights and recommendations.
            </p>
            
            <h2 className="text-2xl font-['Bungee'] mt-8 mb-4 text-cyan-600 dark:text-cyan-400">
              Data Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We implement bank-level security measures to protect your data. All data is encrypted in transit and at rest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}