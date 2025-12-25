import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white p-4 sm:p-6 pb-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-3xl sm:text-4xl font-arcade font-black text-neon-cyan mb-2">PRIVACY POLICY</h1>
          <p className="text-neon-gold">Last updated: December 2024</p>
        </div>

        {/* Content */}
        <div className="space-y-8 bg-slate-900/40 border border-neon-cyan/20 rounded-lg p-6 sm:p-8">
          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">1. Introduction</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              X-SPIN ("we", "us", or "our") operates the Platform. This Privacy Policy outlines how we collect, use, and protect your personal information. Your privacy is important to us.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">2. Information We Collect</h2>
            <div className="text-slate-300 text-sm leading-relaxed space-y-3">
              <p><strong className="text-neon-gold">Account Information:</strong> Username, email, phone number, date of birth, and profile picture.</p>
              <p><strong className="text-neon-gold">Financial Information:</strong> Payment method details (encrypted), transaction history, and account balance.</p>
              <p><strong className="text-neon-gold">Usage Data:</strong> Game history, bet amounts, gameplay duration, and device information.</p>
              <p><strong className="text-neon-gold">Communication:</strong> Support tickets, chat logs, and customer service interactions.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">3. How We Use Your Information</h2>
            <div className="text-slate-300 text-sm leading-relaxed space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Provide and maintain the Platform</li>
                <li>Process deposits and withdrawals</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Improve user experience and Platform features</li>
                <li>Communicate important updates and offers</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">4. Data Security</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              We use industry-standard SSL/TLS encryption to protect your personal information. Payment data is encrypted and never stored on our servers. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">5. Sharing Your Information</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              We do not sell or share your personal information with third parties, except:
            </p>
            <div className="text-slate-300 text-sm leading-relaxed space-y-3 ml-4">
              <ul className="list-disc list-inside space-y-2">
                <li>Payment processors (encrypted transactions only)</li>
                <li>Fraud prevention services</li>
                <li>Legal authorities (when required by law)</li>
                <li>Service providers under strict confidentiality agreements</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">6. Cookies & Tracking</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              We use cookies to enhance your experience and analyze usage patterns. You can disable cookies in your browser settings, but some features may not work properly.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">7. Your Rights</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              You have the right to:
            </p>
            <div className="text-slate-300 text-sm leading-relaxed space-y-3 ml-4">
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">8. Data Retention</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              We retain your personal information for as long as your account is active or as required by law. Deleted accounts are purged from our active systems after 90 days, but transaction records may be retained for compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">9. International Data Transfers</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Your information may be stored and processed in countries other than your country of residence. By using the Platform, you consent to such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">10. Third-Party Links</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              The Platform may contain links to third-party websites. We are not responsible for their privacy practices. Always review their privacy policies before providing information.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">11. Policy Updates</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-arcade text-neon-cyan mb-4 uppercase">12. Contact Us</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              For privacy concerns or data requests: <br/>
              <strong className="text-neon-gold">Email:</strong> privacy@x-spin.com <br/>
              <strong className="text-neon-gold">Phone:</strong> +1 (800) PRIVACY <br/>
              <strong className="text-neon-gold">Data Protection Officer:</strong> dpo@x-spin.com
            </p>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-neon-cyan text-black font-arcade font-bold rounded hover:bg-white transition-colors active:scale-95"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
