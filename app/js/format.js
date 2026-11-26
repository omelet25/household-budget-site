// Formatting helpers: money, dates and percentages, all in US English.

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dollarsWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const plainNumber = new Intl.NumberFormat("en-US");

export function money(amount) {
  return dollars.format(amount);
}

export function moneyWhole(amount) {
  return dollarsWhole.format(amount);
}

export function number(n) {
  return plainNumber.format(n);
}

// "2026-11" -> "November 2026"
export function monthLabel(month) {
  const [year, m] = month.split("-").map(Number);
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[m - 1]} ${year}`;
}

// "2026-11" -> "Nov 2026" (short form for chart labels)
export function monthShort(month) {
  const [year, m] = month.split("-").map(Number);
  const names = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${names[m - 1]} ${year}`;
}

// "2026-11-03" -> "Nov 3"
export function dateLabel(date) {
  const [, m, d] = date.split("-").map(Number);
  const names = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${names[m - 1]} ${d}`;
}

// "2026-11-03" -> "Nov 3, 2026"
export function dateFull(date) {
  const [y, m, d] = date.split("-").map(Number);
  const names = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${names[m - 1]} ${d}, ${y}`;
}

export function percent(ratio) {
  return `${Math.round(ratio * 100)}%`;
}

// Escape text that came from a form field before it is put into HTML.
export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
