// src/lib/analytics.js
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-C49YV15ZT6";

function g() {
  // safe accessor; respects our layout bootstrap (window.adc.gtag)
  if (typeof window === "undefined") return null;
  return (window.adc && window.adc.gtag) || window.gtag || null;
}

/** Fire a GA4 page_view (manual because we disabled auto page_view). */
export function trackPageView({ page_location, page_path }) {
  const gt = g();
  if (!gt) return;
  gt("event", "page_view", {
    send_to: GA_ID,
    page_location,
    page_path,
  });
}

/** Generic click event. Uses our adc_click naming. No PII. */
export function trackClick({
  item_name,
  component_name,
  variant,
  location,
  outbound = "false",
  link_url,
}) {
  const gt = g();
  if (!gt) return;
  gt("event", "adc_click", {
    item_name,
    component_name,
    variant,
    location,
    outbound,     // "true" | "false"
    link_url,     // string; avoid query params if they might contain PII
  });
}

/** Form submit success (no PII). */
export function trackFormSubmit({ form_id, success = "true" }) {
  const gt = g();
  if (!gt) return;
  gt("event", "adc_form_submit", { form_id, success });
}

/** Optional user property (no PII). */
export function setReturningUser(flag) {
  const gt = g();
  if (!gt) return;
  gt("set", "user_properties", { returning_user: flag ? "true" : "false" });
}
