// Dashboard view: this month at a glance — totals, budget pace,
// spending mix, recent transactions, goals and bills coming up.

import { HOUSEHOLD, MONTHS } from "../data.js";
import { GOALS } from "../data.js";
import {
  averageMonthlySpending,
  biggestExpense,
  categoryRows,
  monthSummary,
  upcomingBills,
} from "../calc.js";
import { dateLabel, money, moneyWhole, monthLabel, percent } from "../format.js";
import { donutChart, donutLegend, progressBar } from "../charts.js";

function monthStep(month, delta) {
  const index = MONTHS.indexOf(month) + delta;
  if (index < 0 || index >= MONTHS.length) return month;
  return MONTHS[index];
}

export function renderDashboard(el, state, refresh) {
  const summary = monthSummary(state.month);
  const rows = categoryRows(state.month);
  const topRows = rows.slice(0, 6);
  const topSegments = rows
    .filter((r) => r.spent > 0)
    .slice(0, 6)
    .map((r) => ({ label: r.id, value: r.spent, color: r.color }));
  const otherTotal = rows
    .filter((r) => r.spent > 0)
    .slice(6)
    .reduce((s, r) => s + r.spent, 0);
  if (otherTotal > 0) topSegments.push({ label: "Other", value: otherTotal, color: "#94a3b8" });
  const recent = summary.rows.slice(0, 7);
  const bills = upcomingBills(4);
  const biggest = biggestExpense(state.month);
  const avgSpending = averageMonthlySpending();
  const vsAverage = summary.spending - avgSpending;
  const atFirst = state.month === MONTHS[0];
  const atLast = state.month === MONTHS[MONTHS.length - 1];

  el.innerHTML = `
  <section class="page-head">
    <div>
      <h1>${monthLabel(state.month)}</h1>
      <p class="lede">Income, spending and savings for the Harper household.
      ${state.month === HOUSEHOLD.currentMonth ? "Ledger entries run through Nov 25, 2026." : "A closed month — every entry is in."}</p>
    </div>
    <div class="month-switch" role="group" aria-label="Change month">
      <button type="button" data-month-step="-1" ${atFirst ? "disabled" : ""} aria-label="Previous month">&larr; Prev</button>
      <span class="month-current">${monthLabel(state.month)}</span>
      <button type="button" data-month-step="1" ${atLast ? "disabled" : ""} aria-label="Next month">Next &rarr;</button>
    </div>
  </section>

  <section class="stat-grid" aria-label="Month totals">
    <div class="stat"><span class="stat-label">Income</span><span class="stat-value">${money(summary.income)}</span><span class="stat-note">2 paychecks each, plus interest</span></div>
    <div class="stat"><span class="stat-label">Spending</span><span class="stat-value">${money(summary.spending)}</span><span class="stat-note">Including ${money(summary.saved)} moved to savings</span></div>
    <div class="stat"><span class="stat-label">Left over</span><span class="stat-value">${money(summary.remaining)}</span><span class="stat-note">Income minus all spending</span></div>
    <div class="stat"><span class="stat-label">Saved</span><span class="stat-value">${money(summary.saved)}</span><span class="stat-note">${percent(summary.savingsRate)} of income this month</span></div>
  </section>
  <p class="month-compare">Spending this month is ${vsAverage <= 0 ? money(-vsAverage) + " below" : money(vsAverage) + " above"} the ${moneyWhole(avgSpending)} six-month average.</p>

  <div class="dash-grid">
    <section class="card">
      <h2>Budget at a glance</h2>
      <p class="card-note">The six biggest categories this month. Bars fill toward each monthly budget.</p>
      <ul class="budget-bars">
        ${topRows.map((r) => `
          <li>
            <span class="bar-head"><span>${r.id}</span><span>${moneyWhole(r.spent)} of ${moneyWhole(r.budget)}</span></span>
            <span class="bar-track"><span class="bar-fill${r.used > 1 ? " over" : ""}" style="width:${Math.min(100, r.used * 100).toFixed(1)}%;background:${r.color}"></span></span>
            <span class="bar-foot">${percent(r.used)} used &middot; ${r.remaining >= 0 ? moneyWhole(r.remaining) + " left" : moneyWhole(-r.remaining) + " over"}</span>
          </li>`).join("")}
      </ul>
      <p class="card-link"><a href="#/budget">See the full budget &rarr;</a></p>
    </section>

    <section class="card">
      <h2>Where the money went</h2>
      <div class="donut-wrap">
        <div class="donut">${donutChart(topSegments)}</div>
        <ul class="legend">${donutLegend(topSegments)}</ul>
      </div>
      ${biggest ? `<p class="card-note">Biggest single expense: <strong>${biggest[2]}</strong> — ${money(-biggest[3])} on ${dateLabel(biggest[0])}.</p>` : ""}
      <p class="card-link"><a href="#/reports">See reports and trends &rarr;</a></p>
    </section>
  </div>

  <div class="dash-grid">
    <section class="card">
      <h2>Recent transactions</h2>
      <table class="tx-table">
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th></tr></thead>
        <tbody>
          ${recent.map((t) => `
            <tr><td>${dateLabel(t[0])}</td><td>${t[2]}</td><td>${t[1]}</td>
            <td class="num ${t[3] >= 0 ? "in" : "out"}">${t[3] >= 0 ? "+" : ""}${money(t[3])}</td></tr>`).join("")}
        </tbody>
      </table>
      <p class="card-link"><a href="#/transactions">See all ${summary.rows.length} transactions &rarr;</a></p>
    </section>

    <div class="dash-side">
      <section class="card">
        <h2>Savings goals</h2>
        <ul class="goal-list">
          ${GOALS.slice(0, 3).map((g) => `
            <li>
              <span class="bar-head"><span>${g.name}</span><span>${moneyWhole(g.saved)} of ${moneyWhole(g.target)}</span></span>
              ${progressBar(g.saved / g.target)}
              <span class="bar-foot">${percent(g.saved / g.target)} there</span>
            </li>`).join("")}
        </ul>
        <p class="card-link"><a href="#/goals">All goals and bills &rarr;</a></p>
      </section>

      <section class="card">
        <h2>Bills coming up</h2>
        <ul class="bill-list">
          ${bills.map((b) => `
            <li><span class="bill-name">${b.name}</span>
            <span class="bill-due">${b.daysAway === 0 ? "Due today" : b.daysAway === 1 ? "Due tomorrow" : `Due in ${b.daysAway} days`}</span>
            <span class="bill-amount">${money(b.amount)}</span></li>`).join("")}
        </ul>
      </section>
    </div>
  </div>`;

  el.querySelectorAll("[data-month-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.month = monthStep(state.month, Number(btn.dataset.monthStep));
      refresh();
    });
  });
}
