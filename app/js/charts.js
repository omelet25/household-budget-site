// Hand-drawn SVG charts: a spending donut, horizontal budget bars and a
// monthly income-versus-spending trend chart. No chart library, no images.

import { moneyWhole, percent } from "./format.js";

function polar(cx, cy, radius, angleDeg) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function arcPath(cx, cy, radius, startAngle, endAngle) {
  const [sx, sy] = polar(cx, cy, radius, startAngle);
  const [ex, ey] = polar(cx, cy, radius, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${radius} ${radius} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

// Donut of category spending. segments: [{label, value, color}].
export function donutChart(segments, size = 220) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 14;
  const inner = radius - 34;
  if (total <= 0) {
    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="No spending in this month">`
      + `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#e5e0d5" stroke-width="34"/>`
      + `<text x="${cx}" y="${cy}" text-anchor="middle" font-size="15" fill="#5b6670">No spending</text></svg>`;
  }
  let angle = 0;
  let paths = "";
  for (const seg of segments) {
    const sweep = (seg.value / total) * 360;
    if (sweep <= 0) continue;
    if (sweep >= 359.9) {
      paths += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${seg.color}" stroke-width="34"/>`;
    } else {
      paths += `<path d="${arcPath(cx, cy, radius, angle, angle + sweep)}" fill="none" stroke="${seg.color}" stroke-width="34"/>`;
    }
    angle += sweep;
  }
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Spending by category">`
    + paths
    + `<circle cx="${cx}" cy="${cy}" r="${inner}" fill="#fffdf9"/>`
    + `<text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="21" font-weight="700" fill="#1e2a24">${moneyWhole(total)}</text>`
    + `<text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="12" fill="#5b6670">spent this month</text></svg>`;
}

// Legend rows for a donut: color chip, name, amount, share.
export function donutLegend(segments) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  return segments
    .map(
      (seg) => `<li><span class="chip" style="background:${seg.color}"></span>`
        + `<span class="legend-name">${seg.label}</span>`
        + `<span class="legend-value">${moneyWhole(seg.value)}</span>`
        + `<span class="legend-share">${total > 0 ? percent(seg.value / total) : "0%"}</span></li>`,
    )
    .join("");
}

// Horizontal bars: [{label, value, max, color, note}]
export function barList(rows) {
  return rows
    .map((row) => {
      const width = row.max > 0 ? Math.min(100, (row.value / row.max) * 100) : 0;
      const over = row.value > row.max;
      return `<li class="bar-row${over ? " over" : ""}">`
        + `<span class="bar-label">${row.label}</span>`
        + `<span class="bar-track"><span class="bar-fill" style="width:${width.toFixed(1)}%;background:${row.color}"></span></span>`
        + `<span class="bar-value">${moneyWhole(row.value)}</span>`
        + `<span class="bar-note">${row.note}</span></li>`;
    })
    .join("");
}

// Grouped bars: income (teal) vs spending (amber) for each month.
// months: [{label, income, spending}]
export function trendChart(months, width = 640, height = 260) {
  const padLeft = 56;
  const padBottom = 28;
  const padTop = 14;
  const plotW = width - padLeft - 12;
  const plotH = height - padTop - padBottom;
  const max = Math.max(...months.flatMap((m) => [m.income, m.spending]), 1);
  const niceMax = Math.ceil(max / 2000) * 2000;
  const slot = plotW / months.length;
  const barW = Math.min(30, slot / 3);
  let grid = "";
  for (let g = 0; g <= 4; g += 1) {
    const y = padTop + plotH - (plotH * g) / 4;
    const value = (niceMax * g) / 4;
    grid += `<line x1="${padLeft}" y1="${y}" x2="${width - 12}" y2="${y}" stroke="#e5e0d5" stroke-width="1"/>`
      + `<text x="${padLeft - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#5b6670">$${Math.round(value / 1000)}k</text>`;
  }
  let bars = "";
  months.forEach((m, i) => {
    const x = padLeft + slot * i + slot / 2;
    const incomeH = (m.income / niceMax) * plotH;
    const spendH = (m.spending / niceMax) * plotH;
    bars += `<rect x="${(x - barW - 3).toFixed(1)}" y="${(padTop + plotH - incomeH).toFixed(1)}" width="${barW}" height="${incomeH.toFixed(1)}" fill="#0f766e" rx="2"><title>${m.label} income ${moneyWhole(m.income)}</title></rect>`;
    bars += `<rect x="${(x + 3).toFixed(1)}" y="${(padTop + plotH - spendH).toFixed(1)}" width="${barW}" height="${spendH.toFixed(1)}" fill="#d97706" rx="2"><title>${m.label} spending ${moneyWhole(m.spending)}</title></rect>`;
    bars += `<text x="${x.toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="12" fill="#37413b">${m.label}</text>`;
  });
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly income versus spending">${grid}${bars}</svg>`;
}

// A single progress bar with a label, used for savings goals.
export function progressBar(fraction, color = "#0f766e") {
  const width = Math.max(0, Math.min(100, fraction * 100));
  return `<span class="progress-track"><span class="progress-fill" style="width:${width.toFixed(1)}%;background:${color}"></span></span>`;
}
