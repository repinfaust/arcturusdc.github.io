// src/app/contact/page.js
import { Suspense } from "react";

export const metadata = {
  title: "Contact | Arcturus Digital Consulting",
  description:
    "Get in touch about product strategy, payments, metering, billing and platform work. We’ll get back to you promptly.",
};

function Banner({ type = "success", children }) {
  const base =
    "mb-6 rounded-xl border px-4 py-3 text-sm";
  const styles =
    type === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : "border-red-500/30 bg-red-500/10 text-red-200";
  return <div className={`${base} ${styles}`}>{children}</div>;
}

function ContactForm() {
  return (
    <form
      method="POST"
      action="/api/contact"
      className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur p-6 sm:p-8"
    >
      <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
        Contact
      </h1>
      <p className="text-white/70 mb-6">
        Prefer email? Drop us a line at{" "}
        <a
          className="underline decoration-white/40 hover:decoration-white"
          href="mailto:info@arcturusdc.com"
        >
          info@arcturusdc.com
        </a>
        .
      </p>

      {/* Honeypot */}
      <div className="hidden">
        <label htmlFor="company">Company (leave blank)</label>
        <input id="company" name="company" type="text" />
      </div>

      <div className="grid gap-4 sm:gap-5">
        <div>
          <label className="block text-sm text-white/80 mb-1" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-xl bg-neutral-800/80 border border-white/10 px-3 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="Jane Smith"
          />
        </div>

        <div>
          <label className="block text-sm text-white/80 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            inputMode="email"
            className="w-full rounded-xl bg-neutral-800/80 border border-white/10 px-3 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm text-white/80 mb-1" htmlFor="subject">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            className="w-full rounded-xl bg-neutral-800/80 border border-white/10 px-3 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="How we can help"
          />
        </div>

        <div>
          <label className="block text-sm text-white/80 mb-1" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            className="w-full rounded-xl bg-neutral-800/80 border border-white/10 px-3 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="Tell us a bit about your needs, timelines, and goals."
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50">
            We’ll reply from <span className="text-white">info@arcturusdc.com</span>.
          </p>
          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-white/90 text-black px-5 py-2.5 font-medium hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition"
          >
            Send message
          </button>
        </div>
      </div>
    </form>
  );
}

export default function ContactPage({ searchParams }) {
  const sent = searchParams?.sent === "1";
  const error = searchParams?.error;

  return (
    <div className="px-3 sm:px-4">
      <div className="mx-auto max-w-7xl py-12 sm:py-16">
        <div className="mx-auto max-w-2xl mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-white/60">Get in touch</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Let’s talk about your product or platform
          </h1>
          <p className="mt-3 text-white/70">
            Product strategy, payments, metering, billing, compliance — we’ve got you covered.
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          {sent && <Banner type="success">Thanks — your message has been sent. We’ll reply from <strong>info@arcturusdc.com</strong>.</Banner>}
          {error === "missing" && <Banner type="error">Please fill in all required fields.</Banner>}
          {error === "email" && <Banner type="error">That email address doesn’t look valid.</Banner>}
          {error === "email-lib" && <Banner type="error">Email service isn’t available right now.</Banner>}
          {error === "server" && <Banner type="error">Something went wrong sending your message. Try again in a moment.</Banner>}
        </div>

        <Suspense>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  );
}
