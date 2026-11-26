// Transactions view: the full ledger for one month, with filters and a
// form that adds a transaction to this session's ledger.

import { CATEGORIES, EXTRA_TRANSACTIONS, INCOME_LABEL, MONTHS } from "../data.js";
import { monthSummary, transactionsForMonth } from "../calc.js";
import { dateLabel, escapeHtml, money, monthLabel } from "../format.js";

const ALL_CATEGORIES = "All categories";

export function renderTransactions(el, state, refresh) {
  if (!state.txFilter) state.txFilter = { category: ALL_CATEGORIES, search: "" };
  const filter = state.txFilter;
  const summary = monthSummary(state.month);
  let rows = transactionsForMonth(state.month);
  if (filter.category !== ALL_CATEGORIES) {
    rows = rows.filter((t) => t[1] === filter.category);
  }
  if (filter.search.trim() !== "") {
    const needle = filter.search.trim().toLowerCase();
    rows = rows.filter((t) => t[2].toLowerCase().includes(needle) || t[1].toLowerCase().includes(needle));
  }
  const shownIncome = rows.filter((t) => t[3] > 0).reduce((s, t) => s + t[3], 0);
  const shownSpending = rows.filter((t) => t[3] < 0).reduce((s, t) => s + -t[3], 0);
  const categories = [INCOME_LABEL].concat(CATEGORIES.map((c) => c.id));

  el.innerHTML = `
  <section class="page-head">
    <div>
      <h1>Transactions</h1>
      <p class="lede">Every dollar in and out of the household, straight from the ledger.
      Adding a transaction updates the totals below at once.</p>
    </div>
  </section>

  <section class="card filter-bar">
    <label>Month
      <select id="tx-month">
        ${MONTHS.map((m) => `<option value="${m}"${m === state.month ? " selected" : ""}>${monthLabel(m)}</option>`).join("")}
      </select>
    </label>
    <label>Category
      <select id="tx-category">
        <option${filter.category === ALL_CATEGORIES ? " selected" : ""}>${ALL_CATEGORIES}</option>
        ${categories.map((c) => `<option${c === filter.category ? " selected" : ""}>${c}</option>`).join("")}
      </select>
    </label>
    <label class="search-label">Search
      <input type="search" id="tx-search" placeholder="Try “GreenMart” or “paycheck”" value="${escapeHtml(filter.search)}">
    </label>
    <span class="filter-count">${rows.length} of ${summary.rows.length} transactions</span>
  </section>

  <section class="card">
    <div class="tx-totals">
      <span>Income shown: <strong>${money(shownIncome)}</strong></span>
      <span>Spending shown: <strong>${money(shownSpending)}</strong></span>
      <span>Net shown: <strong>${money(shownIncome - shownSpending)}</strong></span>
    </div>
    <table class="tx-table wide">
      <thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th><th aria-label="Remove"></th></tr></thead>
      <tbody>
        ${rows.length === 0
          ? `<tr><td colspan="5" class="empty-row">No transactions match those filters. Try another month or category.</td></tr>`
          : rows.map((t, i) => `
            <tr><td>${dateLabel(t[0])}</td><td>${escapeHtml(t[2])}</td><td>${t[1]}</td>
            <td class="num ${t[3] >= 0 ? "in" : "out"}">${t[3] >= 0 ? "+" : ""}${money(t[3])}</td>
            <td class="num"><button type="button" class="row-remove" data-tx-date="${t[0]}" data-tx-desc="${escapeHtml(t[2])}" aria-label="Remove ${escapeHtml(t[2])}">&times;</button></td></tr>`).join("")}
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2>Add a transaction</h2>
    <p class="card-note">It joins this month's ledger right away and every total on the site updates.
    Added entries last for this visit only.</p>
    <form id="tx-add" class="add-form">
      <label>Date <input type="date" name="date" value="${state.month}-25" min="${state.month}-01" max="${state.month}-28" required></label>
      <label>Description <input type="text" name="description" maxlength="80" placeholder="What was it for?" required></label>
      <label>Category
        <select name="category">
          ${categories.map((c) => `<option>${c}</option>`).join("")}
        </select>
      </label>
      <label>Amount ($) <input type="number" name="amount" min="0.01" step="0.01" placeholder="0.00" required></label>
      <label>Type
        <select name="kind">
          <option value="expense">Spending</option>
          <option value="income">Income</option>
        </select>
      </label>
      <button type="submit" class="btn">Add transaction</button>
      <p class="form-message" id="tx-message" role="status"></p>
    </form>
  </section>`;

  el.querySelector("#tx-month").addEventListener("change", (e) => {
    state.month = e.target.value;
    refresh();
  });
  el.querySelector("#tx-category").addEventListener("change", (e) => {
    filter.category = e.target.value;
    refresh();
  });
  el.querySelector("#tx-search").addEventListener("input", (e) => {
    filter.search = e.target.value;
    const count = el.querySelector(".filter-count");
    // Live-filter without a full re-render so typing never loses focus.
    const needle = filter.search.trim().toLowerCase();
    let visible = transactionsForMonth(state.month);
    if (filter.category !== ALL_CATEGORIES) visible = visible.filter((t) => t[1] === filter.category);
    if (needle !== "") {
      visible = visible.filter((t) => t[2].toLowerCase().includes(needle) || t[1].toLowerCase().includes(needle));
    }
    const tbody = el.querySelector("tbody");
    const shownIncomeNow = visible.filter((t) => t[3] > 0).reduce((s, t) => s + t[3], 0);
    const shownSpendingNow = visible.filter((t) => t[3] < 0).reduce((s, t) => s + -t[3], 0);
    tbody.innerHTML = visible.length === 0
      ? `<tr><td colspan="5" class="empty-row">No transactions match those filters. Try another month or category.</td></tr>`
      : visible.map((t) => `
        <tr><td>${dateLabel(t[0])}</td><td>${escapeHtml(t[2])}</td><td>${t[1]}</td>
        <td class="num ${t[3] >= 0 ? "in" : "out"}">${t[3] >= 0 ? "+" : ""}${money(t[3])}</td>
        <td class="num"><button type="button" class="row-remove" data-tx-date="${t[0]}" data-tx-desc="${escapeHtml(t[2])}" aria-label="Remove ${escapeHtml(t[2])}">&times;</button></td></tr>`).join("");
    el.querySelector(".tx-totals").innerHTML =
      `<span>Income shown: <strong>${money(shownIncomeNow)}</strong></span>`
      + `<span>Spending shown: <strong>${money(shownSpendingNow)}</strong></span>`
      + `<span>Net shown: <strong>${money(shownIncomeNow - shownSpendingNow)}</strong></span>`;
    count.textContent = `${visible.length} of ${summary.rows.length} transactions`;
    bindRemovals();
  });

  function bindRemovals() {
    el.querySelectorAll(".row-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const date = btn.dataset.txDate || null;
        const desc = btn.dataset.txDesc || null;
        // Only session-added entries can be removed; ledger entries stay put.
        const idx = EXTRA_TRANSACTIONS.findIndex((t) => t[0] === date && t[2] === desc);
        if (idx >= 0) {
          EXTRA_TRANSACTIONS.splice(idx, 1);
          refresh();
        } else {
          btn.disabled = true;
          btn.textContent = "—";
          btn.title = "Ledger entries are permanent; only entries you add can be removed.";
        }
      });
    });
  }
  bindRemovals();

  el.querySelector("#tx-add").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const date = String(data.get("date"));
    const description = String(data.get("description")).trim();
    const category = String(data.get("category"));
    const amount = Number(data.get("amount"));
    const kind = String(data.get("kind"));
    const message = el.querySelector("#tx-message");
    if (!description || !(amount > 0)) {
      message.textContent = "Please fill in a description and an amount above zero.";
      return;
    }
    const signed = kind === "income" ? amount : -amount;
    const entryCategory = kind === "income" ? INCOME_LABEL : category;
    EXTRA_TRANSACTIONS.push([date, entryCategory, description, signed]);
    state.month = date.slice(0, 7);
    message.textContent = `Added ${description} — ${money(signed)}.`;
    refresh();
    const after = el.querySelector("#tx-message");
    if (after) after.textContent = `Added ${description} — ${money(signed)}.`;
  });
}
