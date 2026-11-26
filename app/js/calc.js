// Ledger math: every figure the site shows is computed here from data.js.
// Nothing on any page is a hand-typed total.

import {
  BILLS,
  BUDGET_OVERRIDES,
  CATEGORIES,
  EXTRA_TRANSACTIONS,
  HOUSEHOLD,
  INCOME_LABEL,
  MONTHS,
  TRANSACTIONS,
} from "./data.js";

export function allTransactions() {
  return TRANSACTIONS.concat(EXTRA_TRANSACTIONS);
}

export function monthOf(date) {
  return date.slice(0, 7);
}

export function transactionsForMonth(month) {
  return allTransactions()
    .filter((t) => monthOf(t[0]) === month)
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0));
}

export function budgetFor(categoryId) {
  if (Object.prototype.hasOwnProperty.call(BUDGET_OVERRIDES, categoryId)) {
    return BUDGET_OVERRIDES[categoryId];
  }
  const found = CATEGORIES.find((c) => c.id === categoryId);
  return found ? found.budget : 0;
}

export function categoryById(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId) || null;
}

export function totalBudget() {
  return CATEGORIES.reduce((sum, c) => sum + budgetFor(c.id), 0);
}

// One month, fully worked out: income, spending by category, savings, net.
export function monthSummary(month) {
  const rows = transactionsForMonth(month);
  let income = 0;
  let spending = 0;
  let saved = 0;
  const byCategory = new Map();
  for (const [date, category, , amount] of rows) {
    if (category === INCOME_LABEL) {
      income += amount;
      continue;
    }
    const spent = -amount;
    spending += spent;
    if (category === "Savings") saved += spent;
    byCategory.set(category, (byCategory.get(category) || 0) + spent);
  }
  const remaining = income - spending;
  const savingsRate = income > 0 ? saved / income : 0;
  return { month, rows, income, spending, saved, remaining, savingsRate, byCategory };
}

// Category rows for a month, richest first, with budget, remaining and share.
export function categoryRows(month) {
  const summary = monthSummary(month);
  const rows = CATEGORIES.map((c) => {
    const spent = summary.byCategory.get(c.id) || 0;
    const budget = budgetFor(c.id);
    return {
      id: c.id,
      kind: c.kind,
      color: c.color,
      spent,
      budget,
      remaining: budget - spent,
      used: budget > 0 ? spent / budget : 0,
      share: summary.spending > 0 ? spent / summary.spending : 0,
    };
  });
  rows.sort((a, b) => b.spent - a.spent);
  return rows;
}

// Every month's summary, oldest first, for trend charts and the outlook.
export function monthlySummaries() {
  return MONTHS.map((m) => monthSummary(m));
}

export function averageMonthlyNet() {
  const summaries = monthlySummaries();
  const total = summaries.reduce((sum, s) => sum + s.remaining, 0);
  return total / summaries.length;
}

export function averageMonthlySpending() {
  const summaries = monthlySummaries();
  const total = summaries.reduce((sum, s) => sum + s.spending, 0);
  return total / summaries.length;
}

// Essential monthly spending: the "need" categories, averaged over the ledger.
export function averageEssentialSpending() {
  const needIds = new Set(CATEGORIES.filter((c) => c.kind === "need").map((c) => c.id));
  let total = 0;
  for (const [date, category, , amount] of allTransactions()) {
    if (needIds.has(category) && amount < 0) total += -amount;
  }
  return total / MONTHS.length;
}

// The single biggest expense in a month.
export function biggestExpense(month) {
  const rows = transactionsForMonth(month).filter((t) => t[3] < 0);
  if (rows.length === 0) return null;
  return rows.reduce((big, t) => (t[3] < big[3] ? t : big), rows[0]);
}

// Plain-language findings for the reports page, computed from the ledger.
export function insights(month) {
  const summary = monthSummary(month);
  const rows = categoryRows(month);
  const found = [];
  const top = rows[0];
  if (top && top.spent > 0) {
    found.push({
      title: `${top.id} is the biggest slice`,
      body: `${top.id} took ${moneyWhole(top.spent)} of ${monthLabel(month)} spending, `
        + `${Math.round(top.share * 100)}% of everything the household spent.`,
    });
  }
  const over = rows.filter((r) => r.used > 1);
  if (over.length > 0) {
    const names = over.map((r) => `${r.id} (${moneyWhole(r.spent)} of a ${moneyWhole(r.budget)} budget)`).join(", ");
    found.push({
      title: `${over.length} categor${over.length === 1 ? "y" : "ies"} over budget`,
      body: `${names}. Shifting even half of the overrun back would free about `
        + `${moneyWhole(over.reduce((s, r) => s + (r.spent - r.budget), 0) / 2)} a month.`,
    });
  } else {
    found.push({
      title: "Every category stayed inside its budget",
      body: `No category went over its budget in ${monthLabel(month)}. `
        + "The tightest one is listed first in the table below.",
    });
  }
  const summaries = monthlySummaries();
  const best = summaries.reduce((a, b) => (b.savingsRate > a.savingsRate ? b : a), summaries[0]);
  found.push({
    title: `Best savings month: ${monthLabel(best.month)}`,
    body: `The household saved ${Math.round(best.savingsRate * 100)}% of its income in `
      + `${monthLabel(best.month)}, against ${Math.round(summary.savingsRate * 100)}% in ${monthLabel(month)}.`,
  });
  const avgNet = averageMonthlyNet();
  found.push({
    title: `Typical month leaves ${moneyWhole(avgNet)} unspent`,
    body: `Across the ${MONTHS.length} months in this ledger the household keeps about `
      + `${moneyWhole(avgNet)} a month after all spending, savings transfers included.`,
  });
  return found;
}

function moneyWhole(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function monthLabel(month) {
  const [year, m] = month.split("-").map(Number);
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[m - 1]} ${year}`;
}

// Next due date of each bill after the household's "today", nearest first.
export function upcomingBills(limit = 6) {
  const [ty, tm, td] = HOUSEHOLD.today.split("-").map(Number);
  const todayMs = Date.UTC(ty, tm - 1, td);
  const dated = BILLS.map((bill) => {
    let year = ty;
    let month = tm;
    if (bill.day <= td) month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const dueMs = Date.UTC(year, month - 1, bill.day);
    const daysAway = Math.round((dueMs - todayMs) / 86400000);
    const due = `${year}-${String(month).padStart(2, "0")}-${String(bill.day).padStart(2, "0")}`;
    return { ...bill, due, daysAway };
  });
  dated.sort((a, b) => a.daysAway - b.daysAway);
  return dated.slice(0, limit);
}

// Total of the recurring bills for one month, at their listed amounts.
export function monthlyBillsTotal() {
  return BILLS.reduce((sum, b) => sum + b.amount, 0);
}
