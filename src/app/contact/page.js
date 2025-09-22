// src/app/contact/page.js
import Image from "next/image";
import Link from "next/link";
import ContactFormClient from "../../components/ContactFormClient";

export const metadata = {
  title: "Contact | Arcturus Digital Consulting",
  description:
    "Get in touch about product strategy, payments, metering, billing and platform work. We’ll get back to you promptly.",
};

export default function ContactPage() {
  return (
    <div className="px-3 sm:px-4">
      <div className="mx-auto max-w-7xl pt-0 sm:pt-2 pb-12 sm:pb-16">
        <div className="mx-auto max-w-2xl mb-6 text-center">
          <p className="text-sm uppercase tracking-widest text-white/60 mt-0 mb-1">
            Get in touch
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-0 mb-2">
            Let’s talk about your product or platform
          </h1>
          <p className="text-white/70 mt-0 mb-0">
            Product strategy, payments, metering, billing, compliance — we’ve got you covered.
          </p>
        </div>

        <ContactFormClient />

        {/* Instagram link */}
        <div className="mt-8 flex justify-center">
          <Link
            href="https://www.instagram.com/arcturusdigitalconsulting?igsh=MWZuajQ0bHZ2dzJpcQ=="
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white hover:text-pink-500"
          >
            <Image
              src="/img/Instagram_Glyph_Gradient.png"
              alt="Instagram"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-sm">Follow us on Instagram</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
