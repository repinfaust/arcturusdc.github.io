"use client";

/**
 * Small client-only button that opens the cookie preferences modal.
 * ConsentManager listens for the "adc:open-consent" event.
 */
export default function ConsentTrigger({
  className = "",
  children = "Cookie preferences",
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("adc:open-consent"))}
      className={className}
    >
      {children}
    </button>
  );
}
