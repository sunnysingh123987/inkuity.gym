import Link from 'next/link'
import { LandingNav } from '@/components/landing/landing-nav'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms and Conditions - Inkuity',
  description: 'Terms and Conditions for using the Inkuity gym management platform.',
}

export default function TermsPage() {
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

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Terms and Conditions</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: February 21, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Inkuity platform ("Service"), you agree to be bound by these
              Terms and Conditions. If you do not agree, you may not use the Service.
              These terms apply to all users, including gym owners, administrators, and members.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Description of Service</h2>
            <p>
              Inkuity provides a cloud-based gym management platform that includes member check-in
              via QR codes, membership tracking, analytics dashboards, and related tools. We reserve
              the right to modify, suspend, or discontinue any part of the Service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. User Accounts</h2>
            <p>
              You must provide accurate and complete information when creating an account. You are
              responsible for maintaining the confidentiality of your login credentials and for all
              activity that occurs under your account. Notify us immediately at{' '}
              <a href="mailto:contact@inkuity.com" className="text-brand-cyan-400 hover:underline">
                contact@inkuity.com
              </a>{' '}
              if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Scrape, harvest, or collect data from the Service without permission</li>
              <li>Impersonate another person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Data Ownership</h2>
            <p>
              You retain ownership of all data you upload to the Service. By using Inkuity, you
              grant us a limited license to process and store your data solely to provide the
              Service. We do not sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Payment and Billing</h2>
            <p>
              Certain features of the Service may require a paid subscription. Pricing, billing
              cycles, and payment terms will be communicated at the time of purchase. All fees are
              non-refundable unless otherwise stated. We reserve the right to change pricing with
              30 days notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Intellectual Property</h2>
            <p>
              All content, trademarks, logos, and software associated with Inkuity are the property
              of Inkuity Inc. You may not reproduce, modify, or distribute any part of the Service
              without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Inkuity shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the
              Service. Our total liability shall not exceed the amount you paid us in the 12 months
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Termination</h2>
            <p>
              We may suspend or terminate your account if you violate these terms. You may also
              delete your account at any time from your account settings. Upon termination, your
              right to use the Service ceases immediately, though we may retain certain data as
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of significant changes
              via email or a notice on the Service. Continued use after changes constitutes acceptance
              of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Contact</h2>
            <p>
              For questions about these terms, contact us at{' '}
              <a href="mailto:contact@inkuity.com" className="text-brand-cyan-400 hover:underline">
                contact@inkuity.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
