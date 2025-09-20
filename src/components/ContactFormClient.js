"use client";

import { useState } from "react";

export default function ContactFormClient() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.target;
    const data = {
      name: form.name.value,
      email: form.email.value,
      subject: form.subject.value,
      message: form.message.value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to send");

      setSent(true);
      form.reset();
    } catch (err) {
      console.error(err);
      setError("Sorry, something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-lg bg-orange-100 border border-orange-300 p-4 text-orange-800">
        <p className="font-semibold">Thanks — your message has been sent.</p>
        <p className="text-sm">
          We’ll get back to you within a couple of days from{" "}
          <span className="font-medium">info@arcturusdc.com</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      {error && (
        <div className="rounded-lg bg-red-100 border border-red-300 p-3 text-red-800">
          {error}
        </div>
      )}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-white/80"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded-md border border-white/20 bg-neutral-900/50 p-2 text-white placeholder-white/40 focus:border-orange-400 focus:ring focus:ring-orange-400/30"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-white/80"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 w-full rounded-md border border-white/20 bg-neutral-900/50 p-2 text-white placeholder-white/40 focus:border-orange-400 focus:ring focus:ring-orange-400/30"
        />
      </div>
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-white/80"
        >
          Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          className="mt-1 w-full rounded-md border border-white/20 bg-neutral-900/50 p-2 text-white placeholder-white/40 focus:border-orange-400 focus:ring focus:ring-orange-400/30"
        />
      </div>
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-white/80"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows="5"
          required
          className="mt-1 w-full rounded-md border border-white/20 bg-neutral-900/50 p-2 text-white placeholder-white/40 focus:border-orange-400 focus:ring focus:ring-orange-400/30"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
