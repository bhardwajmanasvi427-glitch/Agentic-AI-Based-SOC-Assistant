import { ACTIONS, ALERTS, AUDIT, DATA_SOURCES, HANDOFFS, INCIDENTS, INC_SEQ, NOTIFS, REQUESTS, ROLES, RULES, SAVED_REPORTS, SETTINGS, SEV, USERS, ago, detailFor, mkChecklist } from './data.js';
import { state } from './state.js';
import { aiTag, banner, esc, fmtHM, fmtTs, ic, pill } from './ui.js';
import { access, admin, btn, content, denied, getAlert, getInc, incidents, investigation, isDone, loginScreen, openAlerts, overview, perms, reports, reviewedCount, shell } from './screens.js';

/* ============ State, modals, actions, render ============ */
const me = () => ROLES[state.user.role].person;
let loadTok = 0, toastId = 0, lastModal = false;

function toast(kind, msg) {
  const id = ++toastId; state.toasts.push({ id, kind, msg }); if (state.toasts.length > 3) state.toasts.shift(); render();
  setTimeout(() => { state.toasts = state.toasts.filter((t) => t.id !== id); render(); }, 4800);
}
function audit(text, incId) {
  AUDIT.unshift({ at: Date.now(), who: me(), role: state.user.role, text });
  const inc = incId && getInc(incId); if (inc) inc.audit.push({ at: Date.now(), who: me(), text });
}
function go(screen, patch) {
  const changed = screen !== state.screen;
  Object.assign(state, { ovMsg: null, queueMsg: null, invMsg: null, incMsg: null, adminMsg: null }, patch || {}, { screen, menu: null, navOpen: false });
  const tok = ++loadTok;
  state.loading = changed && ['overview', 'alerts', 'reports', 'incidents'].includes(screen) && access(screen);
  render(); window.scrollTo(0, 0);
  if (state.loading) setTimeout(() => { if (tok === loadTok) { state.loading = false; render(); } }, 420);
}
function setPath(path, val) { const p = path.split('.'); let o = state; while (p.length > 1) o = o[p.shift()]; o[p[0]] = val; }
function ensureIncident(a) {
  let inc = a.inc && getInc(a.inc);
  if (!inc) {
    inc = { id: 'INC-' + (++INC_SEQ.n), title: a.title, sev: a.sev, owner: me(), status: 'Investigating', alerts: [a.id], opened: Date.now(), assets: [a.host].concat(a.acct && a.acct !== 'n/a' ? [a.acct] : []), checklist: mkChecklist(0), notes: [], audit: [{ at: Date.now(), who: 'SOC Assistant', text: `Incident created from ${a.id}` }] };
    INCIDENTS.unshift(inc); a.inc = inc.id; audit(`Created ${inc.id} from ${a.id}`);
  }
  return inc;
}
const csvRows = (id) => { const rows = [['Incident', 'Title', 'Severity', 'Status', 'Owner', 'Opened']]; INCIDENTS.forEach((i) => rows.push([i.id, i.title, i.sev, i.status, i.owner, fmtTs(i.opened)])); return rows; };
function exportText(m) {
  const rows = csvRows(); const f = m.fmt || 'csv';
  if (f === 'json') return JSON.stringify(rows.slice(1).map((r) => ({ id: r[0], title: r[1], severity: r[2], status: r[3], owner: r[4], opened: r[5] })), null, 2);
  if (f === 'pdf') return 'PDF export is simulated in this prototype.\n\n' + rows.slice(1).map((r) => `${r[0]}  ${r[2].toUpperCase()}  ${r[3]}  ${r[1]}`).join('\n');
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/* ---------- modals ---------- */
function modalHtml() {
  const m = state.modal; if (!m) return '';
  const wrap = (title, body, foot) => `<div class="scrim2"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-t"><div class="m-h"><h2 id="m-t">${title}</h2><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close dialog">${ic('x')}</button></div><div class="m-b">${body}</div><div class="m-f">${foot}</div></div></div>`;
  const cancel = btn('Cancel', 'modal-close', '', '', '');
  const err = (t) => (t ? `<p class="err">${ic('warn')}${esc(t)}</p>` : '');
  const actOf = () => { const a = getAlert(m.aid); return { a, x: detailFor(a).actions.find((q) => q.id === m.xid) }; };
  if (m.type === 'approve') {
    const { a, x } = actOf(), rc = reviewedCount(a);
    return wrap('Approve response action?', `<div class="act act-ai"><div class="act-h"><b>${esc(x.title)}</b>${aiTag()}</div><p>${esc(x.desc)}</p><p class="risk">${ic('warn')}<span><b>Impact:</b> ${esc(x.risk)}</span></p></div>
      <p>Approving records your decision. The action is <b>not executed</b> until the Incident Response Team carries it out.</p>
      ${rc[0] < rc[1] ? banner('warn', `You have reviewed ${rc[0]} of ${rc[1]} evidence items for ${a.id}.`) : ''}
      <label class="check"><input type="checkbox" id="m-ack" data-bind="modal.ack" ${m.ack ? 'checked' : ''}><span>I reviewed the evidence and the AI rationale, and I approve this action.</span></label>`,
      cancel + btn('Approve action', 'modal-confirm', '', '', 'pri', m.ack ? '' : 'disabled'));
  }
  if (m.type === 'execute') {
    const { a, x } = actOf();
    return wrap('Mark action as executed?', `<div class="act act-ok"><div class="act-h"><b>${esc(x.title)}</b>${pill('Approved')}</div><p class="by">Approved by ${esc(ACTIONS[m.aid + ':' + m.xid].by)}</p></div><p>This prototype only simulates execution. No real system is changed. The audit trail will record that you carried out this action.</p><label class="check"><input type="checkbox" id="m-ack" data-bind="modal.ack" ${m.ack ? 'checked' : ''}><span>I carried out this action on ${esc(a.host)}.</span></label>`, cancel + btn('Mark executed', 'modal-confirm', '', '', 'pri', m.ack ? '' : 'disabled'));
  }
  if (m.type === 'dismissAction' || m.type === 'dismissAlert') {
    const isAlert = m.type === 'dismissAlert', a = getAlert(m.aid), x = isAlert ? null : actOf().x;
    const reasons = isAlert ? ['False positive', 'Expected activity', 'Duplicate of another alert', 'Other'] : ['Too disruptive for the business', 'Already handled another way', 'Not appropriate for this threat', 'Other'];
    return wrap(isAlert ? 'Dismiss this alert?' : 'Dismiss this suggestion?', `<p>${isAlert ? `<b>${esc(a.title)}</b> will be closed as dismissed. It stays in the audit trail.` : `<b>${esc(x.title)}</b> will be marked as dismissed. The assistant will not run it.`}</p><div class="field"><label for="m-reason">Reason</label><select id="m-reason" data-bind="modal.reason"><option value="">Select a reason</option>${reasons.map((r) => `<option ${m.reason === r ? 'selected' : ''}>${r}</option>`).join('')}</select>${err(m.err)}</div><div class="field"><label for="m-note">Note (optional)</label><textarea id="m-note" rows="2" data-bind="modal.note">${esc(m.note || '')}</textarea></div>`, cancel + btn(isAlert ? 'Dismiss alert' : 'Dismiss suggestion', 'modal-confirm', '', '', 'dng'));
  }
  if (m.type === 'tune') {
    const r = RULES.find((q) => q.id === m.rid);
    return wrap('Tune detection', `<p><b>${esc(r.name)}</b><br><small class="dim">${esc(r.kind)} · precision ${r.precision}% · ${r.alerts24} alerts in 24 h</small></p><div class="field"><label for="m-sens">Sensitivity</label><select id="m-sens" data-bind="modal.sens">${['Low', 'Medium', 'High'].map((s) => `<option ${m.sens === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div class="field"><label for="m-thr">Alert threshold (1 to 100)</label><input id="m-thr" type="number" min="1" max="100" value="${esc(m.thr)}" data-bind="modal.thr">${err(m.err)}<p class="hint">A higher threshold raises fewer alerts.</p></div>`, cancel + btn('Save tuning', 'modal-confirm', '', '', 'pri'));
  }
  if (m.type === 'invite') {
    return wrap('Invite user', `<div class="field"><label for="m-name">Full name</label><input id="m-name" value="${esc(m.name)}" data-bind="modal.name" autocomplete="off">${err(m.errs.name)}</div><div class="field"><label for="m-email">Work email</label><input id="m-email" type="email" value="${esc(m.email)}" data-bind="modal.email" autocomplete="off">${err(m.errs.email)}</div><div class="field"><label for="m-role">Role</label><select id="m-role" data-bind="modal.role">${Object.keys(ROLES).map((r) => `<option ${m.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>`, cancel + btn('Send invite', 'modal-confirm', '', '', 'pri'));
  }
  if (m.type === 'roleChange') {
    const u = USERS.find((q) => q.id === m.uid);
    return wrap('Change role?', `<p><b>${esc(u.name)}</b> will change from <b>${esc(u.role)}</b> to <b>${esc(m.role)}</b>. Their dashboards and permissions change at the next sign-in.</p>`, cancel + btn('Change role', 'modal-confirm', '', '', 'pri'));
  }
  if (m.type === 'src') {
    const s = DATA_SOURCES.find((q) => q.id === m.sid);
    return wrap(esc(s.name), `<dl class="kv">${[['Status', s.status], ['Type', s.type], ['Rate', s.rate], ['Last event', s.last], ['Ingestion lag', s.lag], ['Enabled', s.enabled ? 'Yes' : 'No']].map((x) => `<div><dt>${x[0]}</dt><dd>${esc(x[1])}</dd></div>`).join('')}</dl>${s.note ? banner(s.status === 'error' ? 'error' : 'warn', esc(s.note)) : ''}${perms().admin ? '' : `<p class="note">${ic('lock')}Only engineers and administrators can manage data sources.</p>`}`, cancel + (perms().admin ? btn('Open in Administration', 'modal-goto-sources', '', '', 'pri') : ''));
  }
  if (m.type === 'report') {
    const r = SAVED_REPORTS.find((q) => q.id === m.rid), t = INCIDENTS.length;
    return wrap(esc(r.name), `<p>${esc(r.note)}</p><dl class="kv">${[['Range', r.range], ['Owner', r.owner], ['Last run', fmtTs(r.last)], ['Incidents covered', t], ['Critical', INCIDENTS.filter((i) => i.sev === 'critical').length], ['Resolved or closed', INCIDENTS.filter((i) => isDone(i.status)).length]].map((x) => `<div><dt>${x[0]}</dt><dd>${esc(x[1])}</dd></div>`).join('')}</dl><p class="note sm">${ic('info')}Demonstration summary. Figures come from the fictional data in this prototype.</p>`, cancel + btn(ic('download') + 'Export', 'rep-export', r.id, '', 'pri'));
  }
  if (m.type === 'export') {
    return wrap('Export preview', `<div class="field"><label for="m-fmt">Format</label><select id="m-fmt" data-bind="modal.fmt">${[['csv', 'CSV'], ['json', 'JSON'], ['pdf', 'PDF (simulated)']].map((f) => `<option value="${f[0]}" ${m.fmt === f[0] ? 'selected' : ''}>${f[1]}</option>`).join('')}</select></div><div class="field"><label for="m-out">Content</label><textarea id="m-out" rows="9" readonly class="mono">${esc(exportText(m))}</textarea></div><p class="note sm">${ic('info')}File downloads are not available in this prototype. Copy the content instead.</p>`, cancel + btn(ic('copy') + 'Copy to clipboard', 'copy-export', '', '', 'pri'));
  }
  return '';
}

/* ---------- actions ---------- */
const ACT = {
  'toggle-pw': () => { state.login.show = !state.login.show; render(); },
  signout: () => { Object.assign(state, { user: null, menu: null, modal: null, navOpen: false, screen: 'overview' }); state.login = { role: '', pw: '', show: false, err: {}, busy: false }; render(); },
  'switch-role': (r) => { state.user = { role: r }; state.af.mine = false; state.modal = null; go('overview', { adminTab: ROLES[r].can.admin === 'rules' ? 'sources' : 'users' }); toast('info', `Switched to ${r} (demo).`); },
  menu: (a) => { state.menu = state.menu === a ? null : a; render(); },
  'nav-toggle': () => { state.navOpen = !state.navOpen; render(); },
  nav: (a) => { if (a === 'investigation' && !state.alertId) state.alertId = (openAlerts().find((x) => x.sev === 'critical') || ALERTS[0]).id; go(a); },
  'goto-alerts': (a) => { Object.assign(state.af, { q: '', sev: 'all', status: 'all', source: 'all', assignee: 'all', mine: false }); if (a === 'mine') state.af.mine = true; else if (SEV[a]) state.af.sev = a; go('alerts'); },
  'goto-admin': (a) => go('admin', { adminTab: a }),
  ovsys: () => { const el = document.getElementById('sys-health'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
  'refresh-overview': () => { state.loading = true; render(); const t = ++loadTok; setTimeout(() => { if (t === loadTok) { state.loading = false; state.ovMsg = `Dashboard refreshed at ${fmtHM(Date.now())}. Demo data does not change.`; render(); } }, 500); },
  'open-alert': (id) => { state.alertId = id; state.invTab = 'timeline'; audit(`Opened ${id}`); go('investigation'); },
  'open-inc': (id) => go('incidents', { incId: id, statusDraft: '', noteDraft: '', noteErr: '', incFilter: isDone((getInc(id) || {}).status) && state.incFilter === 'open' ? 'all' : state.incFilter }),
  'open-notif': (id) => { const n = NOTIFS.find((x) => x.id === id); n.read = true; const [s, arg] = n.go; if (s === 'investigation' && access('alerts')) ACT['open-alert'](arg); else if (s === 'incidents' && access('incidents')) ACT['open-inc'](arg); else if (s === 'admin') go('admin', { adminTab: arg }); else if (s === 'reports') go('reports', { repTab: arg }); else go('overview'); },
  sort: (k) => { const f = state.af; if (f.sort === k) f.dir = f.dir === 'asc' ? 'desc' : 'asc'; else { f.sort = k; f.dir = ['sev', 'conf', 'time'].includes(k) ? 'desc' : 'asc'; } render(); },
  'sev-chip': (s) => { state.af.sev = s; render(); },
  'mine-toggle': () => { state.af.mine = !state.af.mine; render(); },
  'clear-filters': () => { Object.assign(state.af, { q: '', sev: 'all', status: 'all', source: 'all', assignee: 'all', mine: false }); state.gq = ''; render(); },
  'refresh-alerts': () => { state.refreshing = true; render(); setTimeout(() => { state.refreshing = false; state.queueMsg = `Queue refreshed at ${fmtHM(Date.now())}. No new alerts in this demo.`; render(); }, 700); },
  'inv-tab': (k) => { state.invTab = k; render(); },
  'ack-evidence': (aid, eid) => { const r = (state.reviewed[aid] = state.reviewed[aid] || {}); r[eid] = !r[eid]; render(); },
  'ask-approve': (aid, xid) => { state.modal = { type: 'approve', aid, xid, ack: false }; render(); },
  'ask-dismiss-action': (aid, xid) => { state.modal = { type: 'dismissAction', aid, xid, reason: '', note: '', err: '' }; render(); },
  'ask-dismiss-alert': (aid) => { state.modal = { type: 'dismissAlert', aid, reason: '', note: '', err: '' }; render(); },
  'ask-execute': (aid, xid) => { state.modal = { type: 'execute', aid, xid, ack: false }; render(); },
  'modal-close': () => { state.modal = null; render(); },
  'modal-goto-sources': () => { state.modal = null; go('admin', { adminTab: 'sources' }); },
  'modal-confirm': () => confirmModal(),
  'inc-filter': (f) => { state.incFilter = f; render(); },
  'toggle-check': (iid, cid) => { const i = getInc(iid), c = i.checklist.find((x) => x.id === cid); c.done = !c.done; audit(`${c.done ? 'Completed' : 'Reopened'} checklist item: ${c.label}`, iid); render(); },
  'add-note': (iid) => { const t = state.noteDraft.trim(); if (!t) { state.noteErr = 'Write a note before adding it.'; render(); return; } getInc(iid).notes.push({ by: me(), role: state.user.role, at: Date.now(), text: t }); audit('Added a note', iid); state.noteDraft = ''; state.noteErr = ''; toast('success', 'Note added to the incident.'); },
  'update-status': (iid) => {
    const i = getInc(iid), to = state.statusDraft || i.status, from = i.status;
    if (to === 'Resolved' && i.checklist.some((c) => !c.done)) { state.incMsg = { kind: 'error', html: `<b>Status not changed.</b> Complete the containment checklist (${i.checklist.filter((c) => !c.done).length} items left) before marking ${i.id} as Resolved.` }; render(); return; }
    if (to === 'Closed' && from !== 'Resolved') { state.incMsg = { kind: 'error', html: `<b>Status not changed.</b> An incident must be Resolved before it can be Closed.` }; render(); return; }
    i.status = to; state.statusDraft = ''; audit(`Status changed from ${from} to ${to}`, iid);
    if (to === 'Resolved' || to === 'Closed') i.alerts.forEach((id) => { const al = getAlert(id); if (al && al.status !== 'Dismissed') al.status = 'Resolved'; });
    state.incMsg = { kind: 'success', html: `<b>${i.id} is now ${to}.</b> The change is saved to the audit trail.`, cta: btn('Return to dashboard', 'nav', 'overview', '', 'sm pri') };
    toast('success', `${i.id} status updated to ${to}.`);
  },
  'accept-handoff': (id) => { const h = HANDOFFS.find((x) => x.id === id); h.accepted = true; audit(`Accepted handoff for ${h.inc}`, h.inc); toast('success', `Handoff for ${h.inc} accepted.`); },
  'approve-request': (id) => { const r = REQUESTS.find((x) => x.id === id); REQUESTS.splice(REQUESTS.indexOf(r), 1); audit(`Approved access request from ${r.who}`); state.adminMsg = `Approved: ${r.ask} for ${r.who}.`; toast('success', `Access approved for ${r.who}.`); },
  'deny-request': (id) => { const r = REQUESTS.find((x) => x.id === id); REQUESTS.splice(REQUESTS.indexOf(r), 1); audit(`Denied access request from ${r.who}`); toast('info', `Request from ${r.who} denied.`); },
  'src-detail': (id) => { state.modal = { type: 'src', sid: id }; render(); },
  'test-src': (id) => { state.testing[id] = true; delete state.srcResult[id]; render(); setTimeout(() => { const s = DATA_SOURCES.find((x) => x.id === id); delete state.testing[id]; const res = { healthy: ['success', 'Connection test passed. Round trip 38 ms.'], degraded: ['warn', 'Connected, but ingestion lag is 9 minutes, above the 5 minute threshold.'], error: ['error', 'Connection works, but the parser rejects 4.1% of events. Check the log format mapping.'], disconnected: ['error', 'Could not reach the source. It is disabled or offline.'] }[s.status]; state.srcResult[id] = { kind: res[0], msg: res[1] }; toast(res[0] === 'success' ? 'success' : res[0], `${s.name}: ${res[0] === 'success' ? 'connection OK' : res[0] === 'warn' ? 'connected with warnings' : 'test failed'}.`); }, 900); },
  'toggle-src': (id) => { const s = DATA_SOURCES.find((x) => x.id === id); s.enabled = !s.enabled; s.status = s.enabled ? 'healthy' : 'disconnected'; s.note = s.enabled ? '' : 'Disabled by IT just now.'; s.rate = s.enabled ? '1.2k ev/s' : '0 ev/s'; s.last = s.enabled ? '1 s ago' : 'just now'; delete state.srcResult[id]; audit(`${s.enabled ? 'Enabled' : 'Disabled'} data source: ${s.name}`); toast('success', `${s.name} ${s.enabled ? 'enabled' : 'disabled'}.`); },
  'toggle-rule': (id) => { const r = RULES.find((x) => x.id === id); r.status = r.status === 'Disabled' ? 'Active' : 'Disabled'; audit(`${r.status === 'Active' ? 'Enabled' : 'Disabled'} rule: ${r.name}`); toast('success', `${r.name} ${r.status === 'Active' ? 'enabled' : 'disabled'}.`); },
  'tune-rule': (id) => { if (perms().admin !== 'rules') { toast('error', 'Access denied. Only Cybersecurity Engineers can tune detections.'); return; } const r = RULES.find((x) => x.id === id); state.modal = { type: 'tune', rid: id, sens: r.sens, thr: r.thr, err: '' }; render(); },
  'invite-user': () => { state.modal = { type: 'invite', name: '', email: '', role: 'SOC Analyst', errs: {} }; render(); },
  'toggle-user': (id) => { const u = USERS.find((x) => x.id === id); u.active = !u.active; audit(`${u.active ? 'Reactivated' : 'Deactivated'} user ${u.name}`); toast('success', `${u.name} ${u.active ? 'reactivated' : 'deactivated'}.`); },
  'rep-tab': (t) => { state.repTab = t; render(); },
  'rep-reset': () => { Object.assign(state, { repSev: 'all', repSrc: 'all' }); render(); },
  'rep-run': (id) => { state.running = id; render(); setTimeout(() => { SAVED_REPORTS.find((r) => r.id === id).last = Date.now(); state.running = null; toast('success', 'Report finished. Last run time updated.'); }, 1100); },
  'rep-open': (id) => { state.modal = { type: 'report', rid: id }; render(); },
  'rep-export': (id) => { state.modal = { type: 'export', rid: id, fmt: 'csv' }; render(); },
  'copy-export': () => { const txt = exportText(state.modal); const done = () => toast('success', 'Export copied to the clipboard.'); const fb = () => { const t = document.getElementById('m-out'); if (t) { t.focus(); t.select(); } toast('info', 'Select the text and copy it with your keyboard.'); }; try { navigator.clipboard.writeText(txt).then(done, fb); } catch (e) { fb(); } },
  'admin-tab': (t) => { state.adminTab = t; state.adminMsg = null; render(); },
  'save-settings': () => { Object.assign(SETTINGS, state.settingsDraft); audit('Saved system settings'); state.adminMsg = 'System settings saved.'; toast('success', 'System settings saved.'); },
  'discard-settings': () => { state.settingsDraft = Object.assign({}, SETTINGS); render(); },
};
const CHG = {
  'assign-alert': (id, v) => { const a = getAlert(id); a.assignee = v; audit(`Assigned ${id} to ${v}`); toast('success', `${id} assigned to ${v}.`); },
  'inc-owner': (id, v) => { const i = getInc(id); i.owner = v; audit(`Owner changed to ${v}`, id); toast('success', `${id} owner is now ${v}.`); },
  'user-role': (id, v) => { const u = USERS.find((x) => x.id === id); if (u.role === v) return; state.modal = { type: 'roleChange', uid: id, role: v }; render(); },
};

function confirmModal() {
  const m = state.modal, key = m.aid + ':' + m.xid;
  if (m.type === 'approve') {
    if (!m.ack) return;
    const a = getAlert(m.aid), x = detailFor(a).actions.find((q) => q.id === m.xid), wasNew = !a.inc;
    ACTIONS[key] = { status: 'approved', by: me(), at: Date.now() };
    if (a.status === 'New') a.status = 'Investigating';
    const inc = ensureIncident(a); audit(`Approved response action: ${x.title}`, inc.id);
    const msg = { kind: 'success', html: `<b>Approved by you.</b> “${esc(x.title)}” is recorded as analyst-approved and has not been executed yet. ${wasNew ? `Incident ${inc.id} was created.` : `${inc.id} was updated.`} Next, update the incident status.`, cta: btn('Open ' + inc.id, 'open-inc', inc.id, '', 'sm pri') };
    if (state.screen === 'investigation') state.invMsg = msg; else state.incMsg = msg;
    state.modal = null; toast('success', 'Response action approved. Not executed yet.'); return;
  }
  if (m.type === 'execute') {
    if (!m.ack) return;
    const a = getAlert(m.aid), x = detailFor(a).actions.find((q) => q.id === m.xid), prev = ACTIONS[key];
    ACTIONS[key] = { status: 'executed', by: me(), at: Date.now(), approvedBy: prev.by };
    audit(`Executed (simulated): ${x.title}`, a.inc); state.modal = null; toast('success', 'Marked as executed (simulated).'); return;
  }
  if (m.type === 'dismissAction') {
    if (!m.reason) { m.err = 'Select a reason to dismiss this suggestion.'; render(); return; }
    const a = getAlert(m.aid), x = detailFor(a).actions.find((q) => q.id === m.xid);
    ACTIONS[key] = { status: 'dismissed', by: me(), at: Date.now(), reason: m.reason };
    audit(`Dismissed suggestion: ${x.title} (${m.reason})`, a.inc); state.modal = null; toast('info', 'Suggestion dismissed.'); return;
  }
  if (m.type === 'dismissAlert') {
    if (!m.reason) { m.err = 'Select a reason to dismiss this alert.'; render(); return; }
    const a = getAlert(m.aid); a.status = 'Dismissed'; audit(`Dismissed ${a.id} (${m.reason})`, a.inc);
    state.invMsg = { kind: 'success', html: `<b>${a.id} was dismissed.</b> Reason: ${esc(m.reason)}. It remains in the audit trail.`, cta: btn('Return to Alert Queue', 'nav', 'alerts', '', 'sm pri') };
    state.modal = null; toast('info', `${a.id} dismissed.`); return;
  }
  if (m.type === 'tune') {
    const n = Number(m.thr);
    if (!m.thr || isNaN(n) || n < 1 || n > 100) { m.err = 'Enter a threshold from 1 to 100.'; render(); return; }
    const r = RULES.find((q) => q.id === m.rid); r.sens = m.sens; r.thr = n; r.tuned = 'Today'; audit(`Tuned detection: ${r.name}`);
    state.modal = null; toast('success', `${r.name} tuned. Changes apply to new events.`); return;
  }
  if (m.type === 'invite') {
    m.errs = {}; if (!m.name.trim()) m.errs.name = 'Enter the person\'s full name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.email.trim())) m.errs.email = 'Enter a valid email address, like name@example.test.';
    if (m.errs.name || m.errs.email) { render(); return; }
    USERS.push({ id: 'u' + (USERS.length + 1), name: m.name.trim(), email: m.email.trim(), role: m.role, active: true, last: 'never' });
    audit(`Invited ${m.name.trim()} as ${m.role}`); state.modal = null; toast('success', `Invitation sent to ${m.email.trim()} (demo).`); return;
  }
  if (m.type === 'roleChange') {
    const u = USERS.find((x) => x.id === m.uid); audit(`Changed role for ${u.name}: ${u.role} to ${m.role}`); u.role = m.role; state.modal = null; toast('success', `${u.name} is now ${m.role}.`);
  }
}

/* ---------- render ---------- */
const appEl = () => document.getElementById('app');
function render() {
  const ae = document.activeElement, keep = ae && ae.id && ae.matches && ae.matches('input,textarea,select') && ae.closest('#app') ? { id: ae.id, s: ae.selectionStart, e: ae.selectionEnd } : null;
  const toasts = `<div class="toasts" aria-live="polite">${state.toasts.map((t) => `<div class="toast t-${t.kind}">${ic(t.kind === 'success' ? 'check' : t.kind === 'info' ? 'info' : 'warn')}<span>${esc(t.msg)}</span></div>`).join('')}</div>`;
  appEl().innerHTML = (state.user ? shell() : loginScreen()) + modalHtml() + toasts;
  if (state.modal && !lastModal) { const f = appEl().querySelector('.m-b input, .m-b select, .m-b textarea, .m-f .btn'); if (f) f.focus(); }
  else if (keep) { const el = document.getElementById(keep.id); if (el) { el.focus(); try { if (keep.s != null) el.setSelectionRange(keep.s, keep.e); } catch (x) { /* not a text input */ } } }
  lastModal = !!state.modal;
}

document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('scrim2')) { state.modal = null; render(); return; }
  const t = e.target.closest('[data-action]');
  if (!t || t.disabled || t.getAttribute('aria-disabled') === 'true') { if (state.menu && !e.target.closest('.pop')) { state.menu = null; render(); } return; }
  const act = t.dataset.action;
  if (state.menu && act !== 'menu' && !e.target.closest('.pop')) state.menu = null;
  if (ACT[act]) ACT[act](t.dataset.a, t.dataset.b, t);
});
document.addEventListener('input', (e) => {
  const t = e.target; if (!t.dataset || !t.dataset.bind) return;
  const v = t.type === 'checkbox' ? t.checked : t.value;
  setPath(t.dataset.bind, v);
  if (t.dataset.bind === 'login.role') state.login.err.role = '';
  if (t.dataset.bind === 'login.pw') state.login.err.pw = '';
  if (t.dataset.bind === 'modal.reason' || t.dataset.bind === 'modal.thr') state.modal.err = '';
  if (t.dataset.bind === 'modal.name') state.modal.errs.name = ''; if (t.dataset.bind === 'modal.email') state.modal.errs.email = '';
  if (t.dataset.bind === 'noteDraft') state.noteErr = '';
  render();
});
document.addEventListener('change', (e) => { const t = e.target; if (t.dataset && t.dataset.change && CHG[t.dataset.change]) { CHG[t.dataset.change](t.dataset.a, t.value); render(); } });
document.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.dataset.form !== 'signin') return;
  const L = state.login; L.err = {};
  if (!L.role) L.err.role = 'Select a role to continue.';
  if (!L.pw) L.err.pw = 'Enter the password.'; else if (L.pw !== '1234') L.err.pw = 'Incorrect password. Check it and try again.';
  if (L.err.role || L.err.pw) { render(); return; }
  L.busy = true; render();
  setTimeout(() => { state.user = { role: L.role }; L.busy = false; L.pw = ''; go('overview', { adminTab: ROLES[L.role].can.admin === 'rules' ? 'sources' : 'users' }); toast('success', `Signed in as ${ROLES[L.role].person}, ${L.role}.`); }, 650);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (state.modal) { state.modal = null; render(); } else if (state.menu || state.navOpen) { state.menu = null; state.navOpen = false; render(); } }
  if (e.key === 'Enter' && e.target.id === 'gs-q' && state.user && perms().alerts) { e.preventDefault(); Object.assign(state.af, { q: state.gq, sev: 'all', status: 'all', source: 'all', assignee: 'all', mine: false }); go('alerts'); }
});
render();
