// Budget view: every category's monthly budget against what the household
// actually spent. Budgets are editable and the page re-works itself live.

import { BUDGET_OVERRIDES, CATEGORIES, MONTHS } from "../data.js";
import { categoryRows, monthSummary, totalBudget } from "../calc.js";
import { money, moneyWhole, monthLabel, percent } from "../format.js";

export function renderBudget(el, state, refresh) {
  const summary = monthSummary(state.month);
  const rows = categoryRows(state.month);
  const budgetTotal = totalBudget();
  const overCount = rows.filter((r) => r.used > 1).length;

  el.innerHTML = `
  <section class="page-head">
    <div>
      <h1>Budget</h1>
      <p class="lede">The plan for ${monthLabel(state.month)}: ${moneyWhole(budgetTotal)} a month across
      ${CATEGORIES.length} categories, ${moneyWhole(summary.spending)} actually spent.
      ${overCount === 0 ? "Nothing went over budget this month." : `${overCount} categor${overCount === 1 ? "y" : "ies"} went over budget.`}
      Change any budget below and the page updates at once.</p>
    </div>
    <div class="month-switch" role="group" aria-label="Change month">
      <label class="visually-hidden" for="budget-month">Month</label>
      <select id="budget-month">
        ${MONTHS.map((m) => `<option value="${m}"${m === state.month ? " selected" : ""}>${monthLabel(m)}</option>`).join("")}
      </select>
    </div>
  </section>

  <section class="card">
    <table class="budget-table">
      <thead>
        <tr><th>Category</th><th class="num">Monthly budget</th><th class="num">Spent</th><th class="num">Left</th><th>Used</th></tr>
      </thead>
      <tbody>
        ${rows.map((r) => `
          <tr${r.used > 1 ? ' class="over-row"' : ""}>
            <td><span class="chip" style="background:${r.color}"></span> ${r.id}</td>
            <td class="num"><label class="visually-hidden" for="budget-${r.id}">Budget for ${r.id}</label>
              <input type="number" id="budget-${r.id}" class="budget-input" data-category="${r.id}" value="${r.budget}" min="0" step="1"> </td>
            <td class="num">${money(r.spent)}</td>
            <td class="num ${r.remaining < 0 ? "out" : "in"}">${r.remaining < 0 ? "−" : ""}${money(Math.abs(r.remaining))}</td>
            <td class="used-cell">
              <span class="bar-track slim"><span class="bar-fill${r.used > 1 ? " over" : ""}" style="width:${Math.min(100, r.used * 100).toFixed(1)}%;background:${r.color}"></span></span>
              <span class="used-pct">${percent(r.used)}</span>
            </td>
          </tr>`).join("")}
      </tbody>
      <tfoot>
        <tr><th>Total</th><th class="num" id="budget-total">${money(budgetTotal)}</th>
        <th class="num">${money(summary.spending)}</th>
        <th class="num">${money(budgetTotal - summary.spending)}</th><th></th></tr>
      </tfoot>
    </table>
    <p class="card-note">Budgets you change here apply for this visit only and are kept on the page,
    not written back to the ledger. Use “Reset budgets” to go back to the plan.</p>
    <p><button type="button" class="btn secondary" id="budget-reset">Reset budgets</button>
    <span class="form-message" id="budget-message" role="status"></span></p>
  </section>

  <section class="card">
    <h2>How the plan is built</h2>
    <p>The Harper budget follows a simple rule: needs first, then wants, then savings.
    Housing, groceries, transport, utilities, insurance, health and school costs are needs;
    dining out, entertainment, clothing and the rest are wants; the $800 savings transfer is
    treated as a bill that gets paid on the 25th, before anything optional. When a category
    runs over, the dashboard flags it the same day the entry is added.</p>
  </section>`;

  el.querySelector("#budget-month").addEventListener("change", (e) => {
    state.month = e.target.value;
    refresh();
  });

  el.querySelectorAll(".budget-input").forEach((input) => {
    input.addEventListener("change", () => {
      const value = Number(input.value);
      const category = input.dataset.category;
      if (!(value >= 0)) {
        input.value = BUDGET_OVERRIDES[category] ?? "";
        return;
      }
      BUDGET_OVERRIDES[category] = value;
      refresh();
      const message = el.querySelector("#budget-message");
      if (message) message.textContent = `${category} budget set to ${moneyWhole(value)}.`;
    });
  });

  el.querySelector("#budget-reset").addEventListener("click", () => {
    for (const key of Object.keys(BUDGET_OVERRIDES)) delete BUDGET_OVERRIDES[key];
    refresh();
    const message = el.querySelector("#budget-message");
    if (message) message.textContent = "Budgets reset to the household plan.";
  });
}
