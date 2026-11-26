// Tools view: three calculators that all work from the household's own
// numbers — a budget simulator, the 50/30/20 check and an emergency fund
// planner. Every slider and input re-works its answer live.

import { CATEGORIES } from "../data.js";
import {
  averageEssentialSpending,
  averageMonthlyNet,
  categoryRows,
  monthSummary,
} from "../calc.js";
import { money, moneyWhole, monthLabel, percent } from "../format.js";
import { progressBar } from "../charts.js";

// Simulator defaults: this month's actual spending per group.
function simulatorDefaults(month) {
  const rows = categoryRows(month);
  const pick = (ids) => rows.filter((r) => ids.includes(r.id)).reduce((s, r) => s + r.spent, 0);
  return {
    income: monthSummary(month).income,
    housing: pick(["Housing"]),
    groceries: pick(["Groceries"]),
    transport: pick(["Transport", "Utilities", "Insurance"]),
    dining: pick(["Dining Out", "Entertainment"]),
    other: pick(CATEGORIES.map((c) => c.id).filter((id) => ![
      "Housing", "Groceries", "Transport", "Utilities", "Insurance",
      "Dining Out", "Entertainment", "Savings",
    ].includes(id))),
  };
}

export function renderTools(el, state, refresh) {
  const summary = monthSummary(state.month);
  const rows = categoryRows(state.month);
  const needs = rows.filter((r) => r.kind === "need").reduce((s, r) => s + r.spent, 0);
  const wants = rows.filter((r) => r.kind === "want").reduce((s, r) => s + r.spent, 0);
  const saved = summary.saved;
  const spent = summary.spending;
  const essential = averageEssentialSpending();
  // The simulator keeps the user's edits for the month it was started in,
  // but a new month starts from that month's real numbers, not the old
  // month's leftovers.
  if (!state.sim || state.simMonth !== state.month) {
    state.sim = simulatorDefaults(state.month);
    state.simMonth = state.month;
  }
  const sim = state.sim;

  const simSpending = sim.housing + sim.groceries + sim.transport + sim.dining + sim.other;
  const simLeft = sim.income - simSpending;
  const simRate = sim.income > 0 ? simLeft / sim.income : 0;

  el.innerHTML = `
  <section class="page-head">
    <div>
      <h1>Budget tools</h1>
      <p class="lede">Three calculators, all running on the Harper ledger. Move any number and
      the answer changes with it — nothing here is a picture of a result.</p>
    </div>
  </section>

  <section class="card">
    <h2>Monthly budget simulator</h2>
    <p class="card-note">Start from ${monthLabel(state.month)}'s real numbers, then try a different
    month. What would you keep if income dropped, or spending rose?</p>
    <div class="sim-grid">
      <div class="sim-inputs">
        ${[
          ["income", "Monthly income", 0, 12000],
          ["housing", "Housing", 0, 3000],
          ["groceries", "Groceries", 0, 1500],
          ["transport", "Transport, utilities & insurance", 0, 2500],
          ["dining", "Dining out & entertainment", 0, 1200],
          ["other", "Everything else", 0, 2000],
        ].map(([key, label, min, max]) => `
          <label class="sim-row"><span>${label}</span>
            <input type="range" data-sim="${key}" min="${min}" max="${max}" step="10" value="${Math.round(sim[key])}">
            <input type="number" data-sim-num="${key}" min="${min}" max="${max}" step="10" value="${Math.round(sim[key])}" aria-label="${label} in dollars">
          </label>`).join("")}
        <p><button type="button" class="btn secondary" id="sim-reset">Back to ${monthLabel(state.month)}'s real numbers</button></p>
      </div>
      <div class="sim-results" aria-live="polite">
        <p class="sim-big"><span>Money left each month</span><strong id="sim-left">${moneyWhole(simLeft)}</strong></p>
        <p class="sim-big"><span>Of income kept</span><strong id="sim-rate">${percent(simRate)}</strong></p>
        <p class="sim-big"><span>Kept over a year</span><strong id="sim-year">${moneyWhole(simLeft * 12)}</strong></p>
        ${progressBar(Math.max(0, Math.min(1, simRate)), simLeft >= 0 ? "#0f766e" : "#b91c1c")}
        <p class="card-note" id="sim-note">${simLeft >= 0
          ? `At this pace the household keeps ${moneyWhole(simLeft)} a month — enough to cover the $800 savings transfer and still have ${moneyWhole(simLeft - 800)} to spare.`
          : `This plan spends ${moneyWhole(-simLeft)} more than it brings in each month. Something above has to come down by at least that much.`}</p>
      </div>
    </div>
  </section>

  <div class="dash-grid">
    <section class="card">
      <h2>50 / 30 / 20 check — ${monthLabel(state.month)}</h2>
      <p class="card-note">The old rule of thumb: 50% of take-home pay for needs, 30% for wants,
      20% for savings. Here is how this month actually split.</p>
      <ul class="split-list">
        ${[
          ["Needs", needs, 0.5, "#0f766e"],
          ["Wants", wants, 0.3, "#d97706"],
          ["Savings", saved, 0.2, "#15803d"],
        ].map(([label, value, target, color]) => `
          <li>
            <span class="bar-head"><span>${label}</span><span>${moneyWhole(value)} — ${percent(spent > 0 ? value / summary.income : 0)} of income (target ${percent(target)})</span></span>
            ${progressBar(summary.income > 0 ? value / summary.income : 0, color)}
          </li>`).join("")}
      </ul>
      <p class="card-note">${needs / summary.income > 0.55
        ? "Needs run above 50% this month, mostly because the mortgage is fixed — the household makes room by keeping wants well under 30%."
        : "Needs sit inside the 50% guide this month, which leaves room for wants and savings alike."}</p>
    </section>

    <section class="card">
      <h2>Emergency fund planner</h2>
      <p class="card-note">Essentials average ${moneyWhole(essential)} a month across the ledger.
      How many months of that should the fund cover?</p>
      <form id="fund-form" class="fund-form">
        <label>Months of cover
          <select id="fund-months" name="months">
            ${[3, 4, 5, 6, 9, 12].map((n) => `<option value="${n}"${n === 6 ? " selected" : ""}>${n} months</option>`).join("")}
          </select>
        </label>
        <label>Already saved ($)
          <input type="number" id="fund-saved" name="saved" min="0" step="100" value="9200">
        </label>
        <label>Monthly saving toward it ($)
          <input type="number" id="fund-rate" name="rate" min="0" step="50" value="800">
        </label>
      </form>
      <ul class="outlook-list" aria-live="polite">
        <li><span>Fund target</span><strong id="fund-target">${moneyWhole(essential * 6)}</strong></li>
        <li><span>Still to save</span><strong id="fund-gap">${moneyWhole(Math.max(0, essential * 6 - 9200))}</strong></li>
        <li><span>Months to reach it</span><strong id="fund-time">${Math.max(0, essential * 6 - 9200) > 0 ? Math.ceil(Math.max(0, essential * 6 - 9200) / 800) + " months" : "Already there"}</strong></li>
        <li><span>Typical month leaves unspent</span><strong>${moneyWhole(averageMonthlyNet())}</strong></li>
      </ul>
    </section>
  </div>`;

  function syncSim() {
    const spendingNow = sim.housing + sim.groceries + sim.transport + sim.dining + sim.other;
    const left = sim.income - spendingNow;
    const rate = sim.income > 0 ? left / sim.income : 0;
    el.querySelector("#sim-left").textContent = moneyWhole(left);
    el.querySelector("#sim-rate").textContent = percent(rate);
    el.querySelector("#sim-year").textContent = moneyWhole(left * 12);
    el.querySelector("#sim-note").textContent = left >= 0
      ? `At this pace the household keeps ${moneyWhole(left)} a month — enough to cover the $800 savings transfer and still have ${moneyWhole(left - 800)} to spare.`
      : `This plan spends ${moneyWhole(-left)} more than it brings in each month. Something above has to come down by at least that much.`;
    const bar = el.querySelector(".sim-results .progress-fill");
    if (bar) {
      bar.style.width = `${(Math.max(0, Math.min(1, rate)) * 100).toFixed(1)}%`;
      bar.style.background = left >= 0 ? "#0f766e" : "#b91c1c";
    }
  }

  el.querySelectorAll("[data-sim]").forEach((slider) => {
    slider.addEventListener("input", () => {
      const key = slider.dataset.sim;
      sim[key] = Number(slider.value);
      const num = el.querySelector(`[data-sim-num="${key}"]`);
      if (num) num.value = slider.value;
      syncSim();
    });
  });
  el.querySelectorAll("[data-sim-num]").forEach((num) => {
    num.addEventListener("change", () => {
      const key = num.dataset.simNum;
      const value = Number(num.value);
      if (!(value >= 0)) {
        num.value = Math.round(sim[key]);
        return;
      }
      sim[key] = value;
      const slider = el.querySelector(`[data-sim="${key}"]`);
      if (slider) slider.value = Math.min(Number(slider.max), value);
      syncSim();
    });
  });
  el.querySelector("#sim-reset").addEventListener("click", () => {
    state.sim = simulatorDefaults(state.month);
    state.simMonth = state.month;
    refresh();
  });

  function syncFund() {
    const months = Number(el.querySelector("#fund-months").value);
    const savedNow = Number(el.querySelector("#fund-saved").value) || 0;
    const rate = Number(el.querySelector("#fund-rate").value) || 0;
    const target = essential * months;
    const gap = Math.max(0, target - savedNow);
    el.querySelector("#fund-target").textContent = moneyWhole(target);
    el.querySelector("#fund-gap").textContent = moneyWhole(gap);
    el.querySelector("#fund-time").textContent = gap <= 0
      ? "Already there"
      : rate > 0 ? `${Math.ceil(gap / rate)} months` : "Never — saving $0 a month";
  }
  el.querySelector("#fund-form").addEventListener("input", syncFund);
  el.querySelector("#fund-form").addEventListener("change", syncFund);
}
