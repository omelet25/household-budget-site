// Reports view: charts and findings — the six-month trend, this month's
// spending mix, the biggest categories and what the numbers suggest.

import { MONTHS } from "../data.js";
import { categoryRows, insights, monthlySummaries } from "../calc.js";
import { money, monthLabel, monthShort, percent } from "../format.js";
import { donutChart, donutLegend, trendChart } from "../charts.js";

export function renderReports(el, state, refresh) {
  const rows = categoryRows(state.month);
  const topSegments = rows
    .filter((r) => r.spent > 0)
    .slice(0, 7)
    .map((r) => ({ label: r.id, value: r.spent, color: r.color }));
  const otherTotal = rows
    .filter((r) => r.spent > 0)
    .slice(7)
    .reduce((s, r) => s + r.spent, 0);
  if (otherTotal > 0) topSegments.push({ label: "Other", value: otherTotal, color: "#94a3b8" });
  const trend = monthlySummaries().map((s) => ({
    label: monthShort(s.month),
    income: s.income,
    spending: s.spending,
  }));
  const findings = insights(state.month);
  const best = monthlySummaries().reduce((a, b) => (b.remaining > a.remaining ? b : a), monthlySummaries()[0]);

  el.innerHTML = `
  <section class="page-head">
    <div>
      <h1>Reports</h1>
      <p class="lede">Six months of the Harper ledger, drawn out. Pick a month to see its mix;
      the trend below always covers the whole ledger.</p>
    </div>
    <div class="month-switch" role="group" aria-label="Change month">
      <label class="visually-hidden" for="reports-month">Month</label>
      <select id="reports-month">
        ${MONTHS.map((m) => `<option value="${m}"${m === state.month ? " selected" : ""}>${monthLabel(m)}</option>`).join("")}
      </select>
    </div>
  </section>

  <section class="card">
    <h2>Income vs. spending — ${monthLabel(MONTHS[0])} to ${monthLabel(MONTHS[MONTHS.length - 1])}</h2>
    <div class="chart-legend"><span><span class="chip" style="background:#0f766e"></span> Income</span>
    <span><span class="chip" style="background:#d97706"></span> Spending</span></div>
    ${trendChart(trend)}
    <p class="card-note">The household's best month for money left over was ${monthLabel(best.month)}:
    ${money(best.remaining)} after all spending. Income is steady — two paychecks each — so the
    bars move with spending, not with pay.</p>
  </section>

  <div class="dash-grid">
    <section class="card">
      <h2>Spending mix — ${monthLabel(state.month)}</h2>
      <div class="donut-wrap">
        <div class="donut">${donutChart(topSegments)}</div>
        <ul class="legend">${donutLegend(topSegments)}</ul>
      </div>
    </section>

    <section class="card">
      <h2>Biggest categories — ${monthLabel(state.month)}</h2>
      <table class="tx-table">
        <thead><tr><th>Category</th><th class="num">Spent</th><th class="num">Share</th><th class="num">Budget</th></tr></thead>
        <tbody>
          ${rows.slice(0, 8).map((r) => `
            <tr><td><span class="chip" style="background:${r.color}"></span> ${r.id}</td>
            <td class="num">${money(r.spent)}</td><td class="num">${percent(r.share)}</td>
            <td class="num">${money(r.budget)}</td></tr>`).join("")}
        </tbody>
      </table>
      <p class="card-note">Housing is ${percent(rows.find((r) => r.id === "Housing").share)} of
      ${monthLabel(state.month)} spending; the next three categories together add
      ${percent(rows.slice(1, 4).reduce((s, r) => s + r.share, 0))}.</p>
    </section>
  </div>

  <section class="card">
    <h2>What the numbers say</h2>
    <ul class="findings">
      ${findings.map((f) => `<li><strong>${f.title}.</strong> ${f.body}</li>`).join("")}
    </ul>
    <p class="card-note">Every figure above is worked out from the same ledger entries as the
    dashboard and the budget pages, so the three pages can never disagree.</p>
  </section>`;

  el.querySelector("#reports-month").addEventListener("change", (e) => {
    state.month = e.target.value;
    refresh();
  });
}
