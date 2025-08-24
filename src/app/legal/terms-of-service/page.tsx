export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-cyan-50 via-sky-50 to-teal-50 dark:from-gray-900 dark:via-cyan-950 dark:to-teal-950">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-['Bungee'] mb-8 bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        
        <div className="bg-white dark:bg-gray-900 rounded-3xl border-4 border-cyan-400 dark:border-cyan-600 p-8 shadow-2xl">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By using MAMA, you agree to these terms of service.
            </p>
            
            <h2 className="text-2xl font-['Bungee'] mt-8 mb-4 text-cyan-600 dark:text-cyan-400">
              Acceptable Use
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You agree to use our service only for lawful purposes and in accordance with these terms.
            </p>
            
            <h2 className="text-2xl font-['Bungee'] mt-8 mb-4 text-cyan-600 dark:text-cyan-400">
              Account Responsibilities
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              You are responsible for maintaining the security of your account and for all activities that occur under your account.
            </p>
            
            <h2 className="text-2xl font-['Bungee'] mt-8 mb-4 text-cyan-600 dark:text-cyan-400">
              Service Modifications
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We reserve the right to modify or discontinue our service at any time with notice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}