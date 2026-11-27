// Hash router: one page, six views. Each link in the header is a real
// route, so every view is reachable and bookmarkable.
//
// View modules load lazily: a route's import() runs only when that route
// is first opened, so the first load carries just the dashboard view on
// top of the shared modules instead of all six views at once. Each
// import() names a real file in app/ with a full literal path, so the
// reference scan still resolves every module the router can load.
//
// Once a view module has loaded it is cached, and later renders of that
// route paint synchronously again — the views rely on refresh()
// re-rendering at once (a form handler sets its confirmation message on
// the freshly rendered page right after calling refresh()).

import { HOUSEHOLD } from "./data.js";

export const ROUTES = {
  dashboard: { hash: "#/dashboard", label: "Dashboard", load: () => import("./views/dashboard.js").then((m) => m.renderDashboard) },
  transactions: { hash: "#/transactions", label: "Transactions", load: () => import("./views/transactions.js").then((m) => m.renderTransactions) },
  budget: { hash: "#/budget", label: "Budget", load: () => import("./views/budget.js").then((m) => m.renderBudget) },
  reports: { hash: "#/reports", label: "Reports", load: () => import("./views/reports.js").then((m) => m.renderReports) },
  goals: { hash: "#/goals", label: "Goals & Bills", load: () => import("./views/goals.js").then((m) => m.renderGoals) },
  tools: { hash: "#/tools", label: "Budget Tools", load: () => import("./views/tools.js").then((m) => m.renderTools) },
};

export const state = {
  month: HOUSEHOLD.currentMonth,
  txFilter: null,
  sim: null,
  simMonth: null,
  paidBills: null,
};

function routeFromHash() {
  const hash = window.location.hash || "#/dashboard";
  const key = hash.replace(/^#\//, "").split("/")[0];
  return ROUTES[key] ? key : "dashboard";
}

// Render functions of the view modules loaded so far, by route key.
const loadedViews = {};

// Only the newest navigation may paint: if the reader moves on while a
// view module is still loading, the stale load is dropped instead of
// overwriting the route that is current by then.
let renderTicket = 0;

function paint(route, render) {
  const view = document.getElementById("view");
  view.innerHTML = "";
  render(view, state, renderCurrent);
  document.querySelectorAll(".nav-link").forEach((link) => {
    const isCurrent = link.getAttribute("href") === route.hash;
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  document.title = `${route.label} — HomeLedger`;
}

export function renderCurrent() {
  const ticket = ++renderTicket;
  const key = routeFromHash();
  const route = ROUTES[key];
  const cached = loadedViews[key];
  if (cached) {
    paint(route, cached);
    return;
  }
  route.load().then((render) => {
    loadedViews[key] = render;
    if (ticket === renderTicket) {
      paint(route, render);
    }
  });
}

export function startRouter() {
  window.addEventListener("hashchange", renderCurrent);
  renderCurrent();
}
