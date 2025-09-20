// src/components/ConsentManager.js
"use client";

import { useEffect, useState } from "react";
import { getConsent, setConsent } from "@/utils/consentStore";

function updateGaConsent(granted) {
  const gtag =
    (typeof window !== "undefined" &&
      (window.adc?.gtag || window.gtag)) ||
    null;
  if (!gtag) return;

  gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });

  gtag("set", "user_properties", {
    analytics_consent: granted ? "true" : "false",
  });

  // 👇 Immediate nudge: fire page_view if just accepted
  if (granted) {
    gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }
}

export default function ConsentManager() {
  const [seen, setSeen] = useState(true);
  const [openPrefs, setOpenPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  // On mount: read prior choice
  useEffect(() => {
    try {
      const saved = getConsent();
      if (saved && typeof saved.analytics === "boolean") {
        setAnalytics(saved.analytics);
        setSeen(true);
        updateGaConsent(saved.analytics);
      } else {
        setSeen(false); // no prior choice → show banner
      }
    } catch {
      setSeen(false);
    }
  }, []);

  function persistAndClose(next) {
    setConsent({ analytics: next });
    updateGaConsent(next); // includes the nudge
    setAnalytics(next);
    setSeen(true);
    setOpenPrefs(false);
  }

  if (seen && !openPrefs) return null;

  return (
    <>
      {/* Banner */}
      {!seen && !openPrefs && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-5xl p-3 sm:p-4"
        >
          <div className="rounded-2xl border border-white/10 bg-neutral-900/90 backdrop-blur px-4 py-4 sm:px-6 sm:py-5 text-white shadow-lg">
            <p className="text-sm">
              We use essential cookies to make this site work. With your
              permission we’d also like to use analytics (Google Analytics) to
              help us improve.{" "}
              <a
                href="/privacy"
                className="underline decoration-white/40 hover:decoration-white"
              >
                Learn more
              </a>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => persistAndClose(true)}
                className="inline-flex items-center rounded-full bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => persistAndClose(false)}
                className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={() => setOpenPrefs(true)}
                className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Customise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences modal */}
      {openPrefs && (
        <div className="fixed inset-0 z-[75]">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenPrefs(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cookie preferences"
            className="absolute left-1/2 top-1/2 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-neutral-950 p-6 text-white shadow-2xl"
          >
            <h2 className="text-xl font-semibold">Cookie preferences</h2>
            <p className="mt-2 text-sm text-white/80">
              Essential cookies are always on. Enable analytics to help us
              improve the site.
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">Essential</div>
                    <div className="text-sm text-white/70">
                      Required for the site to function. Always on.
                    </div>
                  </div>
                  <span className="text-xs rounded-full bg-white/10 px-2 py-1">
                    Always on
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">
                      Analytics (Google Analytics)
                    </div>
                    <div className="text-sm text-white/70">
                      Helps us understand usage. No personal identifiers in our
                      events.
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => persistAndClose(false)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Save & reject
              </button>
              <button
                type="button"
                onClick={() => persistAndClose(analytics)}
                className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
