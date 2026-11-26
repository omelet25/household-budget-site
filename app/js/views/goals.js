// Goals & bills view: savings goals with a way to add to them, the
// recurring bills with their next due dates, and the year-end outlook.

import { BILLS, GOALS, HOUSEHOLD } from "../data.js";
import {
  averageEssentialSpending,
  averageMonthlyNet,
  budgetFor,
  monthlyBillsTotal,
  upcomingBills,
} from "../calc.js";
import { dateFull, money, moneyWhole, percent } from "../format.js";
import { progressBar } from "../charts.js";

// Session-only goal top-ups, keyed by goal name.
const topUps = new Map();

export function renderGoals(el, state, refresh) {
  const bills = upcomingBills(13);
  const totalSaved = GOALS.reduce((s, g) => s + g.saved + (topUps.get(g.name) || 0), 0);
  const totalTarget = GOALS.reduce((s, g) => s + g.target, 0);
  const avgNet = averageMonthlyNet();
  const essential = averageEssentialSpending();
  const monthlySaving = budgetFor("Savings");
  const monthsCovered = essential > 0 ? GOALS[0].saved / essential : 0;
  const monthsLeft = 1; // December remains of 2026 after the Nov 25 ledger date.
  const projectedYearEnd = totalSaved + avgNet * monthsLeft;
  const paid = state.paidBills || new Set();
  state.paidBills = paid;

  el.innerHTML = `
  <section class="page-head">
    <div>
      <h1>Goals &amp; bills</h1>
      <p class="lede">What the household is saving for, and what is due next.
      ${moneyWhole(totalSaved)} saved toward ${moneyWhole(totalTarget)} of goals.</p>
    </div>
  </section>

  <section class="card">
    <h2>Savings goals</h2>
    <div class="goal-grid">
      ${GOALS.map((g) => {
        const saved = g.saved + (topUps.get(g.name) || 0);
        const left = Math.max(0, g.target - saved);
        const monthsToGo = monthlySaving > 0 && left > 0 ? Math.ceil(left / monthlySaving) : 0;
        return `
        <article class="goal-card">
          <h3>${g.name}</h3>
          <p class="card-note">${g.note}</p>
          <p class="goal-figures"><strong>${moneyWhole(saved)}</strong> of ${moneyWhole(g.target)}
          <span class="goal-pct">${percent(saved / g.target)}</span></p>
          ${progressBar(saved / g.target)}
          <p class="card-note">${left > 0
            ? `${moneyWhole(left)} to go — about ${monthsToGo} month${monthsToGo === 1 ? "" : "s"} at the ${moneyWhole(monthlySaving)} monthly savings transfer.`
            : "Goal reached — time to pick the next one."}</p>
          <form class="goal-add" data-goal="${g.name}">
            <label class="visually-hidden" for="add-${g.name}">Add to ${g.name}</label>
            <input type="number" id="add-${g.name}" name="amount" min="1" step="1" placeholder="$">
            <button type="submit" class="btn small">Add money</button>
          </form>
        </article>`;
      }).join("")}
    </div>
    <p class="card-note">Money added here moves the goal's bar for this visit only — it is a way to
    try out “what if we put $200 more in?”, not a bank transfer.</p>
  </section>

  <div class="dash-grid">
    <section class="card">
      <h2>Recurring bills</h2>
      <p class="card-note">${BILLS.length} bills repeat every month, ${money(monthlyBillsTotal())} in all.
      Marking one paid moves it to next month's list.</p>
      <table class="tx-table wide">
        <thead><tr><th>Bill</th><th>Category</th><th class="num">Amount</th><th>Next due</th><th></th></tr></thead>
        <tbody>
          ${bills.map((b) => {
            const isPaid = paid.has(b.name);
            return `
            <tr${isPaid ? ' class="paid-row"' : ""}>
              <td>${b.name}</td><td>${b.category}</td>
              <td class="num">${money(b.amount)}</td>
              <td>${isPaid ? "Paid — next month" : dateFull(b.due)}</td>
              <td class="num"><button type="button" class="btn small" data-bill="${b.name}" ${isPaid ? "disabled" : ""}>${isPaid ? "Paid ✓" : "Mark paid"}</button></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>The year ahead</h2>
      <p>After the November ledger closes on the 25th, one month of 2026 is left.</p>
      <ul class="outlook-list">
        <li><span>Average month leaves unspent</span><strong>${moneyWhole(avgNet)}</strong></li>
        <li><span>Expected 2026 year-end savings</span><strong>${moneyWhole(projectedYearEnd)}</strong></li>
        <li><span>Emergency fund covers</span><strong>${monthsCovered.toFixed(1)} months of essentials</strong></li>
        <li><span>Recurring bills each month</span><strong>${money(monthlyBillsTotal())}</strong></li>
      </ul>
      <p class="card-note">Essential spending averages about ${moneyWhole(essential)} a month, so the
      ${moneyWhole(GOALS[0].saved)} emergency fund is the household's safety net for roughly
      ${monthsCovered.toFixed(1)} months with no income at all. The plan for 2027 is to
      lift the emergency fund to its ${moneyWhole(GOALS[0].target)} target before the Hawaii trip.</p>
      <p class="card-note">Ledger date: ${dateFull(HOUSEHOLD.today)}. Bills marked paid reset when
      the page is reloaded.</p>
    </section>
  </div>`;

  el.querySelectorAll(".goal-add").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const amount = Number(new FormData(form).get("amount"));
      if (!(amount > 0)) return;
      const name = form.dataset.goal;
      topUps.set(name, (topUps.get(name) || 0) + amount);
      refresh();
    });
  });

  el.querySelectorAll("[data-bill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      paid.add(btn.dataset.bill);
      refresh();
    });
  });
}
