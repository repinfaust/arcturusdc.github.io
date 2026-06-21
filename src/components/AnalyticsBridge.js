"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView, trackClick, setReturningUser } from "@/lib/analytics";

function findTrackable(target) {
  // Walk up composedPath() to find an element with data-analytics
  const path = (target?.getRootNode && target.getRootNode().composedPath?.()) || [];
  for (const el of [target, ...path]) {
    if (el && el.getAttribute && el.hasAttribute?.("data-analytics")) return el;
  }
  return null;
}

function isOutbound(href) {
  try {
    const u = new URL(href, window.location.href);
    return u.host !== window.location.host;
  } catch {
    return false;
  }
}

function cleanUrlForEvent(href) {
  try {
    // Drop search/hash to avoid accidental PII; keep origin+path.
    const u = new URL(href, window.location.href);
    return `${u.origin}${u.pathname}`;
  } catch {
    return ""; // fallback
  }
}

const SAFE_PAGE_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "adc_ref",
  "adc_campaign",
]);

function safeCampaignValue(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 80) return "";
  if (!/^[a-zA-Z0-9._~-]+$/.test(trimmed)) return "";
  return trimmed;
}

function safePageUrl() {
  const source = new URL(window.location.href);
  const safe = new URL(source.origin + source.pathname);

  for (const [key, value] of source.searchParams.entries()) {
    if (!SAFE_PAGE_PARAMS.has(key)) continue;
    const safeValue = safeCampaignValue(value);
    if (safeValue) safe.searchParams.set(key, safeValue);
  }

  return {
    page_location: safe.toString(),
    page_path: safe.pathname + safe.search,
  };
}

export default function AnalyticsBridge() {
  const pathname = usePathname();
  const search = useSearchParams();

  // 1) Page views on route change
  useEffect(() => {
    if (!pathname) return;
    const { page_location, page_path } = safePageUrl();
    trackPageView({ page_location, page_path });
  }, [pathname, search]);

  // 2) Clicks (delegated)
  useEffect(() => {
    const onClick = (e) => {
      const el = findTrackable(e.target);
      // If you don't add attributes, still try to infer for <a> / <button>
      let inferred = null;

      if (!el) {
        const a = e.target?.closest?.("a[href]");
        const btn = e.target?.closest?.("button, [role='button']");
        if (a || btn) inferred = (a || btn);
      }

      const node = el || inferred;
      if (!node) return;

      const type = node.getAttribute?.("data-analytics") || (node.tagName === "A" ? "link" : "button");
      const name = node.getAttribute?.("data-name") || (node.textContent || "").trim().slice(0, 80) || type;
      const component = node.getAttribute?.("data-component") || "unknown";
      const variant = node.getAttribute?.("data-variant") || "";
      const location = node.getAttribute?.("data-location") || "body";

      let outbound = "false";
      let link_url = "";

      if (node.tagName === "A") {
        const href = node.getAttribute("href") || "";
        outbound = isOutbound(href) ? "true" : "false";
        // normalise known schemes without leaking emails
        if (href.startsWith("mailto:")) {
          link_url = "mailto";
          outbound = "true";
        } else {
          link_url = cleanUrlForEvent(href);
        }
      }

      trackClick({
        item_name: name,
        component_name: component,
        variant,
        location,
        outbound,
        link_url,
      });
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // 3) Simple returning-user flag (session-scoped in memory)
  useEffect(() => {
    try {
      const KEY = "adc_seen";
      const seen = sessionStorage.getItem(KEY);
      if (!seen) {
        sessionStorage.setItem(KEY, "1");
        setReturningUser(false);
      } else {
        setReturningUser(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
