import { ACTIONS, ALERTS, ALERT_STATUS, ANALYSTS, AUDIT, COVERAGE, DATA_SOURCES, HANDOFFS, INCIDENTS, INC_STATUS, NOTIFS, NOW, PROC_ERRORS, REQUESTS, ROLES, RULES, SAVED_REPORTS, SETTINGS, SEV, SOURCES, SYSTEM_HEALTH, USERS, ago, detailFor, series } from './data.js';
import { state } from './state.js';
import { MON, SEV_COLOR, aiTag, avatar, banner, confBar, dayLabels, demoNote, dot, empty, esc, fmtHM, fmtTs, hbar, hourLabels, ic, lineChart, pad, pill, plural, relTs, sevBadge, skeleton, stackedBars } from './ui.js';

/* ============ Screens ============ */
const getAlert = (id) => ALERTS.find((a) => a.id === id);
const getInc = (id) => INCIDENTS.find((i) => i.id === id);
const perms = () => ROLES[state.user.role].can;
const isDone = (s) => s === 'Resolved' || s === 'Dismissed' || s === 'Closed';
const openAlerts = () => ALERTS.filter((a) => !isDone(a.status));
const openIncs = () => INCIDENTS.filter((i) => !isDone(i.status));
const attr = (a, b) => `data-a="${esc(a == null ? '' : a)}" data-b="${esc(b == null ? '' : b)}"`;
const btn = (label, action, a, b, cls, extra) => `<button type="button" class="btn ${cls || ''}" data-action="${action}" ${attr(a, b)} ${extra || ''}>${label}</button>`;

const NAV = [
  { k: 'overview', label: 'Overview', icon: 'grid', title: 'Overview' },
  { k: 'alerts', label: 'Alert Queue', icon: 'list', title: 'Alert Queue' },
  { k: 'investigation', label: 'Investigation', icon: 'scope', title: 'Alert Investigation' },
  { k: 'incidents', label: 'Incident Workspace', icon: 'folder', title: 'Incident Workspace' },
  { k: 'reports', label: 'Reports & History', icon: 'chart', title: 'Reports & History' },
  { k: 'admin', label: 'Administration', icon: 'gear', title: 'Administration' },
];
function access(k) {
  const c = perms();
  return k === 'overview' || k === 'reports' ? true : k === 'alerts' || k === 'investigation' ? !!c.alerts : k === 'incidents' ? !!c.incidents : !!c.admin;
}

/* ---------- login ---------- */
function loginScreen() {
  const L = state.login, role = ROLES[L.role];
  return `<div class="login">
  <section class="login-brand">
    <div class="brand"><span class="brand-mark">SA</span><div><b>SOC Assistant</b><small>Security operations console</small></div></div>
    <h1>Triage, investigate and respond from one console.</h1>
    <p>The assistant collects and correlates security events, explains its reasoning and recommends response actions. An analyst reviews the evidence and decides what happens.</p>
    <ul class="login-points">
      <li>AI suggestions are labelled and kept apart from approved actions.</li>
      <li>Each role sees only the screens and controls it needs.</li>
      <li>${demoNote()} All data is fictional and stays in your browser.</li>
    </ul>
  </section>
  <form class="login-card card" data-form="signin" novalidate>
    <h2>Sign in</h2>
    <div class="field"><label for="lg-role">User / Role</label>
      <select id="lg-role" data-bind="login.role" aria-describedby="lg-role-msg" ${L.err.role ? 'aria-invalid="true"' : ''}>
        <option value="">Select a role</option>
        ${Object.keys(ROLES).map((r) => `<option ${L.role === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}
      </select>
      <p class="${L.err.role ? 'err' : 'hint'}" id="lg-role-msg" aria-live="polite">${L.err.role ? ic('warn') + esc(L.err.role) : role ? esc(role.blurb) : 'Choose the role you want to demonstrate.'}</p>
    </div>
    <div class="field"><label for="lg-pw">Password</label>
      <div class="pw"><input id="lg-pw" type="${L.show ? 'text' : 'password'}" autocomplete="off" value="${esc(L.pw)}" data-bind="login.pw" aria-describedby="lg-pw-msg" ${L.err.pw ? 'aria-invalid="true"' : ''}>
        <button type="button" class="icon-btn" data-action="toggle-pw" aria-label="${L.show ? 'Hide password' : 'Show password'}" aria-pressed="${L.show}">${ic(L.show ? 'eyeoff' : 'eye')}</button></div>
      <p class="${L.err.pw ? 'err' : 'hint'}" id="lg-pw-msg" aria-live="polite">${L.err.pw ? ic('warn') + esc(L.err.pw) : 'Demo password: 1234'}</p>
    </div>
    <button class="btn pri wide" type="submit" ${L.busy ? 'disabled' : ''}>${L.busy ? 'Signing in…' : 'Sign in'}</button>
  </form></div>`;
}

/* ---------- shell ---------- */
function shell() {
  const role = state.user.role, nav = NAV.find((n) => n.k === state.screen) || NAV[0];
  const unread = NOTIFS.filter((n) => !n.read).length;
  const navHtml = NAV.map((n) => { const ok = access(n.k); return `<button type="button" class="nav-i ${state.screen === n.k ? 'on' : ''} ${ok ? '' : 'locked'}" data-action="nav" ${attr(n.k)} ${state.screen === n.k ? 'aria-current="page"' : ''}>${ic(n.icon)}<span>${n.label}</span>${ok ? '' : ic('lock', 'lk')}</button>`; }).join('');
  const userMenu = state.menu === 'user' ? `<div class="pop pop-user" role="menu"><p class="pop-h">Switch role (demo)</p>${Object.keys(ROLES).map((r) => `<button type="button" role="menuitem" class="pop-i ${r === role ? 'on' : ''}" data-action="switch-role" ${attr(r)}>${avatar(ROLES[r].person)}<span><b>${esc(r)}</b><small>${esc(ROLES[r].person)}</small></span>${r === role ? ic('check') : ''}</button>`).join('')}<hr><button type="button" role="menuitem" class="pop-i" data-action="signout">${ic('out')}<span><b>Sign out</b></span></button></div>` : '';
  const notifMenu = state.menu === 'notif' ? `<div class="pop pop-notif" role="menu"><p class="pop-h">Notifications</p>${NOTIFS.map((n) => `<button type="button" role="menuitem" class="pop-i ${n.read ? '' : 'unread'}" data-action="open-notif" ${attr(n.id)}><span><b>${esc(n.text)}</b><small>${relTs(ago(n.min))}</small></span></button>`).join('')}</div>` : '';
  return `<div class="shell ${state.navOpen ? 'nav-open' : ''}">
  <aside class="side" aria-label="Main navigation">
    <div class="brand"><span class="brand-mark">SA</span><div><b>SOC Assistant</b><small>Operations console</small></div></div>
    <div class="who">${avatar(ROLES[role].person)}<span><b>${esc(ROLES[role].person)}</b><small>${esc(role)}</small></span></div>
    <nav class="nav" aria-label="Screens">${navHtml}</nav>
    <div class="side-foot"><button type="button" class="btn ghost wide" data-action="menu" ${attr('user')}>${ic('swap')}Switch role</button><button type="button" class="btn ghost wide" data-action="signout">${ic('out')}Sign out</button><p>Prototype with fictional data. No real systems are connected.</p></div>
  </aside>
  <div class="scrim" data-action="nav-toggle"></div>
  <div class="main">
    <header class="top">
      <button type="button" class="icon-btn menu-btn" data-action="nav-toggle" aria-label="Open navigation">${ic('menu')}</button>
      <h1 class="top-t">${nav.title}</h1>
      <label class="gsearch"><span class="sr">Search alerts</span>${ic('search')}<input id="gs-q" type="search" placeholder="Search alerts, hosts, IDs" value="${esc(state.gq)}" data-bind="gq" ${perms().alerts ? '' : 'disabled title="Your role cannot search alerts"'}></label>
      ${demoNote()}
      <div class="top-r">
        <button type="button" class="icon-btn" data-action="menu" ${attr('notif')} aria-label="Notifications, ${unread} unread" aria-expanded="${state.menu === 'notif'}">${ic('bell')}${unread ? `<i class="badge-n">${unread}</i>` : ''}</button>
        <button type="button" class="user-btn" data-action="menu" ${attr('user')} aria-label="Account menu" aria-expanded="${state.menu === 'user'}">${avatar(ROLES[role].person)}<span>${esc(role)}</span>${ic('chevd')}</button>
        ${userMenu}${notifMenu}
      </div>
    </header>
    <main class="content" id="main" aria-busy="${state.loading}">${content()}</main>
  </div></div>`;
}

function content() {
  if (state.loading) return skeleton(state.screen === 'alerts' ? 'table' : 'cards');
  const s = state.screen;
  if (!access(s)) return denied(s);
  return ({ overview, alerts: alertQueue, investigation, incidents, reports, admin })[s]();
}
function denied(s) {
  const nav = NAV.find((n) => n.k === s);
  return `<div class="card denied">${ic('lock')}<h2>Access denied</h2><p>The <b>${esc(state.user.role)}</b> role does not have access to <b>${esc(nav.label)}</b>. Access is granted by an IT Administrator based on job duties.</p><div class="row">${btn('Return to dashboard', 'nav', 'overview', '', 'pri')}${btn('Switch role', 'menu', 'user', '', '')}</div></div>`;
}
const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map((c, i) => (c.go ? `<button type="button" data-action="nav" ${attr(c.go)}>${esc(c.t)}</button>${ic('chev')}` : `<span aria-current="page">${esc(c.t)}</span>`)).join('')}</nav>`;

/* ---------- overview ---------- */
const kpi = (label, value, sub, tone, action, a, b) => `<button type="button" class="kpi kpi-${tone || 'n'}" data-action="${action}" ${attr(a, b)}><span class="kpi-l">${label}</span><span class="kpi-v">${value}</span><span class="kpi-s">${sub}</span></button>`;
const card = (title, body, right, cls) => `<section class="card ${cls || ''}"><div class="ch"><h3>${title}</h3>${right || ''}</div>${body}</section>`;
const alertItem = (a) => `<button type="button" class="li" data-action="open-alert" ${attr(a.id)}>${sevBadge(a.sev)}<span class="li-main"><b>${esc(a.title)}</b><small><span class="mono">${a.id}</span> · ${esc(a.source)} · ${relTs(a.ts)}</small></span>${ic('chev')}</button>`;
const incItem = (i) => `<button type="button" class="li" data-action="open-inc" ${attr(i.id)} ${perms().incidents ? '' : 'disabled'}>${sevBadge(i.sev)}<span class="li-main"><b>${esc(i.title)}</b><small><span class="mono">${i.id}</span> · ${esc(i.owner)} · ${relTs(i.opened)}</small></span>${pill(i.status)}</button>`;
const srcItem = (s) => `<button type="button" class="li" data-action="src-detail" ${attr(s.id)}>${dot(s.status)}<span class="li-main"><b>${esc(s.name)}</b><small>${esc(s.rate)} · last event ${esc(s.last)}</small></span>${pill(s.status[0].toUpperCase() + s.status.slice(1))}</button>`;
const miniTbl = (cols, rows) => `<div class="tbl-wrap"><table class="mini"><thead><tr>${cols.map((c) => `<th class="${c[1] || ''}">${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const alertRows = (l) => l.map((a) => `<tr><td>${sevBadge(a.sev)}</td><td><button type="button" class="rowlink" data-action="open-alert" ${attr(a.id)}>${esc(a.title)}</button><small class="mono">${a.id} · ${esc(a.host)}</small></td><td>${esc(a.source)}</td><td class="mono nowrap">${relTs(a.ts)}</td><td>${pill(a.status)}</td></tr>`);
const alertTable = (l) => miniTbl([['Severity'], ['Alert'], ['Source'], ['Age'], ['Status']], alertRows(l));
const incTable = (l) => miniTbl([['Severity'], ['Incident'], ['Owner'], ['Opened'], ['Status']], l.map((i) => `<tr><td>${sevBadge(i.sev)}</td><td>${perms().incidents ? `<button type="button" class="rowlink" data-action="open-inc" ${attr(i.id)}>${esc(i.title)}</button>` : `<span class="t">${esc(i.title)}</span>`}<small class="mono">${i.id}</small></td><td>${esc(i.owner)}</td><td class="mono nowrap">${relTs(i.opened)}</td><td>${pill(i.status)}</td></tr>`));
const srcTable = (l) => miniTbl([['Source'], ['Rate'], ['Last event'], ['Status']], l.map((s) => `<tr><td><span class="row nw">${dot(s.status)}<button type="button" class="rowlink" data-action="src-detail" ${attr(s.id)}>${esc(s.name)}</button></span></td><td class="mono nowrap">${esc(s.rate)}</td><td class="mono nowrap">${esc(s.last)}</td><td>${pill(s.status[0].toUpperCase() + s.status.slice(1))}</td></tr>`));
const more = (label, action, a) => `<button type="button" class="link" data-action="${action}" ${attr(a)}>${label}${ic('arrow')}</button>`;

const pVolume = () => card('Event volume', `${lineChart(series(24, 17, 4.5, 11, 6), hourLabels(), { label: 'Event volume over the last 24 hours', y: 'Events per minute (thousands)', x: 'Hour, last 24 h (local time)' })}`);
function pTrend() {
  const ser = [['Low', 'low', series(7, 22, 7, 5, 3)], ['Medium', 'medium', series(7, 14, 5, 9, 2)], ['High', 'high', series(7, 8, 3, 3, 1)], ['Critical', 'critical', series(7, 2, 1.5, 7, 0)]].map((x) => ({ name: x[0], color: SEV_COLOR[x[1]], vals: x[2] }));
  return card('Detection trends', `${stackedBars(dayLabels(7), ser, { label: 'Alerts per day by severity', y: 'Alerts raised per day', x: 'Date, last 7 days' })}<div class="legend">${ser.slice().reverse().map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>`);
}
function pSeverity() {
  const oa = openAlerts(), items = ['critical', 'high', 'medium', 'low'].map((k) => ({ key: k, label: SEV[k].label, color: SEV_COLOR[k], n: oa.filter((a) => a.sev === k).length })), tot = oa.length || 1;
  return card('Open alerts by severity', `<div class="sevbar" role="img" aria-label="Open alerts by severity">${items.map((x) => `<i style="width:${(x.n / tot) * 100}%;background:${x.color}"></i>`).join('')}</div><ul class="sevlist">${items.map((x) => `<li><button type="button" class="li" data-action="goto-alerts" ${attr(x.key)} ${perms().alerts ? '' : 'disabled'}><i class="sw" style="background:${x.color}"></i><span class="li-main"><b>${x.label}</b></span><span class="num mono">${x.n}</span><span class="num dim mono" style="width:44px">${Math.round((x.n / tot) * 100)}%</span></button></li>`).join('')}</ul>`, `<span class="dim mono">${oa.length} open</span>`);
}
const pCritical = () => { const l = openAlerts().filter((a) => a.sev === 'critical'); return card('Critical alerts needing review', l.length ? alertTable(l) : empty('check', 'No critical alerts', 'Nothing critical is waiting for review.'), more('Open queue', 'goto-alerts', 'critical')); };
const pRecent = () => card('Recent alerts', alertTable(ALERTS.slice().sort((a, b) => b.ts - a.ts).slice(0, 6)), more('All alerts', 'goto-alerts', 'all'));
const pOpenInc = () => card('Open incidents', incTable(openIncs()), perms().incidents ? more('Workspace', 'nav', 'incidents') : '');
const pSources = (n) => card('Data-source health', `${srcTable(DATA_SOURCES.slice(0, n || 7))}`, perms().admin ? more('Manage', 'goto-admin', 'sources') : '');

function ovAnalyst() {
  const me = ROLES[state.user.role].person, mine = openAlerts().filter((a) => a.assignee === me), crit = openAlerts().filter((a) => a.sev === 'critical');
  return `<div class="grid g4">${kpi('Assigned to me', mine.length, 'open alerts', 'cyan', 'goto-alerts', 'mine')}${kpi('Critical needing review', crit.length, 'oldest 14 min ago', 'crit', 'goto-alerts', 'critical')}${kpi('Open incidents', openIncs().length, `${openIncs().filter((i) => i.owner === me).length} owned by me`, 'blue', 'nav', 'incidents')}${kpi('Median time to triage', '6 min', 'target 10 min', 'low', 'nav', 'reports')}</div>
  <div class="grid g32">${pCritical()}${pSeverity()}</div>
  <div class="grid g2">${pVolume()}${pTrend()}</div>
  <div class="grid g2">${pRecent()}${pOpenInc()}</div>
  ${pSources(7)}`;
}
function ovEngineer() {
  const noisy = RULES.filter((r) => r.precision < 65 && r.status !== 'Disabled'), act = RULES.filter((r) => r.status === 'Active').length;
  const healthy = DATA_SOURCES.filter((s) => s.status === 'healthy').length, errs = PROC_ERRORS.reduce((s, e) => s + e.n, 0);
  const ruleRows = RULES.slice(0, 6).map((r) => `<tr><td><b>${esc(r.name)}</b><br><small class="mono">${esc(r.kind)}</small></td><td>${pill(r.status)}</td><td class="num">${r.precision}%</td><td class="num">${r.alerts24}</td><td>${btn('Tune', 'tune-rule', r.id, '', 'sm')}</td></tr>`).join('');
  return `<div class="grid g4">${kpi('Rules and models active', `${act}/${RULES.length}`, '1 degraded, 1 disabled', 'cyan', 'goto-admin', 'rules')}${kpi('Noisy detections', noisy.length, 'precision below 65%', 'high', 'goto-admin', 'rules')}${kpi('Integrations healthy', `${healthy}/${DATA_SOURCES.length}`, '1 degraded, 1 failing', 'med', 'goto-admin', 'sources')}${kpi('Processing errors, 24 h', errs.toLocaleString(), '3 sources affected', 'crit', 'goto-admin', 'sources')}</div>
  <div class="grid g32">${card('Detection rule and model status', `<div class="tbl-wrap"><table><thead><tr><th>Detection</th><th>Status</th><th class="num">Precision</th><th class="num">Alerts 24 h</th><th><span class="sr">Action</span></th></tr></thead><tbody>${ruleRows}</tbody></table></div>`, more('All rules', 'goto-admin', 'rules'))}
  ${card('Noisy alerts', `<div class="list">${noisy.map((r) => `<div class="li static"><span class="li-main"><b>${esc(r.name)}</b><small>${r.alerts24} alerts in 24 h, ${100 - r.precision}% false positives</small></span>${btn('Tune', 'tune-rule', r.id, '', 'sm')}</div>`).join('')}</div>`)}</div>
  <div class="grid g2">${pVolume()}${card('Detection coverage', `<p class="cap">Share of ATT&amp;CK-style tactics with at least one working detection</p>${COVERAGE.map((c) => hbar(c[0], c[1], c[1] < 70 ? 'high' : 'cyan')).join('')}`)}</div>
  <div class="grid g2">${card('Integration health', srcTable(DATA_SOURCES), more('Troubleshoot', 'goto-admin', 'sources'))}
  ${card('Processing errors', `<div class="list">${PROC_ERRORS.map((e) => `<div class="li static"><span class="li-main"><b>${esc(e.err)}</b><small>${esc(e.src)} · ${e.n.toLocaleString()} events</small></span>${btn('Troubleshoot', 'goto-admin', 'sources', '', 'sm')}</div>`).join('')}</div>`)}</div>`;
}
function ovIR() {
  const act = openIncs().filter((i) => i.sev === 'critical' || i.sev === 'high');
  const approved = Object.keys(ACTIONS).filter((k) => ACTIONS[k].status === 'approved');
  const assets = Array.from(new Set(act.reduce((l, i) => l.concat(i.assets), [])));
  const hand = HANDOFFS.filter((h) => !h.accepted);
  const top = act[0], tl = INCIDENTS.reduce((l, i) => l.concat(i.audit.map((x) => Object.assign({ inc: i.id }, x))), []).sort((a, b) => b.at - a.at).slice(0, 6);
  const apr = approved.length ? approved.map((k) => { const [aid, xid] = k.split(':'), al = getAlert(aid), x = detailFor(al).actions.find((q) => q.id === xid); return `<div class="li static"><span class="li-main"><b>${esc(x.title)}</b><small><span class="mono">${al.inc || aid}</span> · approved by ${esc(ACTIONS[k].by)} ${relTs(ACTIONS[k].at)}</small></span>${btn('Mark executed', 'ask-execute', aid, xid, 'sm pri')}</div>`; }).join('') : empty('check', 'Nothing waiting', 'Approved actions will appear here for execution.');
  return `<div class="grid g4">${kpi('High-priority incidents', act.length, 'critical and high, active', 'crit', 'nav', 'incidents')}${kpi('Affected assets', assets.length, 'across active incidents', 'high', 'nav', 'incidents')}${kpi('Approved, not executed', approved.length, 'actions awaiting responders', 'cyan', 'nav', 'incidents')}${kpi('Pending handoffs', hand.length, 'from SOC analysts', 'blue', 'nav', 'incidents')}</div>
  <div class="grid g32">${card('Active high-priority incidents', incTable(act), more('Workspace', 'nav', 'incidents'))}${card('Pending handoffs', hand.length ? `<div class="list">${hand.map((h) => `<div class="li static col"><span class="li-main"><b><span class="mono">${h.inc}</span> from ${esc(h.from)}</b><small>${esc(h.note)}</small></span>${btn('Accept handoff', 'accept-handoff', h.id, '', 'sm')}</div>`).join('')}</div>` : empty('check', 'No pending handoffs', 'You have accepted every handoff.'))}</div>
  <div class="grid g2">${card('Approved response actions', `<p class="cap"><span class="ai-dot"></span>Approved by an analyst. Executing here is simulated.</p><div class="list">${apr}</div>`)}${card(`Containment checklist${top ? ' · ' + top.id : ''}`, top ? checklistHtml(top, perms().incidents === 'edit') : empty('folder', 'No active incident', 'Nothing to contain right now.'))}</div>
  <div class="grid g2">${card('Response timeline', `<ol class="tl">${tl.map((x) => `<li><time>${fmtTs(x.at)}</time><div><b>${esc(x.who)}</b> <span class="mono dim">${x.inc}</span><p>${esc(x.text)}</p></div></li>`).join('')}</ol>`)}${card('Affected assets', `<div class="chips">${assets.map((a) => `<span class="chip static">${esc(a)}</span>`).join('')}</div>`)}</div>`;
}
function ovAdmin() {
  const roleCounts = Object.keys(ROLES).map((r) => [r, USERS.filter((u) => u.role === r && u.active).length]);
  const healthy = DATA_SOURCES.filter((s) => s.status === 'healthy').length;
  const req = REQUESTS.length ? REQUESTS.map((r) => `<div class="li static col"><span class="li-main"><b>${esc(r.who)}</b><small>${esc(r.ask)} · ${relTs(r.at)}</small><small>${esc(r.reason)}</small></span><span class="row">${btn('Approve', 'approve-request', r.id, '', 'sm pri')}${btn('Deny', 'deny-request', r.id, '', 'sm')}</span></div>`).join('') : empty('check', 'No pending requests', 'All access requests have been handled.');
  return `<div class="grid g4">${kpi('Active users', USERS.filter((u) => u.active).length, `${USERS.length} accounts`, 'cyan', 'goto-admin', 'users')}${kpi('Access requests', REQUESTS.length, 'waiting for a decision', 'high', 'goto-admin', 'users')}${kpi('System health', SYSTEM_HEALTH.some((s) => s.state !== 'ok') ? '4 of 5 OK' : 'All OK', '1 service degraded', 'med', 'ovsys')}${kpi('Data sources connected', `${healthy}/${DATA_SOURCES.filter((s) => s.enabled).length}`, 'healthy of enabled', 'low', 'goto-admin', 'sources')}</div>
  <div class="grid g32">${card('Access requests', `<div class="list">${req}</div>`)}${card('Users and roles', roleCounts.map((r) => hbar(esc(r[0]), Math.round((r[1] / USERS.filter((u) => u.active).length) * 100), 'cyan', plural(r[1], 'user'))).join(''), more('Manage users', 'goto-admin', 'users'))}</div>
  <div class="grid g2">${card('System health', `<div class="list" id="sys-health">${SYSTEM_HEALTH.map((s) => `<div class="li static">${dot(s.state === 'ok' ? 'healthy' : 'degraded')}<span class="li-main"><b>${s.name}</b><small>${s.val}</small></span>${pill(s.state === 'ok' ? 'Healthy' : 'Degraded')}</div>`).join('')}</div>`)}${card('Audit activity', `<ol class="tl">${AUDIT.slice().sort((a, b) => b.at - a.at).slice(0, 5).map((x) => `<li><time>${fmtHM(x.at)}</time><div><b>${esc(x.who)}</b><p>${esc(x.text)}</p></div></li>`).join('')}</ol>`, more('Audit log', 'goto-admin', 'audit'))}</div>
  ${pSources(7)}
  ${card('Configuration settings', `<div class="cfg">${[['Session timeout', SETTINGS.timeout + ' minutes'], ['Alert retention', SETTINGS.retention + ' days'], ['Analyst approval for responses', 'Required (policy)'], ['MFA for all roles', SETTINGS.mfa ? 'On' : 'Off']].map((x) => `<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}</div>`, btn('Open settings', 'goto-admin', 'settings', '', 'sm'))}`;
}
function overview() {
  const role = ROLES[state.user.role];
  const body = { analyst: ovAnalyst, engineer: ovEngineer, ir: ovIR, admin: ovAdmin }[role.key]();
  return `<div class="page-h"><div><h2>${esc(state.user.role)} dashboard</h2><p>Welcome back, ${esc(role.person.split(' ')[0])}. ${esc(role.blurb)}</p></div>${btn(ic('refresh') + 'Refresh', 'refresh-overview', '', '', '')}</div>${state.ovMsg ? banner('success', esc(state.ovMsg)) : ''}<div class="stack">${body}</div>`;
}

/* ---------- alert queue ---------- */
function filteredAlerts() {
  const f = state.af, q = f.q.trim().toLowerCase(), me = ROLES[state.user.role].person;
  let l = ALERTS.filter((a) => (!q || [a.title, a.id, a.host, a.source, a.assignee, a.acct].join(' ').toLowerCase().includes(q)) && (f.sev === 'all' || a.sev === f.sev) && (f.status === 'all' || a.status === f.status) && (f.source === 'all' || a.source === f.source) && (f.assignee === 'all' || a.assignee === f.assignee) && (!f.mine || a.assignee === me));
  const k = f.sort, d = f.dir === 'asc' ? 1 : -1;
  const key = { sev: (a) => SEV[a.sev].rank, conf: (a) => a.conf, time: (a) => a.ts, status: (a) => a.status, title: (a) => a.title.toLowerCase(), source: (a) => a.source, assignee: (a) => a.assignee }[k];
  return l.sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * d);
}
function alertQueue() {
  const f = state.af, list = filteredAlerts(), active = f.q || f.sev !== 'all' || f.status !== 'all' || f.source !== 'all' || f.assignee !== 'all' || f.mine;
  const th = (k, label, cls) => `<th class="${cls || ''}" aria-sort="${f.sort === k ? (f.dir === 'asc' ? 'ascending' : 'descending') : 'none'}"><button type="button" class="th-b" data-action="sort" ${attr(k)}>${label}${f.sort === k ? ic(f.dir === 'asc' ? 'chev' : 'chevd', 'sorti') : ''}</button></th>`;
  const sel = (id, bind, val, opts, all) => `<label class="sel"><span class="sr">${all}</span><select id="${id}" data-bind="${bind}"><option value="all">${all}</option>${opts.map((o) => `<option ${val === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
  const rows = list.map((a) => `<tr class="clk" data-action="open-alert" ${attr(a.id)}><td>${sevBadge(a.sev)}</td><td><button type="button" class="rowlink" data-action="open-alert" ${attr(a.id)}>${esc(a.title)}</button><small class="mono">${a.id}${a.inc ? ' · ' + a.inc : ''}</small></td><td>${confBar(a.conf)}</td><td>${esc(a.source)}</td><td class="mono nowrap">${fmtTs(a.ts)}<small>${relTs(a.ts)}</small></td><td>${pill(a.status)}</td><td>${a.assignee === 'Unassigned' ? '<span class="dim">Unassigned</span>' : esc(a.assignee)}</td></tr>`).join('');
  return `<div class="page-h"><div><h2>Alert Queue</h2><p>${perms().alerts === 'edit' ? 'Review, filter and open alerts for investigation.' : 'Read-only view of the alert queue for your role.'}</p></div>${btn(ic('refresh') + (state.refreshing ? 'Refreshing…' : 'Refresh'), 'refresh-alerts', '', '', '', state.refreshing ? 'disabled' : '')}</div>
  ${state.queueMsg ? banner('success', esc(state.queueMsg)) : ''}
  <section class="card flush"><div class="toolbar">
    <label class="search">${ic('search')}<span class="sr">Search alerts</span><input id="aq-q" type="search" placeholder="Search title, ID, host, assignee" value="${esc(f.q)}" data-bind="af.q"></label>
    <div class="chips" role="group" aria-label="Severity">${['all', 'critical', 'high', 'medium', 'low'].map((s) => `<button type="button" class="chip ${s === 'all' ? '' : 'c-' + s}" aria-pressed="${f.sev === s}" data-action="sev-chip" ${attr(s)}>${s === 'all' ? 'All severities' : SEV[s].label}</button>`).join('')}</div>
    ${sel('aq-st', 'af.status', f.status, ALERT_STATUS, 'All statuses')}${sel('aq-src', 'af.source', f.source, SOURCES, 'All sources')}${sel('aq-as', 'af.assignee', f.assignee, ANALYSTS.concat('Unassigned'), 'All assignees')}
    ${ROLES[state.user.role].key === 'analyst' ? `<button type="button" class="chip" aria-pressed="${f.mine}" data-action="mine-toggle">Assigned to me</button>` : ''}
    ${active ? btn('Clear filters', 'clear-filters', '', '', 'ghost sm') : ''}
  </div>
  <p class="count" aria-live="polite">Showing ${list.length} of ${ALERTS.length} alerts</p>
  ${state.refreshing ? skeleton('table') : list.length ? `<div class="tbl-wrap"><table class="alerts"><thead><tr>${th('sev', 'Severity')}${th('title', 'Alert')}${th('conf', 'Confidence')}${th('source', 'Source')}${th('time', 'Detected')}${th('status', 'Status')}${th('assignee', 'Assigned analyst')}</tr></thead><tbody>${rows}</tbody></table></div>` : empty('search', 'No alerts match these filters', 'Try a different search term or clear the filters to see the full queue.', btn('Clear filters', 'clear-filters', '', '', 'pri'))}
  </section>`;
}

/* ---------- investigation ---------- */
const decisionOf = (aid, xid) => ACTIONS[aid + ':' + xid];
const reviewedCount = (a) => { const r = state.reviewed[a.id] || {}; const d = detailFor(a); return [d.evd.filter((e) => r[e.id]).length, d.evd.length]; };
function investigation() {
  const a = getAlert(state.alertId) || openAlerts().filter((x) => x.sev === 'critical')[0] || ALERTS[0];
  const d = detailFor(a), c = perms(), edit = c.alerts === 'edit', rc = reviewedCount(a), tab = state.invTab;
  const pending = d.actions.filter((x) => !decisionOf(a.id, x.id)), decided = d.actions.filter((x) => decisionOf(a.id, x.id));
  const tabBtn = (k, label, n) => `<button type="button" role="tab" class="tab" aria-selected="${tab === k}" data-action="inv-tab" ${attr(k)}>${label}${n != null ? `<span class="tab-n">${n}</span>` : ''}</button>`;
  let panel = '';
  if (tab === 'timeline') panel = `<ol class="tl">${d.tl.sort((x, y) => x.ts - y.ts).map((t) => `<li><time>${fmtHM(t.ts)}</time><div><span class="kind">${esc(t.kind)}</span><p>${esc(t.text)}</p></div></li>`).join('')}</ol>`;
  if (tab === 'events') panel = `<div class="tbl-wrap"><table><thead><tr><th>Time</th><th>Source</th><th>Event</th></tr></thead><tbody>${d.ev.sort((x, y) => x.ts - y.ts).map((e) => `<tr><td class="mono nowrap">${fmtHM(e.ts)}</td><td>${esc(e.src)}</td><td>${esc(e.msg)}</td></tr>`).join('')}</tbody></table></div>`;
  if (tab === 'ti') panel = d.ti.length ? `<div class="tbl-wrap"><table><thead><tr><th>Indicator</th><th>Type</th><th>Feed</th><th>Verdict</th><th>Confidence</th><th>First seen</th></tr></thead><tbody>${d.ti.map((t) => `<tr><td class="mono">${esc(t.ind)}</td><td>${esc(t.type)}</td><td>${esc(t.feed)}</td><td>${pill(t.verdict === 'Malicious' ? 'Error' : 'Degraded').replace(/>(Error|Degraded)</, '>' + t.verdict + '<')}</td><td>${confBar(t.conf)}</td><td>${esc(t.first)}</td></tr>`).join('')}</tbody></table></div>` : empty('info', 'No threat-intelligence matches', 'None of this alert\'s indicators appear in the connected feeds. That does not rule out a threat.');
  if (tab === 'evidence') panel = `<p class="cap">Mark each item as reviewed after you read it. ${rc[0]} of ${rc[1]} reviewed.</p><div class="evlist">${d.evd.map((e) => `<label class="ev ${(state.reviewed[a.id] || {})[e.id] ? 'done' : ''}"><input type="checkbox" ${(state.reviewed[a.id] || {})[e.id] ? 'checked' : ''} data-action="ack-evidence" ${attr(a.id, e.id)}><span><b>${esc(e.kind)}: ${esc(e.name)}</b><small>${esc(e.note)}</small></span></label>`).join('')}</div>`;
  const sugg = pending.length ? pending.map((x) => `<div class="act act-ai"><div class="act-h"><b>${esc(x.title)}</b>${aiTag()}</div><p>${esc(x.desc)}</p><p class="risk">${ic('warn')}<span><b>Impact:</b> ${esc(x.risk)}</span></p><div class="row">${btn('Approve…', 'ask-approve', a.id, x.id, 'pri sm', c.approve ? '' : 'disabled aria-disabled="true"')}${btn('Dismiss…', 'ask-dismiss-action', a.id, x.id, 'sm', c.approve ? '' : 'disabled aria-disabled="true"')}</div></div>`).join('') + (c.approve ? '' : `<p class="note">${ic('lock')}Only a SOC Analyst can approve or dismiss response actions. Your role has read-only access.</p>`) : `<p class="note">${ic('check')}Every suggestion has been decided.</p>`;
  const dec = decided.length ? decided.map((x) => { const r = decisionOf(a.id, x.id); const st = r.status[0].toUpperCase() + r.status.slice(1); return `<div class="act act-${r.status === 'dismissed' ? 'no' : 'ok'}"><div class="act-h"><b>${esc(x.title)}</b>${pill(st)}</div><p class="by">${r.status === 'dismissed' ? 'Dismissed' : r.status === 'executed' ? 'Executed (simulated) by ' + esc(r.by) + ', approved by ' + esc(r.approvedBy || r.by) : 'Approved by ' + esc(r.by)} · ${fmtTs(r.at)}${r.reason ? ' · ' + esc(r.reason) : ''}</p>${r.status === 'approved' ? `<p class="note sm">Not executed yet. The Incident Response Team carries it out.</p>${c.execute ? `<div class="row">${btn('Mark executed…', 'ask-execute', a.id, x.id, 'sm')}</div>` : ''}` : ''}</div>`; }).join('') : `<p class="note">No decisions yet. Nothing is approved or executed until an analyst confirms.</p>`;
  return `${crumbs([{ t: 'Overview', go: 'overview' }, { t: 'Alert Queue', go: 'alerts' }, { t: a.id }])}
  ${state.invMsg ? banner(state.invMsg.kind, state.invMsg.html, state.invMsg.cta) : ''}
  <section class="card inv-h"><div><div class="row wrap">${sevBadge(a.sev)}${pill(a.status)}<span class="mono dim">${a.id} · ${esc(a.source)} · detected ${fmtTs(a.ts)}</span></div><h2>${esc(a.title)}</h2><p class="rule">Detection: ${esc(a.rule)} · ${confBar(a.conf)}</p></div>
    <div class="inv-ctl">${edit ? `<label class="sel"><span class="sr">Assigned analyst</span><select id="inv-as" data-change="assign-alert" ${attr(a.id)}>${ANALYSTS.concat('Unassigned').map((n) => `<option ${a.assignee === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : `<span class="dim">Assigned: ${esc(a.assignee)}</span>`}
    ${a.inc && c.incidents ? btn('Open ' + a.inc, 'open-inc', a.inc, '', '') : ''}${edit && !isDone(a.status) ? btn('Dismiss alert…', 'ask-dismiss-alert', a.id, '', 'dng') : ''}</div></section>
  <div class="inv-grid"><div class="stack">
    ${card('Alert summary', `<p>${esc(d.summary)}</p><h4>Affected assets</h4><div class="tbl-wrap"><table><thead><tr><th>Asset</th><th>Type</th><th>Criticality</th><th>Owner</th><th>Address</th></tr></thead><tbody>${d.assets.map((x) => `<tr><td><b>${esc(x[0])}</b></td><td>${esc(x[1])}</td><td>${esc(x[2])}</td><td>${esc(x[3])}</td><td class="mono">${esc(x[4])}</td></tr>`).join('')}</tbody></table></div>`)}
    <section class="card"><div class="tabs" role="tablist" aria-label="Investigation details">${tabBtn('timeline', 'Incident timeline')}${tabBtn('events', 'Correlated events', d.ev.length)}${tabBtn('ti', 'Threat intelligence', d.ti.length)}${tabBtn('evidence', 'Evidence', rc[0] + '/' + rc[1])}</div><div class="tabpanel" role="tabpanel">${panel}</div></section>
  </div><div class="stack">
    <section class="card ai-card"><div class="ch"><h3>AI summary</h3>${aiTag()}</div><p>${esc(d.summary.split('. ')[0])}.</p><h4>Why the assistant thinks so</h4><ul class="why">${d.ai.rationale.map((r) => `<li>${esc(r)}</li>`).join('')}</ul><div class="aiconf"><span>Confidence</span>${confBar(d.ai.conf)}</div><p class="note sm">${ic('info')}${esc(d.ai.limits)}</p></section>
    <section class="card ai-card"><div class="ch"><h3>Suggested response actions</h3>${aiTag()}</div><p class="cap">Suggestions only. Nothing runs until an analyst approves it.</p>${sugg}</section>
    <section class="card"><div class="ch"><h3>Analyst decisions</h3><span class="pill pill-green">Human reviewed</span></div>${dec}</section>
  </div></div>`;
}

/* ---------- incidents ---------- */
function checklistHtml(i, edit) {
  const done = i.checklist.filter((c) => c.done).length;
  return `<div class="prog"><span>${done} of ${i.checklist.length} complete</span><span class="prog-t"><i style="width:${(done / i.checklist.length) * 100}%"></i></span></div><div class="evlist">${i.checklist.map((c) => `<label class="ev ${c.done ? 'done' : ''}"><input type="checkbox" ${c.done ? 'checked' : ''} ${edit ? '' : 'disabled'} data-action="toggle-check" ${attr(i.id, c.id)}><span><b>${esc(c.label)}</b></span></label>`).join('')}</div>`;
}
function incidents() {
  const c = perms(), edit = c.incidents === 'edit', f = state.incFilter;
  const list = INCIDENTS.filter((i) => f === 'all' || (f === 'open' ? !isDone(i.status) : isDone(i.status)));
  const cur = getInc(state.incId) || list[0] || INCIDENTS[0];
  const left = `<section class="card flush inc-list"><div class="chips pad" role="group" aria-label="Incident filter">${[['open', 'Open'], ['done', 'Resolved'], ['all', 'All']].map((x) => `<button type="button" class="chip" aria-pressed="${f === x[0]}" data-action="inc-filter" ${attr(x[0])}>${x[1]}</button>`).join('')}</div>${list.length ? list.map((i) => `<button type="button" class="inc-i ${i.id === cur.id ? 'on' : ''}" data-action="open-inc" ${attr(i.id)}><span class="row between">${sevBadge(i.sev)}${pill(i.status)}</span><b>${esc(i.title)}</b><small class="mono">${i.id} · ${esc(i.owner)}</small></button>`).join('') : empty('folder', 'No incidents here', 'Switch the filter to see other incidents.')}</section>`;
  const links = cur.alerts.map(getAlert);
  const acts = links.reduce((l, al) => l.concat(detailFor(al).actions.map((x) => ({ al, x, r: decisionOf(al.id, x.id) }))), []);
  const pend = acts.filter((z) => !z.r), hist = acts.filter((z) => z.r).sort((a, b) => b.r.at - a.r.at);
  const ev = links.reduce((l, al) => l.concat(detailFor(al).evd.map((e) => ({ al, e }))), []);
  const draft = state.statusDraft || cur.status;
  const resp = `${pend.length ? `<h4>Pending approval ${aiTag()}</h4>${pend.map((z) => `<div class="act act-ai"><div class="act-h"><b>${esc(z.x.title)}</b></div><p>${esc(z.x.desc)}</p><div class="row">${btn('Approve…', 'ask-approve', z.al.id, z.x.id, 'pri sm', c.incidents === 'edit' && ROLES[state.user.role].can.approve ? '' : 'disabled aria-disabled="true"')}${btn('Dismiss…', 'ask-dismiss-action', z.al.id, z.x.id, 'sm', ROLES[state.user.role].can.approve ? '' : 'disabled aria-disabled="true"')}${btn('Review evidence', 'open-alert', z.al.id, '', 'sm ghost')}</div></div>`).join('')}${ROLES[state.user.role].can.approve ? '' : `<p class="note">${ic('lock')}Approval is limited to SOC Analysts.</p>`}` : ''}
  <h4>Response history</h4>${hist.length ? hist.map((z) => `<div class="act act-${z.r.status === 'dismissed' ? 'no' : 'ok'}"><div class="act-h"><b>${esc(z.x.title)}</b>${pill(z.r.status[0].toUpperCase() + z.r.status.slice(1))}</div><p class="by">${z.r.status === 'dismissed' ? 'Dismissed' : z.r.status === 'executed' ? 'Executed (simulated) by ' + esc(z.r.by) : 'Approved by ' + esc(z.r.by)} · ${fmtTs(z.r.at)}${z.r.reason ? ' · ' + esc(z.r.reason) : ''}</p>${z.r.status === 'approved' ? `<p class="note sm">Waiting for the Incident Response Team.</p>${c.execute ? `<div class="row">${btn('Mark executed…', 'ask-execute', z.al.id, z.x.id, 'sm')}</div>` : ''}` : ''}</div>`).join('') : `<p class="note">No response actions have been decided for this incident.</p>`}`;
  return `${crumbs([{ t: 'Overview', go: 'overview' }, { t: 'Incident Workspace' }, ])}
  ${state.incMsg ? banner(state.incMsg.kind, state.incMsg.html, state.incMsg.cta) : ''}
  ${!edit ? banner('info', 'You have read-only access to incidents. Status changes, notes and checklist updates are disabled for your role.') : ''}
  <div class="inc-grid">${left}<div class="stack">
    <section class="card"><div class="row wrap">${sevBadge(cur.sev)}${pill(cur.status)}<span class="mono dim">${cur.id} · opened ${fmtTs(cur.opened)}</span></div><h2 class="inc-t">${esc(cur.title)}</h2>
      <div class="inc-ctl"><label class="field"><span class="lab">Owner</span><select id="inc-owner" data-change="inc-owner" ${attr(cur.id)} ${edit ? '' : 'disabled'}>${ANALYSTS.concat(['Meera Shah', 'Arjun Desai']).map((n) => `<option ${cur.owner === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="field"><span class="lab">Status</span><select id="inc-status" data-bind="statusDraft" ${edit ? '' : 'disabled'}>${INC_STATUS.map((s) => `<option ${draft === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      ${btn('Update status', 'update-status', cur.id, '', 'pri', edit && draft !== cur.status ? '' : 'disabled')}</div>
      ${cur.alerts.length ? `<p class="cap">Linked alerts: ${cur.alerts.map((id) => `<button type="button" class="link inline" data-action="open-alert" ${attr(id)}>${id}</button>`).join(', ')}${cur.assets.length ? ' · Assets: ' + cur.assets.map(esc).join(', ') : ''}</p>` : `<p class="cap">Assets: ${cur.assets.map(esc).join(', ')}</p>`}</section>
    <div class="inc-cols"><div class="stack">
      ${card('Response actions and approvals', resp)}
      ${card('Containment checklist', checklistHtml(cur, edit))}
      ${card('Notes', `<div class="field"><label for="note-draft" class="sr">Add a note</label><textarea id="note-draft" rows="3" placeholder="Add an investigation note" data-bind="noteDraft" ${edit ? '' : 'disabled'} ${state.noteErr ? 'aria-invalid="true"' : ''}>${esc(state.noteDraft)}</textarea>${state.noteErr ? `<p class="err">${ic('warn')}${esc(state.noteErr)}</p>` : ''}</div><div class="row">${btn('Add note', 'add-note', cur.id, '', 'sm pri', edit ? '' : 'disabled')}</div><div class="notes">${cur.notes.slice().sort((a, b) => b.at - a.at).map((n) => `<div class="note-i">${avatar(n.by)}<div><b>${esc(n.by)}</b> <small>${esc(n.role)} · ${fmtTs(n.at)}</small><p>${esc(n.text)}</p></div></div>`).join('') || '<p class="note">No notes yet.</p>'}</div>`)}
    </div><div class="stack">
      ${card('Evidence', ev.length ? `<div class="evlist">${ev.map((z) => `<div class="ev static"><span><b>${esc(z.e.kind)}</b><small>${esc(z.e.name)}</small></span></div>`).join('')}</div>` : empty('file', 'No evidence attached', 'This incident was opened without linked alerts.'), ev.length ? more('Review in investigation', 'open-alert', links[0].id) : '')}
      ${card('Audit trail', `<ol class="tl">${cur.audit.slice().sort((a, b) => b.at - a.at).map((x) => `<li><time>${fmtTs(x.at)}</time><div><b>${esc(x.who)}</b><p>${esc(x.text)}</p></div></li>`).join('')}</ol>`)}
    </div></div>
  </div></div>`;
}

/* ---------- reports & history ---------- */
const SEV_F = { all: 1, critical: 0.12, high: 0.3, medium: 0.4, low: 0.18 };
function repModel() {
  const days = +state.repRange, n = days === 7 ? 7 : days === 30 ? 10 : 12, step = days / n;
  const fs = SEV_F[state.repSev] * (state.repSrc === 'all' ? 1 : 0.17);
  const labels = Array.from({ length: n }, (_, i) => { const d = new Date(NOW - (n - 1 - i) * step * 86400000); return `${d.getDate()} ${MON[d.getMonth()]}`; });
  const inc = series(n, 5 * step, 2.4 * step, 21, 0).map((v) => Math.round(v * fs));
  const rt = series(n, 41, 9, 8, 12);
  const k = { 7: ['3.8 min', '34 min', '74%', '11%'], 30: ['4.2 min', '38 min', '71%', '12%'], 90: ['4.9 min', '43 min', '66%', '14%'] }[days];
  return { labels, inc, rt, k, total: inc.reduce((s, v) => s + v, 0) };
}
function reports() {
  const m = repModel(), tab = state.repTab, canInc = !!perms().incidents;
  const tabBtn = (k, l) => `<button type="button" role="tab" class="tab" aria-selected="${tab === k}" data-action="rep-tab" ${attr(k)}>${l}</button>`;
  const sel = (id, bind, val, opts) => `<label class="sel"><span class="sr">${id}</span><select id="${id}" data-bind="${bind}">${opts.map((o) => `<option value="${o[0]}" ${String(val) === String(o[0]) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label>`;
  let body = '';
  if (tab === 'trends') body = `<div class="toolbar">${sel('rep-range', 'repRange', state.repRange, [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days']])}${sel('rep-sev', 'repSev', state.repSev, [['all', 'All severities']].concat(Object.keys(SEV).map((s) => [s, SEV[s].label])))}${sel('rep-src', 'repSrc', state.repSrc, [['all', 'All sources']].concat(SOURCES.map((s) => [s, s])))}</div>
    <div class="grid g4">${[['Mean time to detect', m.k[0], 'cyan'], ['Mean time to respond', m.k[1], 'blue'], ['Triaged by assistant', m.k[2], 'low'], ['False positives', m.k[3], 'med']].map((x) => `<div class="kpi kpi-${x[2]} static"><span class="kpi-l">${x[0]}</span><span class="kpi-v">${x[1]}</span><span class="kpi-s">Demo figures</span></div>`).join('')}</div>
    ${m.total ? `<div class="grid g2">${card('Incident trend', `${stackedBars(m.labels, [{ name: 'Incidents', color: 'var(--cyan)', vals: m.inc }], { label: 'Incidents opened per period', y: 'Incidents opened', x: 'Period starting' })}<div class="legend"><span><i style="background:var(--cyan)"></i>Incidents opened (${m.total} in range)</span></div>`)}${card('Response-time trend', `${lineChart(m.rt, m.labels, { color: 'var(--cyan)', label: 'Mean time to respond', y: 'Mean time to respond (minutes)', x: 'Period starting' })}<div class="legend"><span><i style="background:var(--cyan)"></i>Mean time to respond</span></div>`)}</div>` : empty('chart', 'No incidents match these filters', 'There is no data for this combination of severity and source in the selected period.', btn('Reset filters', 'rep-reset', '', '', 'pri'))}`;
  if (tab === 'saved') body = `<div class="tbl-wrap"><table><thead><tr><th>Report</th><th>Owner</th><th>Range</th><th>Last run</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${SAVED_REPORTS.map((r) => `<tr><td><b>${esc(r.name)}</b><small>${esc(r.note)}</small></td><td>${esc(r.owner)}</td><td>${esc(r.range)}</td><td class="nowrap">${state.running === r.id ? 'Running…' : relTs(r.last)}</td><td><span class="row">${btn('View', 'rep-open', r.id, '', 'sm')}${btn('Run now', 'rep-run', r.id, '', 'sm', state.running ? 'disabled' : '')}${btn(ic('download') + 'Export', 'rep-export', r.id, '', 'sm')}</span></td></tr>`).join('')}</tbody></table></div>`;
  if (tab === 'history') { const hl = INCIDENTS.filter((i) => state.repSev === 'all' || i.sev === state.repSev); body = `<div class="toolbar">${sel('rep-sev', 'repSev', state.repSev, [['all', 'All severities']].concat(Object.keys(SEV).map((s) => [s, SEV[s].label])))}</div>${hl.length ? `<div class="tbl-wrap"><table><thead><tr><th>Incident</th><th>Severity</th><th>Status</th><th>Owner</th><th>Opened</th></tr></thead><tbody>${hl.map((i) => `<tr class="${canInc ? 'clk' : ''}" ${canInc ? `data-action="open-inc" ${attr(i.id)}` : ''}><td><b>${esc(i.title)}</b><small class="mono">${i.id}</small></td><td>${sevBadge(i.sev)}</td><td>${pill(i.status)}</td><td>${esc(i.owner)}</td><td class="mono nowrap">${fmtTs(i.opened)}</td></tr>`).join('')}</tbody></table></div>${canInc ? '' : `<p class="note">${ic('lock')}Opening incidents is not available to your role.</p>`}` : empty('folder', 'No incidents for this severity', 'Choose another severity to see past incidents.', btn('Reset filters', 'rep-reset', '', '', 'pri'))}`; }
  return `<div class="page-h"><div><h2>Reports &amp; History</h2><p>Incident trends, response times and saved reports. Figures are demonstration data.</p></div>${btn(ic('download') + 'Export current view', 'rep-export', 'view', '', '')}</div>
  <section class="card flush"><div class="tabs pad" role="tablist" aria-label="Reports">${tabBtn('trends', 'Trends')}${tabBtn('saved', 'Saved reports')}${tabBtn('history', 'Incident history')}</div><div class="tabpanel pad" role="tabpanel">${body}</div></section>`;
}

/* ---------- administration ---------- */
function admin() {
  const lvl = perms().admin, tabs = lvl === 'full' ? [['users', 'Users and roles'], ['sources', 'Data sources'], ['settings', 'System settings'], ['audit', 'Audit log']] : [['sources', 'Data sources'], ['rules', 'Detection rules']];
  if (!tabs.some((t) => t[0] === state.adminTab)) state.adminTab = tabs[0][0];
  const tab = state.adminTab, full = lvl === 'full';
  let body = '';
  if (tab === 'users') {
    body = `${REQUESTS.length ? card('Access requests', `<div class="list">${REQUESTS.map((r) => `<div class="li static col"><span class="li-main"><b>${esc(r.who)}</b><small>${esc(r.ask)} · ${relTs(r.at)}</small><small>${esc(r.reason)}</small></span><span class="row">${btn('Approve', 'approve-request', r.id, '', 'sm pri')}${btn('Deny', 'deny-request', r.id, '', 'sm')}</span></div>`).join('')}</div>`) : ''}
    <section class="card flush"><div class="toolbar between"><b>${USERS.length} users</b>${btn(ic('plus') + 'Invite user', 'invite-user', '', '', 'pri sm')}</div><div class="tbl-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last active</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${USERS.map((u) => `<tr><td><span class="row">${avatar(u.name)}<span><b>${esc(u.name)}</b><small>${esc(u.email)}</small></span></span></td><td><label class="sel"><span class="sr">Role for ${esc(u.name)}</span><select data-change="user-role" ${attr(u.id)} id="role-${u.id}" ${u.active ? '' : 'disabled'}>${Object.keys(ROLES).map((r) => `<option ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label></td><td>${pill(u.active ? 'Active' : 'Disabled')}</td><td>${esc(u.last)}</td><td>${btn(u.active ? 'Deactivate' : 'Reactivate', 'toggle-user', u.id, '', 'sm')}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  if (tab === 'sources') body = `<div class="grid g3">${DATA_SOURCES.map((s) => { const r = state.srcResult[s.id]; return `<section class="card src"><div class="ch"><h3>${dot(s.status)}${esc(s.name)}</h3>${pill(s.status[0].toUpperCase() + s.status.slice(1))}</div><dl class="kv"><div><dt>Type</dt><dd>${esc(s.type)}</dd></div><div><dt>Rate</dt><dd>${esc(s.rate)}</dd></div><div><dt>Last event</dt><dd>${esc(s.last)}</dd></div><div><dt>Lag</dt><dd>${esc(s.lag)}</dd></div></dl>${s.note ? `<p class="note sm">${ic('info')}${esc(s.note)}</p>` : ''}${r ? banner(r.kind, esc(r.msg)) : ''}<div class="row">${btn(state.testing[s.id] ? 'Testing…' : 'Test connection', 'test-src', s.id, '', 'sm', state.testing[s.id] ? 'disabled' : '')}${full ? btn(s.enabled ? 'Disable' : 'Enable', 'toggle-src', s.id, '', 'sm') : ''}</div></section>`; }).join('')}</div>${full ? '' : `<p class="note">${ic('lock')}Enabling or disabling sources is limited to IT Administrators.</p>`}`;
  if (tab === 'rules') body = `<section class="card flush"><div class="tbl-wrap"><table><thead><tr><th>Detection</th><th>Status</th><th class="num">Precision</th><th class="num">Alerts 24 h</th><th>Sensitivity</th><th>Last tuned</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${RULES.map((r) => `<tr><td><b>${esc(r.name)}</b><small class="mono">${esc(r.kind)}</small></td><td>${pill(r.status)}</td><td class="num">${r.precision}%</td><td class="num">${r.alerts24}</td><td>${esc(r.sens)} · ${r.thr}</td><td>${esc(r.tuned)}</td><td><span class="row">${btn('Tune', 'tune-rule', r.id, '', 'sm')}${btn(r.status === 'Disabled' ? 'Enable' : 'Disable', 'toggle-rule', r.id, '', 'sm')}</span></td></tr>`).join('')}</tbody></table></div></section>`;
  if (tab === 'settings') {
    const S = state.settingsDraft, dirty = JSON.stringify(S) !== JSON.stringify(SETTINGS);
    const sw = (id, label, help, bind, locked) => `<label class="switch ${locked ? 'locked' : ''}"><input type="checkbox" id="${id}" ${S[bind] ? 'checked' : ''} ${locked ? 'disabled' : `data-bind="settingsDraft.${bind}"`}><span class="sw-t"><b>${label}</b><small>${help}</small></span><i class="sw-k" aria-hidden="true"></i></label>`;
    body = `<div class="grid g2"><section class="card"><div class="ch"><h3>Security</h3></div><div class="field"><label for="st-to">Session timeout</label><select id="st-to" data-bind="settingsDraft.timeout">${['15', '30', '60'].map((v) => `<option value="${v}" ${S.timeout === v ? 'selected' : ''}>${v} minutes</option>`).join('')}</select></div>${sw('st-mfa', 'Require MFA for all roles', 'Applies at next sign-in.', 'mfa')}${sw('st-appr', 'Require analyst approval for response actions', 'Locked on by policy. AI suggestions can never run on their own.', 'approvalRequired', true)}${sw('st-mask', 'Mask sensitive values in evidence', 'Hides account secrets and personal data in previews.', 'mask')}</section>
    <section class="card"><div class="ch"><h3>Data and notifications</h3></div><div class="field"><label for="st-ret">Alert retention</label><select id="st-ret" data-bind="settingsDraft.retention">${['90', '180', '365'].map((v) => `<option value="${v}" ${S.retention === v ? 'selected' : ''}>${v} days</option>`).join('')}</select></div>${sw('st-ne', 'Email notifications', 'Critical alerts and approvals.', 'notifyEmail')}${sw('st-nc', 'Team chat notifications', 'New incidents and handoffs.', 'notifyChat')}${sw('st-np', 'Pager for critical incidents', 'Off outside on-call hours.', 'notifyPager')}</section></div>
    <div class="row sticky-save">${btn('Save changes', 'save-settings', '', '', 'pri', dirty ? '' : 'disabled')}${btn('Discard', 'discard-settings', '', '', '', dirty ? '' : 'disabled')}${dirty ? '<span class="dim">You have unsaved changes.</span>' : ''}</div>`;
  }
  if (tab === 'audit') { const f = state.auditFilter, l = AUDIT.filter((x) => f === 'all' || x.role === f).sort((a, b) => b.at - a.at); body = `<section class="card flush"><div class="toolbar"><label class="sel"><span class="sr">Filter by role</span><select id="au-f" data-bind="auditFilter"><option value="all">All roles</option>${Object.keys(ROLES).map((r) => `<option ${f === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label><span class="dim">${l.length} entries</span></div>${l.length ? `<div class="tbl-wrap"><table><thead><tr><th>Time</th><th>User</th><th>Role</th><th>Activity</th></tr></thead><tbody>${l.map((x) => `<tr><td class="mono nowrap">${fmtTs(x.at)}</td><td>${esc(x.who)}</td><td>${esc(x.role)}</td><td>${esc(x.text)}</td></tr>`).join('')}</tbody></table></div>` : empty('file', 'No entries for this role', 'Pick another role to see its activity.')}</section>`; }
  return `<div class="page-h"><div><h2>Administration</h2><p>${full ? 'Manage users and roles, data sources and system settings.' : 'Detection rules and data sources for your role.'}</p></div></div>${state.adminMsg ? banner('success', esc(state.adminMsg)) : ''}
  <div class="tabs" role="tablist" aria-label="Administration">${tabs.map((t) => `<button type="button" role="tab" class="tab" aria-selected="${tab === t[0]}" data-action="admin-tab" ${attr(t[0])}>${t[1]}</button>`).join('')}</div><div class="stack tabbody">${body}</div>`;
}

export { getAlert, getInc, perms, isDone, openAlerts, openIncs, attr, btn, NAV, access, loginScreen, shell, content, denied, crumbs, kpi, card, alertItem, incItem, srcItem, miniTbl, alertRows, alertTable, incTable, srcTable, more, pVolume, pTrend, pSeverity, pCritical, pRecent, pOpenInc, pSources, ovAnalyst, ovEngineer, ovIR, ovAdmin, overview, filteredAlerts, alertQueue, decisionOf, reviewedCount, investigation, checklistHtml, incidents, SEV_F, repModel, reports, admin };
