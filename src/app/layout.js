import "./globals.css";
import Header from "@/components/Header";
import HeaderSpacer from "@/components/HeaderSpacer";
import Footer from "@/components/Footer";
import Script from "next/script";

export const metadata = {
  title: "Arcturus Digital Consulting",
  description: "Pragmatic product and app development that actually ships.",
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-C49YV15ZT6";

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <head>
        {/* GA4 tag */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){ dataLayer.push(arguments); }
            // Mark returning user (no PII)
            (function(){
              try {
                const k='adc_first_visit';
                if (!localStorage.getItem(k)) {
                  localStorage.setItem(k, String(Date.now()));
                  gtag('set', 'user_properties', { returning_user: 'false' });
                } else {
                  gtag('set', 'user_properties', { returning_user: 'true' });
                }
              } catch(_) {}
            })();

            // Init GA but DON'T auto send page_view (we control it)
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { send_page_view: false });
            // Expose safe gtag
            window.adc = window.adc || {};
            window.adc.gtag = function(){ try { return gtag.apply(null, arguments); } catch(_) {} };
          `}
        </Script>
      </head>
      <body className="bg-paper text-ink bg-starburst">
        <Header />
        <HeaderSpacer />
        <main>
          {children}
        </main>
        <Footer />
        {/* Route and click analytics */}
        <Script id="adc-analytics-delegation" strategy="afterInteractive">
          {`
            // Event delegation for clicks (buttons + links)
            document.addEventListener('click', function(e) {
              const el = e.target.closest('[data-analytics]');
              if (!el) return;
              const type = el.getAttribute('data-analytics'); // 'button' | 'link'
              const name = el.getAttribute('data-name') || el.textContent?.trim()?.slice(0,80) || '(unnamed)';
              const component = el.getAttribute('data-component') || '(unknown)';
              const variant = el.getAttribute('data-variant') || '(default)';
              const location = el.getAttribute('data-location') || '(page)';
              const extra = {};
              // Outbound link detection (no PII)
              if (type === 'link' && el.tagName === 'A') {
                try {
                  const u = new URL(el.href, window.location.href);
                  extra.outbound = u.hostname !== window.location.hostname ? 'true' : 'false';
                  extra.link_url = u.href;
                } catch(_) {}
              }
              (window.adc?.gtag || window.gtag || function(){})('event', 'adc_click', {
                item_name: name,
                component_name: component,
                variant,
                location,
                ...extra
              });
            }, { capture: true });
          `}
        </Script>
      </body>
    </html>
  );
}
