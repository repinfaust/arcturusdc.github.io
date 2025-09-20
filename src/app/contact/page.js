// src/app/contact/page.js
import ContactFormClient from "../../components/ContactFormClient";

export const metadata = {
  title: "Contact | Arcturus Digital Consulting",
  description:
    "Get in touch about product strategy, payments, metering, billing and platform work. We’ll get back to you promptly.",
};

export default function ContactPage() {
  return (
    <div className="px-3 sm:px-4">
      <div className="mx-auto max-w-7xl py-12 sm:py-16">
        {/* Header */}
        <div className="mx-auto max-w-2xl mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-white/60">
            Get in touch
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Let’s talk about your product or platform
          </h1>
          <p className="mt-3 text-white/70">
            Product strategy, payments, metering, billing, compliance — we’ve got
            you covered.
          </p>
        </div>

        {/* Contact form client component */}
        <ContactFormClient />
      </div>
    </div>
  );
}
