"use client";
import { useState, useRef } from "react";

export default function ContactFormClient() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const formEl = formRef.current;
    const data = new FormData(formEl);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: data,
        headers: {
          Accept: "application/json",
          "X-Requested-With": "fetch",
        },
      });

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const payload = isJson ? await res.json() : null;

      if (!res.ok || !payload?.ok) {
        const code = payload?.error || "server";
        setError(code);
        setStatus("error");
        return;
      }

      // Success: hide the form
      formEl.reset();
      setStatus("success");
    } catch (err) {
      console.error(err);
      setError("network");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="mx-auto w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 p-6 sm:p-8"
      >
        <h2 className="text-xl font-semibold mb-2">Thanks — your message has been sent.</h2>
        <p className="text-emerald-100/90">
          We’ll get back to you within a couple of days from <strong>info@arcturusdc.com</strong>.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur p-6 sm:p-8"
      aria-busy={status === "loading" ? "true" : "false"}
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

      {/* Error banner */}
      {status === "error" && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
          {error === "missing" && "Please fill in all required fields."}
          {error === "email" && "That email address doesn’t look valid."}
          {error === "smtp_not_configured" && (
            <>
              Email service isn’t configured. Please email{" "}
              <a className="underline" href="mailto:info@arcturusdc.com">info@arcturusdc.com</a>{" "}
              directly.
            </>
          )}
          {error === "email_lib" && "Email service is temporarily unavailable."}
          {error === "network" && "Network error — please try again."}
          {!["missing","email","smtp_not_configured","email_lib","network"].includes(error) &&
            "Something went wrong sending your message. Try again in a moment."}
        </div>
      )}

      {/* Honeypot (hidden) */}
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
            disabled={status === "loading"}
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
            disabled={status === "loading"}
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
            disabled={status === "loading"}
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
            disabled={status === "loading"}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50">
            We’ll reply from <span className="text-white">info@arcturusdc.com</span>.
          </p>
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center rounded-full bg-white/90 text-black px-5 py-2.5 font-medium hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 transition disabled:opacity-70"
          >
            {status === "loading" ? "Sending…" : "Send message"}
          </button>
        </div>
      </div>
    </form>
  );
}
