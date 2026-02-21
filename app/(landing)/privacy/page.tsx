import Link from 'next/link'
import { LandingNav } from '@/components/landing/landing-nav'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - Inkuity',
  description: 'Privacy Policy for the Inkuity gym management platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] antialiased text-white">
      <LandingNav />

      <main className="mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: February 21, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Introduction</h2>
            <p>
              Inkuity Inc. ("Inkuity", "we", "us", or "our") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our gym management platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-slate-300">Account Information:</strong> name, email address, phone number, password</li>
              <li><strong className="text-slate-300">Gym Information:</strong> gym name, address, contact details, logo</li>
              <li><strong className="text-slate-300">Member Data:</strong> member names, contact details, check-in records, membership status</li>
              <li><strong className="text-slate-300">Usage Data:</strong> pages visited, features used, device information, IP address</li>
              <li><strong className="text-slate-300">Communication Data:</strong> messages sent through our contact forms or support channels</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process member check-ins and manage membership data</li>
              <li>Send transactional emails (check-in confirmations, account notifications)</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Generate analytics and reports for gym owners</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-slate-300">Service Providers:</strong> third-party services that help us operate (hosting, email delivery, analytics)</li>
              <li><strong className="text-slate-300">Gym Owners:</strong> member data is shared with the gym owner who manages the account</li>
              <li><strong className="text-slate-300">Legal Requirements:</strong> when required by law, regulation, or legal process</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including
              encryption in transit (TLS/SSL), secure database storage, and access controls.
              However, no method of transmission or storage is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide the
              Service. When you delete your account, we will delete or anonymize your personal data
              within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability (receive your data in a structured format)</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at{' '}
              <a href="mailto:contact@inkuity.com" className="text-brand-cyan-400 hover:underline">
                contact@inkuity.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Cookies</h2>
            <p>
              We use essential cookies to maintain your session and preferences. We do not use
              third-party tracking cookies for advertising. You can manage cookie preferences
              through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for children under 13. We do not knowingly collect personal
              information from children. If you believe we have collected data from a child, contact
              us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes via email or a prominent notice on the Service. The "Last updated" date at the
              top reflects when the policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:contact@inkuity.com" className="text-brand-cyan-400 hover:underline">
                contact@inkuity.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
