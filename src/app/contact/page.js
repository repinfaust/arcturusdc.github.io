// src/app/contact/page.js
import ContactFormClient from "../../components/ContactFormClient";
import Script from "next/script";

export const metadata = {
  title: "Contact | Arcturus Digital Consulting",
  description:
    "Get in touch about product strategy, payments, metering, billing and platform work. We’ll get back to you promptly.",
};

export default function ContactPage() {
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

        <ContactFormClient />
      </div>

      {/* Safety net: intercept submit even if React doesn't hydrate */}
      <Script id="contact-form-intercept" strategy="afterInteractive">
        {`
          (function () {
            var form = document.getElementById('contact-form');
            if (!form) return;
            form.addEventListener('submit', async function (e) {
              // If React already prevented, do nothing.
              if (e.defaultPrevented) return;
              e.preventDefault();

              var payload = {
                name: form.name.value,
                email: form.email.value,
                subject: form.subject.value,
                message: form.message.value,
                company: form.company ? form.company.value : ""
              };

              try {
                var res = await fetch('/api/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                  body: JSON.stringify(payload)
                });
                var ok = false;
                try { var data = await res.json(); ok = !!data.ok; } catch(_) {}
                if (ok) {
                  var wrapper = form.parentNode;
                  form.remove();
                  var div = document.createElement('div');
                  div.id = 'contact-success';
                  div.className = 'mx-auto w-full max-w-2xl rounded-2xl border border-orange-300 bg-orange-100/80 text-orange-900 p-6 sm:p-8';
                  div.innerHTML = '<h2 class="text-xl font-semibold mb-1">Thanks — your message has been sent.</h2><p>We’ll get back to you within a couple of days from <strong>info@arcturusdc.com</strong>.</p>';
                  wrapper.appendChild(div);
                } else {
                  alert('Sorry, something went wrong. Please try again.');
                }
              } catch (err) {
                alert('Network error. Please try again.');
              }
            }, { passive: false });
          })();
        `}
      </Script>
    </div>
  );
}
