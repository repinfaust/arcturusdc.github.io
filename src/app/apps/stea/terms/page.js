'use client';

import Link from 'next/link';

export default function SteaTermsPage() {
  return (
    <main className="min-h-screen bg-starburst">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-neutral-600">
          <Link href="/apps/stea/explore" className="hover:underline">STEa</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900 font-medium">Terms & Conditions</span>
        </nav>

        {/* Header */}
        <div className="card p-8 mb-6">
          <h1 className="text-4xl font-extrabold text-neutral-900 mb-2">
            STEa Terms & Conditions
          </h1>
          <p className="text-neutral-600">
            Last Updated: <strong>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
          </p>
          <p className="mt-4 text-neutral-700">
            By subscribing to or purchasing STEa services, you agree to be bound by these Terms and Conditions. 
            Please read them carefully before making a purchase.
          </p>
        </div>

        {/* Terms Content */}
        <div className="card p-8 space-y-8">
          {/* 1. Definitions */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">1. Definitions</h2>
            <ul className="space-y-2 text-neutral-700">
              <li><strong>"STEa"</strong> refers to the STEa platform and services provided by Arcturus Digital Consultancy.</li>
              <li><strong>"Service"</strong> includes access to Harls, Filo, Hans, Ruby, and hosted AutoProduct automation.</li>
              <li><strong>"Subscription"</strong> means a recurring payment plan (monthly or yearly).</li>
              <li><strong>"Purchase"</strong> means a one-time payment for digital products (e.g., MCP Config Pack).</li>
              <li><strong>"You"</strong> or <strong>"Customer"</strong> refers to the individual or entity subscribing to or purchasing STEa services.</li>
              <li><strong>"We"</strong>, <strong>"Us"</strong>, or <strong>"Company"</strong> refers to Arcturus Digital Consultancy.</li>
            </ul>
          </section>

          {/* 2. Subscription Plans */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">2. Subscription Plans</h2>
            <div className="space-y-4 text-neutral-700">
              <div>
                <h3 className="font-bold text-lg mb-2">2.1 Plan Types</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Solo Plan:</strong> £9/month or £92/year. Includes 1 active App, personal workspace, and full access to all tools.</li>
                  <li><strong>Team Plan:</strong> £25/seat/month or £255/seat/year. Includes up to 10 active Apps, shared workspaces, and collaborative features.</li>
                  <li><strong>Agency/Partner Plan:</strong> £49/seat/month or £499/seat/year. Includes multiple client workspaces, custom branding, and white-label options.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">2.2 Billing</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Subscriptions are billed in advance on a monthly or yearly basis.</li>
                  <li>All prices are in British Pounds (GBP) and include applicable taxes unless stated otherwise.</li>
                  <li>Yearly subscriptions offer a 15% discount compared to monthly billing.</li>
                  <li>Payment is processed securely through Stripe.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">2.3 Renewal</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Subscriptions automatically renew at the end of each billing period unless cancelled.</li>
                  <li>You will be charged automatically using the payment method on file.</li>
                  <li>We will notify you via email before each renewal.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. One-Time Purchases */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">3. One-Time Purchases</h2>
            <div className="space-y-2 text-neutral-700">
              <p>
                Digital products (such as the MCP Config Pack) are sold as one-time purchases. 
                These purchases are final and non-refundable unless otherwise stated, except where required by law.
              </p>
              <p>
                One-time purchases grant you a perpetual license to use the purchased digital content 
                according to the terms specified at the time of purchase.
              </p>
            </div>
          </section>

          {/* 4. Cancellation & Refunds */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">4. Cancellation & Refunds</h2>
            <div className="space-y-4 text-neutral-700">
              <div>
                <h3 className="font-bold text-lg mb-2">4.1 Subscription Cancellation</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>You may cancel your subscription at any time through your account settings or by contacting support.</li>
                  <li>Cancellation takes effect at the end of your current billing period.</li>
                  <li>You will continue to have access to the Service until the end of your paid period.</li>
                  <li>No refunds are provided for the current billing period after cancellation.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">4.2 Refund Policy</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>14-Day Money-Back Guarantee:</strong> If you are not satisfied with your subscription within 14 days of purchase, you may request a full refund.</li>
                  <li>Refund requests must be made by contacting <a href="mailto:support@arcturusdc.com" className="text-amber-600 hover:underline">support@arcturusdc.com</a>.</li>
                  <li>Refunds are processed within 5-10 business days to your original payment method.</li>
                  <li>One-time purchases (digital products) are generally non-refundable, except where required by consumer protection law.</li>
                  <li>We reserve the right to refuse refunds if we suspect fraud or abuse.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. Service Availability */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">5. Service Availability</h2>
            <div className="space-y-2 text-neutral-700">
              <p>
                We strive to provide 99.9% uptime but do not guarantee uninterrupted or error-free service. 
                We reserve the right to perform maintenance, updates, or modifications that may temporarily 
                affect service availability.
              </p>
              <p>
                We are not liable for any loss or damage resulting from service interruptions, 
                except where required by law.
              </p>
            </div>
          </section>

          {/* 6. User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">6. User Responsibilities</h2>
            <ul className="list-disc ml-6 space-y-2 text-neutral-700">
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate billing and contact information.</li>
              <li>You agree not to share your account with others or use the Service for illegal purposes.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must comply with all applicable laws and regulations when using the Service.</li>
            </ul>
          </section>

          {/* 7. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">7. Intellectual Property</h2>
            <div className="space-y-2 text-neutral-700">
              <p>
                All content, features, and functionality of STEa are owned by Arcturus Digital Consultancy 
                and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                Your subscription grants you a limited, non-exclusive, non-transferable license to use 
                the Service for your internal business purposes. You may not:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Copy, modify, or create derivative works of the Service</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Resell, sublicense, or redistribute the Service</li>
                <li>Use the Service to build a competing product</li>
              </ul>
            </div>
          </section>

          {/* 8. Data & Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">8. Data & Privacy</h2>
            <div className="space-y-2 text-neutral-700">
              <p>
                Your use of STEa is also governed by our Privacy Policy. We use industry-standard security 
                measures to protect your data, but you acknowledge that no system is 100% secure.
              </p>
              <p>
                You retain ownership of all data you create or upload to STEa. We will not access, 
                use, or share your data except as necessary to provide the Service or as required by law.
              </p>
            </div>
          </section>

          {/* 9. Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">9. Disclaimers</h2>
            <div className="space-y-2 text-neutral-700">
              <p>
                <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                EXPRESS OR IMPLIED.</strong> We disclaim all warranties, including but not limited to:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Merchantability and fitness for a particular purpose</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Accuracy or completeness of data</li>
                <li>Security or freedom from viruses or harmful components</li>
              </ul>
              <p className="mt-4">
                We do not guarantee that the Service will meet your specific requirements or that results 
                obtained from using the Service will be accurate or reliable.
              </p>
            </div>
          </section>

          {/* 10. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">10. Limitation of Liability</h2>
            <div className="space-y-2 text-neutral-700">
              <p>
                To the fullest extent permitted by law, Arcturus Digital Consultancy shall not be liable 
                for any indirect, incidental, special, consequential, or punitive damages, including but 
                not limited to:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Loss of profits, revenue, or data</li>
                <li>Business interruption</li>
                <li>Cost of substitute services</li>
                <li>Any other damages arising from your use of the Service</li>
              </ul>
              <p className="mt-4">
                Our total liability shall not exceed the amount you paid us in the 12 months preceding 
                the claim, or £100, whichever is greater.
              </p>
              <p className="mt-4 font-semibold">
                Nothing in these Terms excludes or limits our liability for death or personal injury 
                caused by our negligence, fraud, or any other liability that cannot be excluded by law.
              </p>
            </div>
          </section>

          {/* 11. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">11. Changes to Terms</h2>
            <div className="space-y-2 text-neutral-700">
              <p>
                We reserve the right to modify these Terms at any time. Material changes will be notified 
                via email or through the Service at least 30 days before they take effect.
              </p>
              <p>
                Continued use of the Service after changes become effective constitutes acceptance of the 
                new Terms. If you do not agree to the changes, you must cancel your subscription.
              </p>
            </div>
          </section>

          {/* 12. Termination */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">12. Termination</h2>
            <div className="space-y-2 text-neutral-700">
              <p>
                We may suspend or terminate your account immediately if you:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Violate these Terms or our Acceptable Use Policy</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Fail to pay fees when due</li>
                <li>Use the Service in a manner that harms us or other users</li>
              </ul>
              <p className="mt-4">
                Upon termination, your right to use the Service ceases immediately. We may delete your 
                account and data after a reasonable retention period, subject to legal requirements.
              </p>
            </div>
          </section>

          {/* 13. Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">13. Governing Law</h2>
            <div className="space-y-2 text-neutral-700">
              <p>
                These Terms are governed by and construed in accordance with the laws of England and Wales. 
                Any disputes arising from these Terms or your use of the Service shall be subject to the 
                exclusive jurisdiction of the courts of England and Wales.
              </p>
            </div>
          </section>

          {/* 14. Contact */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">14. Contact Information</h2>
            <div className="space-y-2 text-neutral-700">
              <p>
                If you have questions about these Terms, please contact us:
              </p>
              <ul className="list-none space-y-1">
                <li><strong>Email:</strong> <a href="mailto:support@arcturusdc.com" className="text-amber-600 hover:underline">support@arcturusdc.com</a></li>
                <li><strong>Support Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM GMT</li>
                <li><strong>Response Time:</strong> We aim to respond within 2 business days</li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-8 border-t border-neutral-200 mt-8">
            <p className="text-sm text-neutral-500 text-center">
              By subscribing to or purchasing STEa services, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/apps/stea/explore"
            className="inline-block px-6 py-3 bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all font-semibold"
          >
            ← Back to Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}

