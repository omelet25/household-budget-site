// Hash router: one page, six views. Each link in the header is a real
// route, so every view is reachable and bookmarkable.

import { HOUSEHOLD } from "./data.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderTransactions } from "./views/transactions.js";
import { renderBudget } from "./views/budget.js";
import { renderReports } from "./views/reports.js";
import { renderGoals } from "./views/goals.js";
import { renderTools } from "./views/tools.js";

export const ROUTES = {
  dashboard: { hash: "#/dashboard", label: "Dashboard", render: renderDashboard },
  transactions: { hash: "#/transactions", label: "Transactions", render: renderTransactions },
  budget: { hash: "#/budget", label: "Budget", render: renderBudget },
  reports: { hash: "#/reports", label: "Reports", render: renderReports },
  goals: { hash: "#/goals", label: "Goals & Bills", render: renderGoals },
  tools: { hash: "#/tools", label: "Budget Tools", render: renderTools },
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

export function renderCurrent() {
  const key = routeFromHash();
  const view = document.getElementById("view");
  const route = ROUTES[key];
  view.innerHTML = "";
  route.render(view, state, renderCurrent);
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

export function startRouter() {
  window.addEventListener("hashchange", renderCurrent);
  renderCurrent();
}
