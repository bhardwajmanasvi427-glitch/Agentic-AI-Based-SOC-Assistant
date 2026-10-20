import { MIN, NOW, SEV, ago, fill } from './data.js';

/* ============ Helpers, icons, small components, charts ============ */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtTs = (t) => { const d = new Date(t); return `${pad(d.getDate())} ${MON[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtHM = (t) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const relTs = (t) => { const m = Math.max(0, Math.round((Date.now() - t) / MIN)); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const initials = (n) => n.split(' ').map((p) => p[0]).slice(0, 2).join('');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const ICONS = {
  shield: '<path d="M12 3l7.5 3v5.5c0 4.4-3.1 7.9-7.5 9.5-4.4-1.6-7.5-5.1-7.5-9.5V6z"/><path d="M9 12l2 2 4-4"/>',
  grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  bell: '<path d="M6 16v-5a6 6 0 1112 0v5l2 2H4zM10 21h4"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  scope: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  folder: '<path d="M3 6.5A1.5 1.5 0 014.5 5H9l2 2.5h8.5A1.5 1.5 0 0121 9v9.5a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5z"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5M16.5 5.3a3.2 3.2 0 010 5.8M18 14.8c1.8.7 2.8 2.4 3 5.2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  out: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  warn: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5h.01"/>',
  check: '<path d="M4.5 12.5l5 5L19.5 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chev: '<path d="M9 5.5l6.5 6.5L9 18.5"/>',
  chevd: '<path d="M5.5 9l6.5 6.5L18.5 9"/>',
  back: '<path d="M15 5.5L8.5 12l6.5 6.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeoff: '<path d="M3 3l18 18M10.3 5.7A9 9 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-3.2 3.9M6.4 7.7A16 16 0 002.5 12s3.5 6.5 9.5 6.5a9 9 0 004-1"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pulse: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
  server: '<rect x="3.5" y="4" width="17" height="6.5" rx="1.5"/><rect x="3.5" y="13.5" width="17" height="6.5" rx="1.5"/><path d="M7 7.2h.01M7 16.7h.01"/>',
  refresh: '<path d="M20 11a8 8 0 00-14.4-4.2L4 9M4 4v5h5M4 13a8 8 0 0014.4 4.2L20 15M20 20v-5h-5"/>',
  download: '<path d="M12 4v11M7.5 11L12 15.5 16.5 11M5 20h14"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  swap: '<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  file: '<path d="M6 3.5h8l4 4V20.5H6z"/><path d="M14 3.5v4h4M9 12h6M9 16h6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
};
const ic = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---- small components ---- */
const sevBadge = (s) => `<span class="sev sev-${s}"><i></i>${SEV[s].label}</span>`;
const STATUS_CLASS = { New: 'blue', Investigating: 'cyan', Escalated: 'orange', Contained: 'blue', Resolved: 'green', Dismissed: 'mute', Closed: 'mute', Approved: 'green', Executed: 'green', Suggested: 'ai', Healthy: 'green', Degraded: 'yellow', Error: 'red', Disconnected: 'mute', Active: 'green', Disabled: 'mute' };
const pill = (s) => `<span class="pill pill-${STATUS_CLASS[s] || 'mute'}">${esc(s)}</span>`;
const aiTag = (t) => `<span class="ai-tag">${t || 'AI suggestion'}</span>`;
const confBar = (c) => `<span class="conf" title="Model confidence ${c}%"><span class="conf-bar"><i style="width:${c}%"></i></span><b>${c}%</b></span>`;
const avatar = (n) => `<span class="avatar" aria-hidden="true">${esc(initials(n))}</span>`;
const dot = (st) => `<i class="hdot hdot-${st}" aria-hidden="true"></i>`;
const banner = (kind, html, actions) => `<div class="banner banner-${kind}" role="${kind === 'error' ? 'alert' : 'status'}">${ic(kind === 'success' ? 'check' : kind === 'error' ? 'warn' : kind === 'warn' ? 'warn' : 'info')}<div class="banner-body">${html}</div>${actions || ''}</div>`;
const empty = (icon, title, text, btn) => `<div class="empty">${ic(icon)}<h3>${title}</h3><p>${text}</p>${btn || ''}</div>`;
const demoNote = () => `<span class="demo-pill" title="All data in this prototype is fictional">Demo data</span>`;

function skeleton(kind) {
  const b = (w, h) => `<span class="sk" style="width:${w};height:${h}"></span>`;
  if (kind === 'table') return `<div class="sk-wrap" role="status" aria-label="Loading alerts">${Array.from({ length: 7 }, () => `<div class="sk-row">${b('9%', '14px')}${b('34%', '14px')}${b('8%', '14px')}${b('12%', '14px')}${b('12%', '14px')}</div>`).join('')}</div>`;
  return `<div class="sk-wrap" role="status" aria-label="Loading"><div class="grid g4">${Array.from({ length: 4 }, () => `<div class="card">${b('50%', '12px')}${b('35%', '28px')}${b('70%', '12px')}</div>`).join('')}</div><div class="grid g2">${Array.from({ length: 2 }, () => `<div class="card">${b('40%', '14px')}${b('100%', '150px')}</div>`).join('')}</div></div>`;
}

/* ---- charts (hand drawn SVG, one scale per chart) ---- */
let chartSeq = 0;
function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
const kfmt = (v) => (v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : String(v));

const NICE = [1, 2, 4, 8, 10];
function niceMax2(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (NICE.find((q) => n <= q) || 10) * p; }
const AX = { L: 46, R: 12, T: 24, B: 40 };
function axes(W, H, mx, o) {
  const { L, R, T, B } = AX, ih = H - T - B, Y = (v) => T + ih - (v / mx) * ih;
  const grid = [0, 0.5, 1].map((f) => `<line x1="${L}" x2="${W - R}" y1="${Y(mx * f)}" y2="${Y(mx * f)}" class="ch-grid"/><text x="${L - 7}" y="${Y(mx * f) + 4}" class="ch-t" text-anchor="end">${kfmt(mx * f)}</text>`).join('');
  return grid + `<text x="${L}" y="11" class="ch-t ch-ax">${esc(o.y || '')}</text><text x="${(L + W - R) / 2}" y="${H - 3}" class="ch-t ch-ax" text-anchor="middle">${esc(o.x || '')}</text>`;
}
function lineChart(vals, labels, o) {
  o = o || {};
  const W = 640, H = o.h || 200, { L, R, T, B } = AX, iw = W - L - R, ih = H - T - B;
  const mx = niceMax2(Math.max.apply(null, vals) * 1.05), n = vals.length;
  const X = (i) => L + (i * iw) / (n - 1), Y = (v) => T + ih - (v / mx) * ih, col = o.color || 'var(--cyan)';
  const pts = vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`), step = Math.ceil(n / 6);
  const xl = labels.map((l, i) => (i % step === 0 ? `<text x="${X(i)}" y="${H - 18}" class="ch-t" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(l)}</text>` : '')).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'Line chart')}">${axes(W, H, mx, o)}<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1.75" stroke-linejoin="round"/><circle cx="${X(n - 1)}" cy="${Y(vals[n - 1])}" r="3" fill="${col}"/>${xl}</svg>`;
}
function stackedBars(labels, ser, o) {
  o = o || {};
  const W = 640, H = o.h || 200, { L, R, T, B } = AX, iw = W - L - R, ih = H - T - B, n = labels.length;
  const totals = labels.map((_, i) => ser.reduce((s, x) => s + x.vals[i], 0));
  const mx = niceMax2(Math.max.apply(null, totals) * 1.05), bw = Math.min(40, (iw / n) * 0.6), Y = (v) => T + ih - (v / mx) * ih, step = Math.ceil(n / 8);
  const bars = labels.map((l, i) => {
    const cx = L + (i + 0.5) * (iw / n); let acc = 0;
    const segs = ser.map((s) => { const v = s.vals[i]; const y0 = Y(acc + v), h = Y(acc) - y0; acc += v; return h > 0 ? `<rect x="${cx - bw / 2}" y="${y0}" width="${bw}" height="${Math.max(h - 1, 0.5)}" fill="${s.color}"/>` : ''; }).join('');
    return segs + (i % step === 0 ? `<text x="${cx}" y="${H - 18}" class="ch-t" text-anchor="middle">${esc(l)}</text>` : '');
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'Stacked bar chart')}">${axes(W, H, mx, o)}${bars}</svg>`;
}

function donut(items) {
  const total = items.reduce((s, x) => s + x.n, 0) || 1, r = 52, C = 2 * Math.PI * r; let off = 0;
  const arcs = items.map((x) => { const len = (x.n / total) * C; const el = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${x.color}" stroke-width="16" stroke-dasharray="${Math.max(len - 2, 0)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`; off += len; return el; }).join('');
  return `<svg class="donut" viewBox="0 0 140 140" role="img" aria-label="Open alerts by severity"><circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--line)" stroke-width="16"/>${arcs}<text x="70" y="68" text-anchor="middle" class="dn-n">${total}</text><text x="70" y="86" text-anchor="middle" class="ch-t">open alerts</text></svg>`;
}
const hbar = (label, pct, tone, right) => `<div class="hb"><div class="hb-top"><span>${label}</span><b>${right || pct + '%'}</b></div><div class="hb-track"><i class="tone-${tone || 'cyan'}" style="width:${pct}%"></i></div></div>`;
const hourLabels = () => Array.from({ length: 24 }, (_, i) => pad(new Date(NOW - (23 - i) * 3600000).getHours()) + ':00');
const dayLabels = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(NOW - (n - 1 - i) * 86400000); return `${d.getDate()} ${MON[d.getMonth()]}`; });
const SEV_COLOR = { critical: 'var(--crit)', high: 'var(--high)', medium: 'var(--med)', low: 'var(--low)' };

export { esc, pad, MON, fmtTs, fmtHM, relTs, initials, plural, ICONS, ic, sevBadge, STATUS_CLASS, pill, aiTag, confBar, avatar, dot, banner, empty, demoNote, skeleton, niceMax, kfmt, NICE, niceMax2, AX, axes, lineChart, stackedBars, donut, hbar, hourLabels, dayLabels, SEV_COLOR };
