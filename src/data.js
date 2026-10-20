/* ============ Fictional demo data. Nothing here is real, and nothing leaves the page. ============ */
const MIN = 60000;
const NOW = Date.now();
const ago = (m) => NOW - m * MIN;

const ROLES = {
  'SOC Analyst': { key: 'analyst', person: 'Priya Nair', blurb: 'Triage alerts, review evidence and approve response actions.',
    can: { alerts: 'edit', approve: true, incidents: 'edit', execute: false, admin: false } },
  'Cybersecurity Engineer': { key: 'engineer', person: 'Rohan Kulkarni', blurb: 'Tune detections and keep data sources healthy.',
    can: { alerts: 'view', approve: false, incidents: 'view', execute: false, admin: 'rules' } },
  'Incident Response Team': { key: 'ir', person: 'Meera Shah', blurb: 'Contain and recover from approved incidents.',
    can: { alerts: 'view', approve: false, incidents: 'edit', execute: true, admin: false } },
  'IT Administrator': { key: 'admin', person: 'Dev Malhotra', blurb: 'Manage access, data sources and system settings.',
    can: { alerts: false, approve: false, incidents: false, execute: false, admin: 'full' } },
};
const SEV = { critical: { label: 'Critical', rank: 4 }, high: { label: 'High', rank: 3 }, medium: { label: 'Medium', rank: 2 }, low: { label: 'Low', rank: 1 } };
const SOURCES = ['Firewall', 'Endpoint', 'Identity', 'Cloud', 'Network', 'Application'];
const ALERT_STATUS = ['New', 'Investigating', 'Escalated', 'Resolved', 'Dismissed'];
const INC_STATUS = ['New', 'Investigating', 'Contained', 'Resolved', 'Closed'];
const ANALYSTS = ['Priya Nair', 'Karan Iyer', 'Sana Qureshi'];

const ALERTS = [
  { id: 'ALR-2041', title: 'Ransomware staging behaviour on FIN-FS-02', sev: 'critical', conf: 96, source: 'Endpoint', min: 14, status: 'Investigating', assignee: 'Priya Nair', host: 'FIN-FS-02', acct: 'svc-finshare', ip: '192.0.2.77', rule: 'Mass file rename + shadow copy deletion', inc: 'INC-318',
    blurb: 'The finance file server renamed 4,213 files in six minutes and deleted its volume shadow copies, after an unusual interactive sign-in by a service account.' },
  { id: 'ALR-2040', title: 'Impossible travel, then privileged sign-in for svc-backup', sev: 'critical', conf: 91, source: 'Identity', min: 31, status: 'New', assignee: 'Priya Nair', host: 'IDP-GW-01', acct: 'svc-backup', ip: '198.51.100.61', rule: 'Impossible travel + privilege use',
    blurb: 'The backup service account signed in from two countries 11 minutes apart, then used a privileged role it has never used before.' },
  { id: 'ALR-2033', title: 'Large outbound transfer from DB-PRD-03 to a rare network', sev: 'critical', conf: 88, source: 'Network', min: 128, status: 'Escalated', assignee: 'Karan Iyer', host: 'DB-PRD-03', acct: 'dbsvc-prod', ip: '203.0.113.88', rule: 'Outbound volume anomaly', inc: 'INC-317',
    blurb: 'The production database server sent 38 GB to an address range it has never contacted, outside the nightly backup window.' },
  { id: 'ALR-2039', title: 'Brute-force pattern on VPN gateway', sev: 'high', conf: 88, source: 'Firewall', min: 47, status: 'New', assignee: 'Unassigned', host: 'VPN-GW-01', acct: 'multiple accounts', ip: '198.51.100.23', rule: 'Repeated auth failures by source',
    blurb: 'One external address attempted 1,860 sign-ins across 142 accounts in 20 minutes.' },
  { id: 'ALR-2037', title: 'Encoded PowerShell command on HR-LT-114', sev: 'high', conf: 84, source: 'Endpoint', min: 73, status: 'Investigating', assignee: 'Priya Nair', host: 'HR-LT-114', acct: 'a.menon', ip: '10.30.8.114', rule: 'Suspicious script execution',
    blurb: 'A document macro launched PowerShell with an encoded command that contacts an uncommon domain.' },
  { id: 'ALR-2035', title: 'New admin account created outside change window', sev: 'high', conf: 79, source: 'Identity', min: 95, status: 'New', assignee: 'Sana Qureshi', host: 'IDP-GW-01', acct: 'adm-temp07', ip: '10.10.2.40', rule: 'Privileged account creation',
    blurb: 'A domain admin account was created at 03:12 with no matching change ticket.' },
  { id: 'ALR-2031', title: 'Cloud storage bucket made public: invoices-archive', sev: 'high', conf: 90, source: 'Cloud', min: 210, status: 'Investigating', assignee: 'Sana Qureshi', host: 'invoices-archive', acct: 'role/ci-deploy', ip: '192.0.2.140', rule: 'Public exposure of storage', inc: 'INC-315',
    blurb: 'A deployment role changed the bucket policy to allow public reads on 18,400 invoice objects.' },
  { id: 'ALR-2038', title: 'Unusual DNS TXT query volume from DNS-RES-02', sev: 'medium', conf: 67, source: 'Network', min: 58, status: 'New', assignee: 'Unassigned', host: 'DNS-RES-02', acct: 'n/a', ip: '10.10.5.12', rule: 'DNS tunnelling heuristic',
    blurb: 'TXT lookups to one domain rose 14x over the 7-day baseline, with long, high-entropy subdomains.' },
  { id: 'ALR-2034', title: 'Burst of failed MFA prompts for three users', sev: 'medium', conf: 62, source: 'Identity', min: 112, status: 'New', assignee: 'Priya Nair', host: 'IDP-GW-01', acct: 'j.dsouza, r.bhat, t.sen', ip: '198.51.100.9', rule: 'MFA fatigue pattern',
    blurb: 'Three users received 9 to 14 push prompts each within 15 minutes, with no approvals.' },
  { id: 'ALR-2029', title: 'Rare process chain: winword.exe to cmd.exe on MKT-LT-031', sev: 'medium', conf: 71, source: 'Endpoint', min: 260, status: 'Investigating', assignee: 'Karan Iyer', host: 'MKT-LT-031', acct: 'l.pillai', ip: '10.30.2.31', rule: 'Office spawning shell',
    blurb: 'A Word document started a command shell, which has not happened on this laptop in the past 90 days.' },
  { id: 'ALR-2030', title: 'Outdated TLS version negotiated by APP-WEB-04', sev: 'medium', conf: 58, source: 'Application', min: 330, status: 'Resolved', assignee: 'Sana Qureshi', host: 'APP-WEB-04', acct: 'n/a', ip: '10.40.1.4', rule: 'Weak protocol use',
    blurb: 'A legacy client negotiated TLS 1.0 with the web tier. The client has since been upgraded.' },
  { id: 'ALR-2032', title: 'Port scan from approved internal scanner', sev: 'low', conf: 44, source: 'Network', min: 410, status: 'Dismissed', assignee: 'Karan Iyer', host: 'SCAN-INT-01', acct: 'n/a', ip: '10.10.9.5', rule: 'Port scan heuristic',
    blurb: 'The scan matches the weekly vulnerability assessment window and a known scanner address.' },
  { id: 'ALR-2028', title: 'Single failed sign-in on KIOSK-02', sev: 'low', conf: 35, source: 'Endpoint', min: 520, status: 'New', assignee: 'Unassigned', host: 'KIOSK-02', acct: 'kiosk', ip: '10.50.0.2', rule: 'Failed local logon',
    blurb: 'One failed local sign-in on a lobby kiosk, with no follow-up activity.' },
  { id: 'ALR-2026', title: 'TLS certificate expires in 14 days on PORTAL-TLS-01', sev: 'low', conf: 52, source: 'Application', min: 690, status: 'New', assignee: 'Sana Qureshi', host: 'PORTAL-TLS-01', acct: 'n/a', ip: '10.40.1.20', rule: 'Certificate expiry',
    blurb: 'The customer portal certificate expires on the 2nd. Renewal has not been requested.' },
];
ALERTS.forEach((a) => { a.ts = ago(a.min); });

/* ---- per-source templates used to build investigation detail for every alert ---- */
const TEMPLATES = {
  Endpoint: {
    tl: [[38, 'Unusual interactive sign-in on {host} by {acct}'], [22, 'A process started from a user-writable folder'], [9, 'Child processes and file activity left the host baseline'], [0, 'Alert raised and queued for review']],
    ev: [[30, 'Identity', 'Sign-in to {host} by {acct} from a workstation never used before'], [18, 'Endpoint', 'Unsigned binary executed from a temp directory on {host}'], [11, 'Endpoint', 'Outbound connection from {host} to {ip}'], [6, 'Network', 'DNS lookups for a domain first seen 3 days ago']],
    ti: [['Unsigned binary hash 4be1…c07d', 'File hash', 'Demo Threat Feed A', 'Suspicious', 61, '6 days ago'], ['{ip}', 'IP address', 'Demo Threat Feed B', 'Suspicious', 58, '12 days ago']],
    evd: [['Process tree', 'Parent and child processes on {host}', 'Shows the launch chain, command lines and the account that started each step.'], ['File activity', 'File writes and renames on {host}', 'Lists the paths touched in the 10 minutes around the alert.'], ['Authentication log', 'Sign-ins for {acct}', 'Compares today\'s sign-ins with the previous 30 days.']],
    act: [['Isolate {host} from the network', 'Cuts all network access except the management channel so the host can still be investigated.', 'Users of {host} lose access until it is restored.'], ['Collect a forensic triage package', 'Captures memory, running processes and recent logs to the case store.', 'Low impact. Adds about 5 minutes of load.'], ['Quarantine the suspicious binary', 'Moves the file to quarantine and blocks its hash on all endpoints.', 'A legitimate tool with the same hash would also be blocked.']],
  },
  Identity: {
    tl: [[40, 'First sign-in for {acct} from a new location'], [25, 'Second sign-in from another country'], [11, 'Role elevation requested for {acct}'], [0, 'Alert raised and queued for review']],
    ev: [[40, 'Identity', 'Successful sign-in for {acct} from {ip}'], [29, 'Identity', 'Second sign-in for {acct} from a different country'], [12, 'Identity', 'Role assignment changed for {acct}'], [5, 'Application', 'First access to the finance API by {acct}']],
    ti: [['{ip}', 'IP address', 'Demo Threat Feed B', 'Suspicious', 66, '4 days ago']],
    evd: [['Sign-in log', 'Sign-ins for {acct}, last 24 hours', 'Shows IP, location, device and result for each sign-in.'], ['Role change record', 'Directory audit entry for {acct}', 'Shows who or what made the change and the ticket reference, if any.']],
    act: [['Revoke active sessions for {acct}', 'Signs the account out everywhere and invalidates refresh tokens.', 'Any job using the account will fail until it signs in again.'], ['Require credential reset and MFA re-enrolment', 'Forces a new secret and a fresh MFA registration at the next sign-in.', 'Dependent services need the new secret.'], ['Temporarily disable {acct}', 'Blocks all sign-ins until an engineer re-enables the account.', 'High impact if the account runs scheduled work.']],
  },
  Network: {
    tl: [[55, 'Traffic from {host} started to rise above baseline'], [30, 'First connection from {host} to {ip}'], [10, 'Transfer volume crossed the anomaly threshold'], [0, 'Alert raised and queued for review']],
    ev: [[50, 'Network', 'Flow records show {host} sending data to {ip}'], [32, 'Firewall', 'Outbound session allowed to {ip} on port 443'], [14, 'Network', 'Connection duration 7x longer than the baseline'], [4, 'Endpoint', 'Backup agent was idle during the transfer']],
    ti: [['{ip}', 'IP address', 'Demo Threat Feed A', 'Malicious', 78, '2 days ago'], ['AS64500 (fictional)', 'Network range', 'Demo Threat Feed B', 'Suspicious', 55, '9 days ago']],
    evd: [['Flow summary', 'Top talkers for {host}', 'Bytes and sessions per destination, last 6 hours.'], ['Firewall rule hit', 'Rule that allowed the session', 'Shows which rule permitted the outbound traffic.']],
    act: [['Block {ip} at the perimeter firewall', 'Adds a deny rule for the address and its /24 range.', 'Blocks any legitimate service in the same range.'], ['Rate-limit outbound traffic from {host}', 'Caps outbound bandwidth while the transfer is examined.', 'May slow replication jobs on {host}.'], ['Capture packets for 15 minutes', 'Records traffic between {host} and {ip} for later analysis.', 'Low impact. Uses sensor storage.']],
  },
  Firewall: {
    tl: [[30, 'Failed sign-ins began from {ip}'], [18, 'Rate rose above 60 attempts per minute'], [6, 'Spray pattern detected across many accounts'], [0, 'Alert raised and queued for review']],
    ev: [[28, 'Firewall', '{ip} opened 320 sessions to {host}'], [17, 'Identity', '1,860 failed sign-ins in 20 minutes'], [9, 'Identity', '2 sign-ins succeeded for accounts with weak history'], [3, 'Network', 'Same address scanned other gateways last week']],
    ti: [['{ip}', 'IP address', 'Demo Threat Feed A', 'Malicious', 83, '5 days ago']],
    evd: [['Auth failures', 'Failed sign-ins by account', 'Distribution of accounts targeted from {ip}.'], ['Session log', 'Sessions from {ip} to {host}', 'Start time, duration and result for each session.']],
    act: [['Block {ip} at the perimeter firewall', 'Adds a deny rule for the address.', 'Low impact. Source is external only.'], ['Force password reset for the 2 accounts that succeeded', 'Resets the credentials and ends active VPN sessions.', 'The two users are signed out of VPN.'], ['Enable stricter lockout on {host}', 'Locks accounts after 5 failures for 30 minutes.', 'May lock out legitimate users after typos.']],
  },
  Cloud: {
    tl: [[35, '{acct} assumed a deployment role'], [20, 'Bucket policy changed on {host}'], [8, 'First anonymous read request recorded'], [0, 'Alert raised and queued for review']],
    ev: [[34, 'Cloud', 'Role session started for {acct} from the CI network'], [20, 'Cloud', 'Policy on {host} changed to allow public reads'], [8, 'Cloud', 'Anonymous GET requests from {ip}'], [2, 'Application', 'No matching deployment ticket for the change']],
    ti: [],
    evd: [['Policy diff', 'Before and after policy for {host}', 'Highlights the statement that grants public read access.'], ['Access log', 'Requests to {host}, last hour', 'Shows anonymous requests and the objects they touched.']],
    act: [['Block public access on {host}', 'Applies the account-level block that overrides the bucket policy.', 'Anything that relies on public reads stops working.'], ['Rotate keys for {acct}', 'Issues new credentials and revokes the old ones.', 'The CI pipeline fails until updated.'], ['Snapshot the bucket configuration', 'Saves the current policy and access log for the case record.', 'No impact.']],
  },
  Application: {
    tl: [[45, 'Application log showed an unexpected condition on {host}'], [20, 'Condition repeated across several requests'], [0, 'Alert raised and queued for review']],
    ev: [[44, 'Application', 'Warning logged on {host}'], [21, 'Application', 'Same warning repeated 37 times'], [7, 'Network', 'Traffic to {host} is within normal range']],
    ti: [],
    evd: [['Application log', 'Entries from {host}, last 2 hours', 'Shows the warning text and request IDs.']],
    act: [['Open a change ticket to fix the configuration on {host}', 'Creates a ticket for the platform team with the evidence attached.', 'No impact.'], ['Add a WAF rule for the affected path', 'Blocks the request pattern at the web application firewall.', 'May block legitimate requests with similar shape.']],
  },
};

const DETAILS = {
  'ALR-2041': {
    summary: 'FIN-FS-02, the finance file server, renamed 4,213 files in six minutes, deleted its volume shadow copies and ran a process from a public temp folder. The sequence follows an interactive sign-in by svc-finshare, an account that normally only runs batch jobs. This matches the staging phase seen before ransomware encryption.',
    assets: [['FIN-FS-02', 'File server', 'Tier 1', 'Finance IT', '10.20.4.17'], ['svc-finshare', 'Service account', 'Tier 1', 'Finance IT', 'n/a'], ['FIN-SHARE-Q3', 'SMB share (2.1 TB)', 'Tier 1', 'Finance', 'n/a']],
    tl: [[42, 'svc-finshare signed in interactively from FIN-WS-019', 'Identity'], [24, 'syncagent.exe started from C:\\Users\\Public\\Temp', 'Endpoint'], [19, 'Volume shadow copies deleted on FIN-FS-02', 'Endpoint'], [14, 'Alert ALR-2041 raised: 4,213 files renamed in 6 minutes', 'Detection'], [12, 'AI analysis correlated 3 related events and linked INC-318', 'AI']],
    ev: [[42, 'Identity', 'Interactive sign-in for svc-finshare from FIN-WS-019 (normally batch only)'], [24, 'Endpoint', 'Unsigned binary syncagent.exe executed on FIN-FS-02'], [19, 'Endpoint', 'Shadow copy deletion command run by syncagent.exe'], [15, 'Network', 'SMB bursts from FIN-FS-02 to 12 internal hosts'], [13, 'Endpoint', 'New file extension .locked7 appears on FIN-SHARE-Q3']],
    ti: [['syncagent.exe (SHA-256 9f2c…e41a)', 'File hash', 'Demo Threat Feed A', 'Malicious', 92, '9 days ago'], ['192.0.2.77', 'IP address', 'Demo Threat Feed B', 'Suspicious', 64, '3 days ago']],
    evd: [['Process tree', 'syncagent.exe → cmd.exe → vssadmin.exe', 'Launch chain with full command lines and the account that started each step.'], ['File activity', '4,213 renames to the .locked7 extension', 'Rename events grouped by folder. 91% are in FIN-SHARE-Q3.'], ['Authentication log', 'svc-finshare interactive sign-in at 16:05', 'The account had no interactive sign-in in the previous 90 days.'], ['Network flows', 'SMB bursts to 12 internal hosts', 'Possible lateral reach. No outbound transfer seen yet.']],
    ai: { rationale: ['The rename rate is 40x the host baseline and every file moves to one new extension.', 'Shadow copy deletion directly follows the unsigned binary, a common pre-encryption step.', 'svc-finshare has never signed in interactively before today.', 'The binary hash matches a feed entry first seen 9 days ago.'],
      limits: 'The AI cannot confirm that any data was encrypted. An analyst should confirm the file state on FIN-FS-02 before restoring anything.' },
    act: [['Isolate FIN-FS-02 from the network', 'Cuts all network access except the management channel so the server stays available for investigation.', 'Finance loses access to the Q3 share until recovery.'], ['Disable service account svc-finshare', 'Blocks every sign-in for the account and ends its active sessions.', 'The nightly reconciliation job will fail until the account is restored.'], ['Block 192.0.2.77 at the perimeter firewall', 'Adds a deny rule for the address seen in outbound connection attempts.', 'Low impact. No known business traffic to this address.'], ['Capture a disk snapshot of FIN-FS-02', 'Saves a read-only copy of the volume to the forensic store.', 'No user impact. Takes about 25 minutes.']],
  },
};

function fill(s, a) { return String(s).replace(/\{(\w+)\}/g, (m, k) => (a[k] != null ? a[k] : m)); }

const DETAIL_CACHE = {};
function detailFor(a) {
  if (DETAIL_CACHE[a.id]) return DETAIL_CACHE[a.id];
  const T = TEMPLATES[a.source];
  const base = DETAILS[a.id] || {};
  const d = {
    summary: base.summary || `${a.blurb} Related events from other sources were correlated and scored by the detection model.`,
    assets: base.assets || [[a.host, a.source === 'Cloud' ? 'Storage bucket' : a.source === 'Identity' ? 'Identity gateway' : 'Host', a.sev === 'critical' ? 'Tier 1' : 'Tier 2', 'Platform team', a.ip]].concat(a.acct && a.acct !== 'n/a' ? [[a.acct, 'Account', 'Tier 2', 'Identity team', 'n/a']] : []),
    tl: (base.tl || T.tl.map((t) => [t[0], fill(t[1], a), 'Detection'])).map((t) => ({ ts: ago(a.min + t[0]), text: t[1], kind: t[2] || 'Detection' })),
    ev: (base.ev || T.ev).map((e) => ({ ts: ago(a.min + e[0]), src: e[1], msg: fill(e[2], a) })),
    ti: (base.ti || T.ti).map((t) => ({ ind: fill(t[0], a), type: t[1], feed: t[2], verdict: t[3], conf: t[4], first: t[5] })),
    evd: (base.evd || T.evd).map((e, i) => ({ id: 'E' + (i + 1), kind: e[0], name: fill(e[1], a), note: fill(e[2], a) })),
    ai: { conf: a.conf, rationale: base.ai ? base.ai.rationale : ['The activity departs from the baseline for ' + a.host + '.', 'Related events from at least two sources point the same way.', 'Detection rule "' + a.rule + '" fired with a score of ' + a.conf + '%.'],
      limits: base.ai ? base.ai.limits : 'The AI works from log data only and may miss context that the analyst knows. Check the evidence before acting.' },
    actions: (base.act || T.act).map((x, i) => ({ id: 'a' + (i + 1), title: fill(x[0], a), desc: fill(x[1], a), risk: fill(x[2], a) })),
  };
  DETAIL_CACHE[a.id] = d;
  return d;
}

/* ---- response action decisions, keyed "ALR-xxxx:aN" ---- */
const ACTIONS = {
  'ALR-2033:a1': { status: 'approved', by: 'Karan Iyer', at: ago(96) },
  'ALR-2033:a2': { status: 'executed', by: 'Meera Shah', at: ago(70), approvedBy: 'Karan Iyer' },
  'ALR-2031:a1': { status: 'approved', by: 'Sana Qureshi', at: ago(150) },
};

const CHECK_LABELS = ['Confirm scope of affected assets', 'Isolate affected hosts or accounts', 'Preserve forensic evidence', 'Reset exposed credentials', 'Remove malicious artefacts', 'Validate recovery and monitor for 24 hours'];
const mkChecklist = (n) => CHECK_LABELS.map((label, i) => ({ id: 'c' + i, label, done: i < n }));

const INCIDENTS = [
  { id: 'INC-318', title: 'Ransomware staging on finance file server', sev: 'critical', owner: 'Priya Nair', status: 'Investigating', alerts: ['ALR-2041'], opened: ago(12), assets: ['FIN-FS-02', 'svc-finshare', 'FIN-SHARE-Q3'], checklist: mkChecklist(1),
    notes: [{ by: 'Priya Nair', role: 'SOC Analyst', at: ago(9), text: 'Finance confirmed there is no scheduled bulk rename job on FIN-FS-02. Treating this as hostile activity.' }],
    audit: [{ at: ago(12), who: 'SOC Assistant', text: 'Incident created from ALR-2041 (AI correlation)' }, { at: ago(10), who: 'Priya Nair', text: 'Assigned to herself and set status to Investigating' }] },
  { id: 'INC-317', title: 'Possible data exfiltration from production database', sev: 'critical', owner: 'Karan Iyer', status: 'Investigating', alerts: ['ALR-2033'], opened: ago(120), assets: ['DB-PRD-03', 'dbsvc-prod'], checklist: mkChecklist(3),
    notes: [{ by: 'Karan Iyer', role: 'SOC Analyst', at: ago(100), text: 'Destination range is not in the vendor allow-list. Perimeter block approved, DB service account sessions revoked.' }],
    audit: [{ at: ago(120), who: 'SOC Assistant', text: 'Incident created from ALR-2033' }, { at: ago(96), who: 'Karan Iyer', text: 'Approved response action: Block 203.0.113.88 at the perimeter firewall' }, { at: ago(70), who: 'Meera Shah', text: 'Executed (simulated): Rate-limit outbound traffic from DB-PRD-03' }] },
  { id: 'INC-315', title: 'Public exposure of invoice archive bucket', sev: 'high', owner: 'Sana Qureshi', status: 'Contained', alerts: ['ALR-2031'], opened: ago(200), assets: ['invoices-archive', 'role/ci-deploy'], checklist: mkChecklist(4),
    notes: [{ by: 'Sana Qureshi', role: 'SOC Analyst', at: ago(150), text: 'Public read access blocked. Waiting on the access log review to decide whether the data was fetched.' }],
    audit: [{ at: ago(200), who: 'SOC Assistant', text: 'Incident created from ALR-2031' }, { at: ago(150), who: 'Sana Qureshi', text: 'Approved response action: Block public access on invoices-archive' }, { at: ago(140), who: 'Sana Qureshi', text: 'Status changed from Investigating to Contained' }] },
  { id: 'INC-312', title: 'Credential phishing campaign against HR', sev: 'high', owner: 'Priya Nair', status: 'Resolved', alerts: [], opened: ago(4300), assets: ['HR mailboxes (14)'], checklist: mkChecklist(6),
    notes: [{ by: 'Priya Nair', role: 'SOC Analyst', at: ago(3000), text: 'All 14 recipients reset their passwords. Sender domain blocked at the mail gateway.' }],
    audit: [{ at: ago(4300), who: 'Priya Nair', text: 'Incident opened' }, { at: ago(3000), who: 'Priya Nair', text: 'Status changed from Contained to Resolved' }] },
  { id: 'INC-304', title: 'Malware on contractor laptop', sev: 'medium', owner: 'Karan Iyer', status: 'Closed', alerts: [], opened: ago(12000), assets: ['CTR-LT-208'], checklist: mkChecklist(6),
    notes: [{ by: 'Karan Iyer', role: 'SOC Analyst', at: ago(11000), text: 'Laptop re-imaged and returned. Closed after 7 days with no recurrence.' }],
    audit: [{ at: ago(12000), who: 'Karan Iyer', text: 'Incident opened' }, { at: ago(11000), who: 'Karan Iyer', text: 'Status changed from Resolved to Closed' }] },
];
const INC_SEQ = { n: 318 };

const HANDOFFS = [
  { id: 'h1', inc: 'INC-317', from: 'Karan Iyer', note: 'Block is approved and in place. Please confirm the database service account is clean before restoring replication.', accepted: false },
  { id: 'h2', inc: 'INC-315', from: 'Sana Qureshi', note: 'Bucket access is blocked. Please review the access log for objects fetched while it was public.', accepted: false },
];

const DATA_SOURCES = [
  { id: 's1', name: 'Perimeter firewalls', type: 'Firewall', status: 'healthy', rate: '4.8k ev/s', last: '2 s ago', lag: '1 s', enabled: true, note: '' },
  { id: 's2', name: 'Endpoint agents (EDR)', type: 'Endpoint', status: 'healthy', rate: '6.2k ev/s', last: '1 s ago', lag: '2 s', enabled: true, note: '' },
  { id: 's3', name: 'Identity provider logs', type: 'Identity', status: 'healthy', rate: '1.1k ev/s', last: '3 s ago', lag: '4 s', enabled: true, note: '' },
  { id: 's4', name: 'Cloud audit trail', type: 'Cloud', status: 'degraded', rate: '2.9k ev/s', last: '9 min ago', lag: '9 min', enabled: true, note: 'Ingestion lag is above the 5 minute threshold.' },
  { id: 's5', name: 'Network sensors', type: 'Network', status: 'healthy', rate: '3.3k ev/s', last: '1 s ago', lag: '2 s', enabled: true, note: '' },
  { id: 's6', name: 'Web and app server logs', type: 'Application', status: 'error', rate: '0.6k ev/s', last: '41 s ago', lag: '38 s', enabled: true, note: '4.1% of events fail parsing after a log format change.' },
  { id: 's7', name: 'Legacy syslog relay', type: 'Network', status: 'disconnected', rate: '0 ev/s', last: '17 days ago', lag: 'n/a', enabled: false, note: 'Disabled by IT on 02 Oct.' },
];
const PROC_ERRORS = [
  { src: 'Web and app server logs', err: 'Parser: unknown field "req_ctx"', n: 1284, sid: 's6' },
  { src: 'Cloud audit trail', err: 'Batch timeout after 30 s', n: 37, sid: 's4' },
  { src: 'Endpoint agents (EDR)', err: 'Duplicate event IDs dropped', n: 212, sid: 's2' },
];

const RULES = [
  { id: 'r1', name: 'Mass file rename + shadow copy deletion', kind: 'Rule', status: 'Active', precision: 94, alerts24: 3, sens: 'High', tuned: '12 Oct', thr: 60 },
  { id: 'r2', name: 'Impossible travel + privilege use', kind: 'Rule', status: 'Active', precision: 81, alerts24: 6, sens: 'Medium', tuned: '08 Oct', thr: 55 },
  { id: 'r3', name: 'Outbound volume anomaly', kind: 'Model v1.9', status: 'Active', precision: 77, alerts24: 5, sens: 'Medium', tuned: '30 Sep', thr: 70 },
  { id: 'r4', name: 'DNS tunnelling heuristic', kind: 'Rule', status: 'Active', precision: 48, alerts24: 41, sens: 'High', tuned: '14 Aug', thr: 40 },
  { id: 'r5', name: 'Port scan heuristic', kind: 'Rule', status: 'Active', precision: 39, alerts24: 57, sens: 'High', tuned: '21 Jul', thr: 35 },
  { id: 'r6', name: 'Process lineage anomaly', kind: 'Model v2.7', status: 'Degraded', precision: 72, alerts24: 12, sens: 'Medium', tuned: '02 Oct', thr: 65 },
  { id: 'r7', name: 'Anomalous login model', kind: 'Model v3.2', status: 'Active', precision: 86, alerts24: 9, sens: 'Medium', tuned: '10 Oct', thr: 60 },
  { id: 'r8', name: 'Failed local logon', kind: 'Rule', status: 'Disabled', precision: 31, alerts24: 0, sens: 'Low', tuned: '03 Mar', thr: 20 },
];
const COVERAGE = [['Initial access', 86], ['Execution', 92], ['Persistence', 78], ['Privilege escalation', 81], ['Defence evasion', 64], ['Credential access', 88], ['Lateral movement', 72], ['Exfiltration', 69], ['Impact', 83]];

const USERS = [
  { id: 'u1', name: 'Priya Nair', email: 'priya.nair@example.test', role: 'SOC Analyst', active: true, last: '4 min ago' },
  { id: 'u2', name: 'Karan Iyer', email: 'karan.iyer@example.test', role: 'SOC Analyst', active: true, last: '22 min ago' },
  { id: 'u3', name: 'Sana Qureshi', email: 'sana.qureshi@example.test', role: 'SOC Analyst', active: true, last: '1 h ago' },
  { id: 'u4', name: 'Rohan Kulkarni', email: 'rohan.kulkarni@example.test', role: 'Cybersecurity Engineer', active: true, last: '35 min ago' },
  { id: 'u5', name: 'Meera Shah', email: 'meera.shah@example.test', role: 'Incident Response Team', active: true, last: '9 min ago' },
  { id: 'u6', name: 'Arjun Desai', email: 'arjun.desai@example.test', role: 'Incident Response Team', active: true, last: '3 h ago' },
  { id: 'u7', name: 'Dev Malhotra', email: 'dev.malhotra@example.test', role: 'IT Administrator', active: true, last: 'just now' },
  { id: 'u8', name: 'Tara Menon', email: 'tara.menon@example.test', role: 'SOC Analyst', active: false, last: '41 days ago' },
];
const REQUESTS = [
  { id: 'q1', who: 'Neha Joshi', ask: 'Role change: Viewer to SOC Analyst', reason: 'Joining the night shift rota from Monday.', at: ago(55) },
  { id: 'q2', who: 'Imran Sheikh', ask: 'Access: Cloud audit trail source', reason: 'Needs to review the invoices-archive findings.', at: ago(190) },
  { id: 'q3', who: 'Vikram Rao', ask: 'Role change: Viewer to Incident Response Team', reason: 'Backup responder for INC-317.', at: ago(400) },
];
const SYSTEM_HEALTH = [
  { name: 'Log ingestion pipeline', state: 'ok', val: '18.4k ev/s' }, { name: 'Detection engine', state: 'ok', val: 'p95 220 ms' },
  { name: 'AI analysis service', state: 'ok', val: 'queue 3' }, { name: 'Case and audit store', state: 'ok', val: '41% disk' },
  { name: 'Notification relay', state: 'degraded', val: 'retrying 2 sends' },
];
const SETTINGS = { timeout: '30', retention: '180', notifyEmail: true, notifyChat: true, notifyPager: false, mfa: true, approvalRequired: true, mask: true };
const AUDIT = [
  { at: ago(3), who: 'Priya Nair', role: 'SOC Analyst', text: 'Opened ALR-2041' }, { at: ago(10), who: 'Priya Nair', role: 'SOC Analyst', text: 'Assigned INC-318 to herself' },
  { at: ago(70), who: 'Meera Shah', role: 'Incident Response Team', text: 'Executed (simulated) a response action on INC-317' }, { at: ago(96), who: 'Karan Iyer', role: 'SOC Analyst', text: 'Approved a response action on INC-317' },
  { at: ago(140), who: 'Sana Qureshi', role: 'SOC Analyst', text: 'Changed INC-315 status to Contained' }, { at: ago(260), who: 'Dev Malhotra', role: 'IT Administrator', text: 'Disabled data source: Legacy syslog relay' },
  { at: ago(300), who: 'Rohan Kulkarni', role: 'Cybersecurity Engineer', text: 'Tuned rule: Anomalous login model' }, { at: ago(640), who: 'Dev Malhotra', role: 'IT Administrator', text: 'Deactivated user Tara Menon' },
];
const NOTIFS = [
  { id: 'n1', text: 'Critical alert ALR-2040 needs review', min: 31, read: false, go: ['investigation', 'ALR-2040'] },
  { id: 'n2', text: 'INC-318 was opened from ALR-2041', min: 12, read: false, go: ['incidents', 'INC-318'] },
  { id: 'n3', text: 'Cloud audit trail ingestion lag is above 5 minutes', min: 40, read: false, go: ['admin', 'sources'] },
  { id: 'n4', text: 'Weekly SOC summary is ready', min: 600, read: true, go: ['reports', 'saved'] },
];
const SAVED_REPORTS = [
  { id: 'p1', name: 'Weekly SOC summary', owner: 'Priya Nair', last: ago(600), range: 'Last 7 days', note: 'Alert volume, triage times and top detections for the week.' },
  { id: 'p2', name: 'Critical incident review', owner: 'Karan Iyer', last: ago(2900), range: 'Last 30 days', note: 'Timeline, response actions and lessons learned for critical incidents.' },
  { id: 'p3', name: 'Response-time SLA report', owner: 'Meera Shah', last: ago(1500), range: 'Last 30 days', note: 'Time to acknowledge, contain and resolve against the agreed targets.' },
  { id: 'p4', name: 'Data-source coverage audit', owner: 'Rohan Kulkarni', last: ago(5200), range: 'Last 90 days', note: 'Which sources feed detections, and the gaps found.' },
];

/* seeded series so charts are stable between renders */
function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
function series(n, base, amp, seed, min) { const r = rng(seed); return Array.from({ length: n }, (_, i) => Math.max(min || 0, Math.round(base + amp * Math.sin((i / n) * Math.PI * 2 * 1.3) + (r() - 0.5) * amp * 0.9))); }

export { MIN, NOW, ago, ROLES, SEV, SOURCES, ALERT_STATUS, INC_STATUS, ANALYSTS, ALERTS, TEMPLATES, DETAILS, fill, DETAIL_CACHE, detailFor, ACTIONS, CHECK_LABELS, mkChecklist, INCIDENTS, INC_SEQ, HANDOFFS, DATA_SOURCES, PROC_ERRORS, RULES, COVERAGE, USERS, REQUESTS, SYSTEM_HEALTH, SETTINGS, AUDIT, NOTIFS, SAVED_REPORTS, rng, series };
