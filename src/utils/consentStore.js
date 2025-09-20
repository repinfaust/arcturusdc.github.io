const KEY = "adc_consent";

export function getConsent() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function setConsent({ analytics }) {
  const record = { analytics: !!analytics, ts: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(record));
  return record;
}
