import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { isSupabaseConfigured, supabase, type AlertRecord, type ProfileRecord } from "./lib/supabase";

type Screen = "overview" | "alerts" | "investigation" | "incident" | "reports" | "admin";
type User = { id: string; email: string; name: string; initials: string; role: ProfileRecord["role"]; description: string; permissions: string[] };
type DisplayAlert = { name: string; severity: string; confidence: number; source: string; time: string; status: string; owner: string; id: string };
type IconName =
  | "grid" | "alert" | "case" | "report" | "settings" | "search" | "bell"
  | "pulse" | "arrow" | "shield" | "spark" | "check" | "clock" | "server"
  | "filter" | "chevron" | "copy" | "link" | "download" | "users" | "database"
  | "lock" | "x" | "back" | "eye" | "file" | "note" | "plus" | "activity";

const iconPaths: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  alert: <><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/></>,
  case: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
  report: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 17v-3M12 17v-6M16 17v-8"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6"/>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  spark: <><path d="m12 3-1.2 4.1a5.4 5.4 0 0 1-3.7 3.7L3 12l4.1 1.2a5.4 5.4 0 0 1 3.7 3.7L12 21l1.2-4.1a5.4 5.4 0 0 1 3.7-3.7L21 12l-4.1-1.2a5.4 5.4 0 0 1-3.7-3.7Z"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  server: <><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/></>,
  filter: <path d="M4 5h16l-6 7v5l-4 2v-7Z"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  x: <><path d="m6 6 12 12M18 6 6 18"/></>,
  back: <><path d="M19 12H5M11 18l-6-6 6-6"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
  note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  activity: <path d="M3 12h4l2-8 4 16 2-8h6"/>,
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

function feedback(message: string) {
  window.dispatchEvent(new CustomEvent("aegis-feedback", { detail: message }));
}

const navItems: { id: Screen; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "alerts", label: "Alert Queue", icon: "alert" },
  { id: "incident", label: "Incidents", icon: "case" },
  { id: "reports", label: "Reports & History", icon: "report" },
  { id: "admin", label: "Administration", icon: "settings" },
];

const roleScreens: Record<string, Screen[]> = {
  "SOC Analyst": ["overview", "alerts", "incident", "reports"],
  "Cybersecurity Engineer": ["overview", "reports"],
  "Incident Response Team": ["overview", "alerts", "incident", "reports"],
  "IT Administrator": ["overview", "reports", "admin"],
};

const incidentRecordId = "10470000-0000-4000-8000-000000000001";
const responseActionRecordId = "77310000-0000-4000-8000-000000000001";

const rolePermissions: Record<ProfileRecord["role"], string[]> = {
  "SOC Analyst": ["Investigate alerts", "Approve responses", "Manage incidents"],
  "Cybersecurity Engineer": ["Tune detections", "Review telemetry", "Manage integrations"],
  "Incident Response Team": ["Command incidents", "Approve responses", "Review audit history"],
  "IT Administrator": ["Manage users", "Configure sources", "Set approval policies"],
};

function toAppUser(profile: ProfileRecord, email: string): User {
  return {
    id: profile.id,
    email,
    name: profile.display_name,
    initials: profile.display_name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase(),
    role: profile.role,
    description: "Authenticated Supabase account",
    permissions: rolePermissions[profile.role],
  };
}

function relativeTime(timestamp: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Severity({ level }: { level: string }) {
  return <span className={`severity severity-${level.toLowerCase()}`}><span className="severity-dot"/>{level}</span>;
}

function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`status-pill status-${key}`}>{status}</span>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function CardHeader({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return <div className="card-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<div className="card-title">{title}</div></div>{action}</div>;
}

function Button({ children, kind = "secondary", icon, onClick, disabled = false }: { children: ReactNode; kind?: "primary" | "secondary" | "ghost" | "danger"; icon?: IconName; onClick?: () => void; disabled?: boolean }) {
  const label = typeof children === "string" ? children : "Action";
  return <button className={`button button-${kind}`} onClick={onClick ?? (() => feedback(`${label}: prototype action completed.`))} disabled={disabled}>{icon && <Icon name={icon} size={16}/>}<span>{children}</span></button>;
}

function PageTitle({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="page-title"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

function Sidebar({ screen, navigate, user }: { screen: Screen; navigate: (s: Screen) => void; user: User }) {
  const visibleNav = navItems.filter(item => roleScreens[user.role].includes(item.id));
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><Icon name="shield" size={21}/></div><div><strong>AEGIS</strong><span>SOC COMMAND</span></div></div>
    <nav>
      <div className="nav-label">{user.role}</div>
      {visibleNav.map(item => <button key={item.id} className={`nav-item ${screen === item.id || (item.id === "alerts" && screen === "investigation") ? "active" : ""}`} onClick={() => navigate(item.id)}>
        <Icon name={item.icon}/><span>{item.label}</span>{item.id === "alerts" && <b>12</b>}
      </button>)}
    </nav>
    <div className="sidebar-bottom">
      <div className="sensor-card"><div className="sensor-top"><span><i/>Detection fabric</span><strong>Operational</strong></div><div className="sensor-row"><span>Sources online</span><b>18 / 19</b></div><div className="progress"><span style={{ width: "94%" }}/></div></div>
      <div className="sidebar-meta"><Icon name="lock" size={14}/>Human approval enforced</div>
    </div>
  </aside>;
}

function Topbar({ onSearch, user, onLogout }: { onSearch: (v: string) => void; user: User; onLogout: () => void }) {
  return <header className="topbar">
    <div className="global-search"><Icon name="search" size={17}/><input aria-label="Global search" placeholder="Search alerts, incidents, users…" onKeyDown={e => { if (e.key === "Enter") onSearch(e.currentTarget.value); }}/><kbd>⌘ K</kbd></div>
    <div className="top-actions">
      <div className="health"><i/><span>Systems operational</span></div>
      <button className="icon-button" aria-label="Notifications" onClick={() => feedback("3 notifications: one critical alert and two incident updates.")}><Icon name="bell"/><i/></button>
      <button className="role-switch" onClick={onLogout}>Switch role</button>
      <button className="profile" onClick={onLogout} title="Switch role or sign out"><div className="avatar">{user.initials}</div><div><strong>{user.name}</strong><span>{user.role}</span></div><Icon name="chevron" size={14}/></button>
    </div>
  </header>;
}

function Login({ onLogin, externalError = "" }: { onLogin: (user: User) => void; externalError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Add the required VITE_SUPABASE environment variables.");
      return;
    }
    setError("");
    setSubmitting(true);
    void (async () => {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError || !data.user) {
        setError(signInError?.message ?? "Unable to authenticate this account.");
        setSubmitting(false);
        return;
      }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("id, display_name, role, account_status").eq("id", data.user.id).single<ProfileRecord>();
      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError(profileError?.message ?? "No active SOC profile is linked to this account.");
        setSubmitting(false);
        return;
      }
      if (profile.account_status !== "active") {
        await supabase.auth.signOut();
        setError(`This account is ${profile.account_status}. Contact an IT administrator.`);
        setSubmitting(false);
        return;
      }
      onLogin(toAppUser(profile, data.user.email ?? email.trim()));
    })();
  };
  return <div className="login-page">
    <div className="login-atmosphere"><div/><div/><div/></div>
    <header className="login-header"><div className="brand login-brand"><div className="brand-mark"><Icon name="shield" size={21}/></div><div><strong>AEGIS</strong><span>SOC COMMAND</span></div></div><div className="login-health"><i/>Secure workspace · All systems operational</div></header>
    <main className="login-shell">
      <section className="login-intro">
        <div className="login-kicker"><Icon name="lock" size={14}/>Identity-protected access</div>
        <h1>Your security operations.<br/><span>One command center.</span></h1>
        <p>Monitor threats, investigate with AI-assisted context, and coordinate human-approved response from a unified analyst workspace.</p>
        <div className="login-features">
          <div><Icon name="pulse"/><span><strong>Real-time detection</strong><small>18 connected security sources</small></span></div>
          <div><Icon name="spark"/><span><strong>AI-assisted analysis</strong><small>Evidence-backed recommendations</small></span></div>
          <div><Icon name="shield"/><span><strong>Human-controlled response</strong><small>Approval enforced on every action</small></span></div>
        </div>
        <div className="login-trust"><span>SESSION ENCRYPTED</span><span>RBAC ENFORCED</span><span>AUDIT LOGGED</span></div>
      </section>
      <form className="login-card" onSubmit={submit}>
        <div className="login-card-head"><div className="eyebrow">Aegis workspace</div><h2>Sign in to continue</h2><p>Use your authenticated SOC workspace account.</p></div>
        <label className="login-field"><span>Email address</span><div><Icon name="users" size={15}/><input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="analyst@example.com" autoComplete="username"/></div></label>
        <label className="login-field"><span>Password</span><div><Icon name="lock" size={15}/><input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }} placeholder="Enter your password" autoComplete="current-password"/><button type="button" className="password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div></label>
        {(error || externalError) && <div className="login-error" role="alert"><Icon name="alert" size={15}/><span>{error || externalError}</span></div>}
        <button className="login-submit" type="submit" disabled={submitting}>{submitting ? <><span className="spinner small-spinner"/>Authenticating…</> : <>Sign in to Aegis <Icon name="arrow" size={16}/></>}</button>
        <div className="login-help"><Icon name="lock" size={13}/>Authentication is managed by Supabase Auth. Passwords are never stored in application tables.</div>
      </form>
    </main>
    <footer className="login-footer"><span>AEGIS SECURITY OPERATIONS PLATFORM</span><span>Protected by adaptive access controls</span></footer>
  </div>;
}

function Overview({ navigate, alertData }: { navigate: (s: Screen) => void; alertData: DisplayAlert[] }) {
  return <div className="page">
    <PageTitle eyebrow="Tuesday, 14 May · 14:32 UTC" title="Security overview" description="Live posture and priority activity across your environment." actions={<><Button icon="report">Generate report</Button><Button kind="primary" icon="alert" onClick={() => navigate("alerts")}>View alert queue</Button></>}/>
    <div className="metrics-grid">
      <Card className="posture-card"><div className="metric-label"><span>Security posture</span><StatusPill status="Stable"/></div><div className="posture-row"><div className="score-ring"><div><strong>82</strong><span>/100</span></div></div><div><div className="delta positive">↑ 4 points</div><p>Improved over 7 days</p></div></div></Card>
      <Card><div className="metric-label"><span>Events analyzed</span><Icon name="pulse" size={17}/></div><div className="metric-value">2.4M</div><div className="metric-foot"><span className="delta positive">↑ 8.2%</span><span>vs. previous 24h</span></div></Card>
      <Card><div className="metric-label"><span>Open incidents</span><Icon name="case" size={17}/></div><div className="metric-value">23</div><div className="severity-counts"><span><i className="critical"/>3</span><span><i className="high"/>7</span><span><i className="medium"/>13</span></div></Card>
      <Card><div className="metric-label"><span>Mean response time</span><Icon name="clock" size={17}/></div><div className="metric-value">18m 42s</div><div className="metric-foot"><span className="delta positive">↓ 12%</span><span>faster this week</span></div></Card>
    </div>
    <div className="overview-grid">
      <Card className="span-2">
        <CardHeader title="Event volume" eyebrow="Last 24 hours" action={<div className="legend"><span><i className="cyan"/>All events</span><span><i className="blue"/>Detections</span></div>}/>
        <div className="chart-wrap">
          <div className="y-axis"><span>120k</span><span>80k</span><span>40k</span><span>0</span></div>
          <svg className="line-chart" viewBox="0 0 700 190" preserveAspectRatio="none">
            <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#29c7d8" stopOpacity=".24"/><stop offset="1" stopColor="#29c7d8" stopOpacity="0"/></linearGradient></defs>
            <path className="grid-lines" d="M0 15H700M0 68H700M0 121H700M0 174H700"/>
            <path fill="url(#area)" d="M0 143 C45 132 65 145 105 124 S170 92 210 112 S275 130 315 91 S365 43 420 77 S485 117 525 84 S585 61 620 50 S665 38 700 55 V190H0Z"/>
            <path className="event-line" d="M0 143 C45 132 65 145 105 124 S170 92 210 112 S275 130 315 91 S365 43 420 77 S485 117 525 84 S585 61 620 50 S665 38 700 55"/>
            <path className="detect-line" d="M0 168 C60 160 90 165 135 156 S210 160 250 151 S310 149 360 137 S420 154 470 142 S550 149 600 127 S655 139 700 130"/>
          </svg>
          <div className="x-axis"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>Now</span></div>
        </div>
      </Card>
      <Card>
        <CardHeader title="Detection trend" eyebrow="7-day signal quality" action={<span className="trend-badge">+11.4%</span>}/>
        <div className="bar-chart">{[42, 55, 48, 69, 63, 82, 75].map((v, i) => <div className="bar-col" key={i}><div><span style={{ height: `${v}%` }}/></div><small>{["Wed","Thu","Fri","Sat","Sun","Mon","Tue"][i]}</small></div>)}</div>
        <div className="chart-summary"><div><span>True positives</span><strong>91.2%</strong></div><div><span>Escalation rate</span><strong>8.7%</strong></div></div>
      </Card>
    </div>
    <div className="overview-grid lower">
      <Card className="span-2 recent-card">
        <CardHeader title="Recent alerts" eyebrow="Requires attention" action={<button className="text-button" onClick={() => navigate("alerts")}>View all <Icon name="arrow" size={15}/></button>}/>
        {alertData[0] ? <div className="urgent-banner"><div className="urgent-icon"><Icon name="alert"/></div><div><strong>{alertData[0].name}</strong><span>Critical alert requires analyst investigation</span></div><div className="urgent-meta"><span>{alertData[0].confidence}% confidence</span><span>{alertData[0].time}</span></div><Button kind="primary" onClick={() => navigate("investigation")}>Investigate</Button></div> : <div className="empty-compact"><Icon name="shield" size={25}/><strong>No alerts awaiting review</strong><span>Live alert records will appear here.</span></div>}
        <table><thead><tr><th>Alert</th><th>Severity</th><th>Source</th><th>Age</th><th>Status</th></tr></thead>
          <tbody>{alertData.slice(1,4).map(a => <tr key={a.id} onClick={() => navigate("alerts")}><td><strong>{a.name}</strong><small>{a.id.slice(0, 8)}</small></td><td><Severity level={a.severity}/></td><td>{a.source}</td><td>{a.time}</td><td><StatusPill status={a.status}/></td></tr>)}</tbody>
        </table>
      </Card>
      <Card className="sources-card">
        <CardHeader title="Data sources" eyebrow="Connected health" action={<span className="source-total">18 / 19</span>}/>
        {[["CrowdStrike EDR","Healthy","36ms"],["Microsoft Entra ID","Healthy","52ms"],["Splunk SIEM","Healthy","84ms"],["Zscaler","Delayed","4m"],["AWS CloudTrail","Healthy","71ms"]].map(([name,status,latency]) => <div className="source-row" key={name}><div className="source-icon"><Icon name="server" size={16}/></div><div><strong>{name}</strong><span>Last sync {latency} ago</span></div><StatusPill status={status}/></div>)}
        <button className="full-link" onClick={() => navigate("reports")}>View source health <Icon name="arrow" size={14}/></button>
      </Card>
    </div>
  </div>;
}

function EngineerDashboard({ navigate }: { navigate: (s: Screen) => void }) {
  return <div className="page role-dashboard">
    <PageTitle eyebrow="Detection engineering · Live posture" title="Detection quality & systems" description="Monitor rule efficacy, telemetry coverage, and event-pipeline reliability." actions={<><Button icon="server" onClick={() => navigate("reports")}>Source diagnostics</Button><Button kind="primary" icon="settings" onClick={() => navigate("reports")}>Tune detections</Button></>}/>
    <div className="role-metrics">
      <button onClick={() => navigate("reports")}><span><Icon name="shield" size={17}/>Active detection rules</span><strong>284</strong><small>276 healthy · 8 need review</small></button>
      <button onClick={() => navigate("reports")}><span><Icon name="spark" size={17}/>Model status</span><strong className="green-text">Healthy</strong><small>Last evaluated 4 minutes ago</small></button>
      <button onClick={() => navigate("reports")}><span><Icon name="alert" size={17}/>Noisy detections</span><strong className="orange-text">12</strong><small>4 above tuning threshold</small></button>
      <button onClick={() => navigate("reports")}><span><Icon name="pulse" size={17}/>Events processed</span><strong>2.4M</strong><small>99.87% processing success</small></button>
    </div>
    <div className="role-grid">
      <Card className="span-2"><CardHeader title="Detection coverage" eyebrow="MITRE ATT&CK techniques" action={<StatusPill status="Healthy"/>}/>
        <div className="coverage-list">{[["Initial Access",86,"42 rules"],["Execution",94,"61 rules"],["Persistence",72,"33 rules"],["Credential Access",91,"48 rules"],["Lateral Movement",78,"37 rules"],["Exfiltration",64,"21 rules"]].map(([name,value,count]) => <button key={String(name)} onClick={() => navigate("reports")}><div><strong>{name}</strong><span>{count}</span></div><div className="coverage-bar"><i style={{width:`${value}%`}}/></div><b>{value}%</b></button>)}</div>
      </Card>
      <Card><CardHeader title="Integration health" eyebrow="19 connected sources" action={<button className="text-button" onClick={() => navigate("reports")}>Diagnostics <Icon name="arrow" size={14}/></button>}/>
        {[["CrowdStrike EDR","Healthy","36ms"],["Splunk Cloud","Healthy","84ms"],["Zscaler","Delayed","4m"],["Proofpoint","Connection error","18m"]].map(([name,status,age]) => <button className="role-list-row" key={name} onClick={() => navigate("reports")}><div className="source-icon"><Icon name="database" size={15}/></div><span><strong>{name}</strong><small>Last event {age} ago</small></span><StatusPill status={status}/></button>)}
      </Card>
      <Card className="span-2"><CardHeader title="Rules requiring attention" eyebrow="Noise & duplication review" action={<Button kind="ghost" onClick={() => navigate("reports")}>Review all rules</Button>}/>
        <table><thead><tr><th>Detection rule</th><th>Issue</th><th>24h triggers</th><th>Precision</th><th>Owner</th></tr></thead><tbody>{[["PowerShell encoded command","High noise","1,248","42%","Maya Chen"],["Impossible travel","Duplicate signals","386","61%","Sam Okafor"],["Unsigned binary execution","Frequent trigger","294","73%","Unassigned"]].map((row,i)=><tr key={String(row[0])} onClick={() => navigate("reports")} className="clickable-row">{row.map((value,j)=><td key={j}>{j===0?<strong>{value}</strong>:j===1?<StatusPill status={String(value)}/>:value}</td>)}</tr>)}</tbody></table>
      </Card>
      <Card><CardHeader title="Pipeline errors" eyebrow="Last 24 hours"/><div className="pipeline-callout"><div><Icon name="alert"/></div><span><strong>1,842 events delayed</strong><small>Zscaler parser queue · P95 delay 4m 12s</small></span></div><div className="mini-stat-row"><span>Dropped events</span><strong>0.03%</strong></div><div className="mini-stat-row"><span>Schema failures</span><strong>217</strong></div><div className="mini-stat-row"><span>Retry success</span><strong className="green-text">98.4%</strong></div><Button kind="secondary" icon="activity" onClick={() => navigate("reports")}>Troubleshoot pipeline</Button></Card>
      <Card className="span-3"><CardHeader title="Recent configuration changes" eyebrow="Detection audit"/>
        <div className="change-strip">{[["14:12","Rule tuned","Impossible travel threshold changed","Sam Okafor"],["13:44","Parser updated","CrowdStrike process event v4","Aegis deployment"],["11:08","Rule enabled","OAuth consent grant anomaly","Jon Bell"],["09:32","Model promoted","Identity risk model 2.8","Sam Okafor"]].map(([time,type,event,owner])=><button key={time} onClick={() => navigate("reports")}><span>{time}</span><div><strong>{event}</strong><small>{type} · {owner}</small></div><Icon name="chevron" size={14}/></button>)}</div>
      </Card>
    </div>
  </div>;
}

function ResponseDashboard({ navigate }: { navigate: (s: Screen) => void }) {
  return <div className="page role-dashboard">
    <PageTitle eyebrow="Incident command · 3 active responders" title="Response coordination" description="Coordinate containment, eradication, recovery, and cross-team handoffs." actions={<><Button icon="note" onClick={() => navigate("incident")}>Add incident note</Button><Button kind="primary" icon="case" onClick={() => navigate("incident")}>Update response progress</Button></>}/>
    <div className="role-metrics">
      <button onClick={() => navigate("incident")}><span><Icon name="alert" size={17}/>Priority incidents</span><strong className="critical-text">3</strong><small>1 critical · 2 high</small></button>
      <button onClick={() => navigate("incident")}><span><Icon name="check" size={17}/>Containment progress</span><strong>67%</strong><small>4 of 6 actions complete</small></button>
      <button onClick={() => navigate("incident")}><span><Icon name="clock" size={17}/>Pending handoffs</span><strong className="orange-text">4</strong><small>2 approaching SLA</small></button>
      <button onClick={() => navigate("reports")}><span><Icon name="pulse" size={17}/>Mean time to contain</span><strong>21m</strong><small>3m faster this month</small></button>
    </div>
    <div className="role-grid">
      <Card className="span-2 priority-incident"><CardHeader title="Credential access on finance endpoint" eyebrow="INC-1047 · Critical response" action={<StatusPill status="Investigating"/>}/>
        <button className="incident-focus" onClick={() => navigate("incident")}><div className="incident-focus-top"><Severity level="Critical"/><span>Owner <b>Maya Chen</b></span><span>Opened 18m ago</span><span>SLA <b className="orange-text">42m</b></span></div><p>Credential dumping activity detected on FIN-WS-042 with confirmed command-and-control traffic.</p><div className="affected-assets"><span><Icon name="server" size={14}/>FIN-WS-042</span><span><Icon name="users" size={14}/>elena.morris</span><span><Icon name="database" size={14}/>Finance VLAN</span></div><div className="response-timeline"><i className="done"/><i className="done"/><i className="active"/><i/><i/><span>Detection</span><span>Validation</span><span>Containment</span><span>Eradication</span><span>Recovery</span></div></button>
      </Card>
      <Card><CardHeader title="Approved responses" eyebrow="Execution status"/>{[["Endpoint isolation","Queued","14:37"],["Block malicious domain","Awaiting result","14:39"],["Disable OAuth token","Completed","13:52"]].map(([action,status,time])=><button className="role-list-row" key={action} onClick={() => navigate("incident")}><div className="response-icon compact"><Icon name="shield" size={14}/></div><span><strong>{action}</strong><small>Approved · {time} UTC</small></span><StatusPill status={status}/></button>)}<div className="safe-note"><Icon name="lock" size={13}/>Execution state is connector-reported; queued does not mean completed.</div></Card>
      <Card><CardHeader title="Response checklist" eyebrow="INC-1047 · 4 of 7"/>{[["Validate affected scope",true],["Isolate endpoint",true],["Block command & control",true],["Reset credentials",true],["Acquire memory image",false],["Verify persistence removed",false]].map(([label,done])=><label className="compact-check" key={String(label)} onClick={() => navigate("incident")}><input type="checkbox" checked={Boolean(done)} readOnly/><span>{String(label)}</span></label>)}</Card>
      <Card><CardHeader title="Pending handoffs" eyebrow="Cross-team requests"/>{[["Identity team","Reset elena.morris credentials","12m"],["Network operations","Validate Finance VLAN isolation","18m"],["Legal & compliance","Assess notification threshold","31m"]].map(([team,request,age])=><button className="handoff-row" key={team} onClick={() => navigate("incident")}><div className="avatar small">{team.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><span><strong>{team}</strong><small>{request}</small></span><b>{age}</b></button>)}</Card>
      <Card><CardHeader title="Incident activity" eyebrow="Live response timeline"/><div className="audit-list">{[["14:41","Network team acknowledged handoff","Alex W."],["14:39","Domain block approved","Jon Bell"],["14:37","Endpoint isolation queued","Maya Chen"],["14:35","Evidence validated","Maya Chen"]].map(([time,event,who])=><div key={time}><span>{time}</span><i/><p><strong>{event}</strong><small>{who}</small></p></div>)}</div></Card>
      <Card><CardHeader title="Other active incidents" eyebrow="Response portfolio"/>{[["INC-1044","OAuth token theft","High","Contained"],["INC-1042","Lateral movement","High","Investigating"]].map(([id,name,severity,status])=><button className="role-list-row" key={id} onClick={() => navigate("incident")}><span><strong>{name}</strong><small>{id} · 2 affected assets</small></span><Severity level={severity}/><StatusPill status={status}/></button>)}</Card>
    </div>
  </div>;
}

function ITDashboard({ navigate }: { navigate: (s: Screen) => void }) {
  return <div className="page role-dashboard">
    <PageTitle eyebrow="Platform administration · All regions" title="Access & platform health" description="Manage identity, integrations, data governance, and service availability." actions={<><Button icon="users" onClick={() => navigate("admin")}>Manage access</Button><Button kind="primary" icon="settings" onClick={() => navigate("admin")}>System settings</Button></>}/>
    <div className="role-metrics">
      <button onClick={() => navigate("admin")}><span><Icon name="users" size={17}/>Active accounts</span><strong>12</strong><small>4 roles · 2 pending requests</small></button>
      <button onClick={() => navigate("admin")}><span><Icon name="database" size={17}/>Data sources</span><strong>18 / 19</strong><small>1 connection requires attention</small></button>
      <button onClick={() => navigate("reports")}><span><Icon name="pulse" size={17}/>Platform uptime</span><strong className="green-text">99.98%</strong><small>Last 30 days</small></button>
      <button onClick={() => navigate("reports")}><span><Icon name="alert" size={17}/>System errors</span><strong className="orange-text">3</strong><small>None service-impacting</small></button>
    </div>
    <div className="role-grid">
      <Card className="span-2"><CardHeader title="Platform availability" eyebrow="Core services" action={<StatusPill status="Operational"/>}/>
        <div className="service-grid">{[["Event ingestion","Operational","99.99%"],["Detection engine","Operational","99.98%"],["AI analysis service","Operational","99.97%"],["Response connectors","Degraded","98.72%"],["Audit storage","Operational","100%"],["Notification service","Operational","99.99%"]].map(([service,status,uptime])=><button key={service} onClick={() => navigate("reports")}><div><i className={status==="Operational"?"ok":"warn"}/><span><strong>{service}</strong><small>30d uptime {uptime}</small></span></div><StatusPill status={status}/></button>)}</div>
      </Card>
      <Card><CardHeader title="Pending access" eyebrow="2 requests" action={<button className="text-button" onClick={() => navigate("admin")}>Review all <Icon name="arrow" size={14}/></button>}/>{[["Priya Nair","SOC Analyst","18m"],["Ethan Cole","Cybersecurity Engineer","1h"]].map(([name,role,age])=><button className="access-request" key={name} onClick={() => navigate("admin")}><div className="avatar small">{name.split(" ").map(x=>x[0]).join("")}</div><span><strong>{name}</strong><small>{role} · requested {age} ago</small></span><Icon name="chevron" size={14}/></button>)}<div className="mini-stat-row"><span>Inactive accounts</span><strong>1</strong></div><div className="mini-stat-row"><span>MFA enrollment</span><strong className="green-text">100%</strong></div></Card>
      <Card><CardHeader title="Connection status" eyebrow="Security data sources"/>{[["CrowdStrike EDR","Healthy"],["Microsoft Entra ID","Healthy"],["Splunk Cloud","Healthy"],["Proofpoint","Connection error"]].map(([name,status])=><button className="role-list-row" key={name} onClick={() => navigate("admin")}><div className="source-icon"><Icon name="server" size={15}/></div><span><strong>{name}</strong><small>{status==="Healthy"?"Streaming normally":"Authentication expired"}</small></span><StatusPill status={status}/></button>)}<Button kind="secondary" icon="database" onClick={() => navigate("admin")}>Manage integrations</Button></Card>
      <Card><CardHeader title="Data governance" eyebrow="Backup & retention"/><div className="governance-list"><div><Icon name="database"/><span><strong>Nightly backup</strong><small>Last completed today, 02:14 UTC</small></span><StatusPill status="Healthy"/></div><div><Icon name="clock"/><span><strong>Event retention</strong><small>365 days · 68% storage used</small></span><b>Compliant</b></div><div><Icon name="lock"/><span><strong>Audit retention</strong><small>7 years · immutable storage</small></span><b>Compliant</b></div></div><Button kind="secondary" onClick={() => navigate("admin")}>Review retention settings</Button></Card>
      <Card><CardHeader title="Configuration audit" eyebrow="Recent changes"/><div className="audit-list">{[["14:22","Role assignment updated","Ravi Shah"],["13:08","Proofpoint secret rotated","Ravi Shah"],["10:41","Retention policy reviewed","System task"],["09:17","SSO certificate validated","Aegis monitor"]].map(([time,event,who])=><div key={time}><span>{time}</span><i/><p><strong>{event}</strong><small>{who}</small></p></div>)}</div></Card>
      <Card className="span-3 admin-quick"><CardHeader title="Administration shortcuts" eyebrow="Authorized actions"/><div><button onClick={() => navigate("admin")}><Icon name="users"/><span><strong>Users & roles</strong><small>Accounts and access requests</small></span><Icon name="arrow" size={15}/></button><button onClick={() => navigate("admin")}><Icon name="database"/><span><strong>Integrations</strong><small>Connect and troubleshoot sources</small></span><Icon name="arrow" size={15}/></button><button onClick={() => navigate("admin")}><Icon name="shield"/><span><strong>Approval policies</strong><small>Human-review guardrails</small></span><Icon name="arrow" size={15}/></button><button onClick={() => navigate("admin")}><Icon name="settings"/><span><strong>System settings</strong><small>Platform and retention controls</small></span><Icon name="arrow" size={15}/></button></div></Card>
    </div>
  </div>;
}

function RoleDashboard({ user, navigate, alertData }: { user: User; navigate: (screen: Screen) => void; alertData: DisplayAlert[] }) {
  if (user.role === "Cybersecurity Engineer") return <EngineerDashboard navigate={navigate}/>;
  if (user.role === "Incident Response Team") return <ResponseDashboard navigate={navigate}/>;
  if (user.role === "IT Administrator") return <ITDashboard navigate={navigate}/>;
  return <Overview navigate={navigate} alertData={alertData}/>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options?: string[]; onChange?: (value: string) => void }) {
  const items = options ?? [value, "All"];
  return <label className="filter-select"><span>{label}</span><select value={value} onChange={e => { onChange?.(e.target.value); if (!onChange) feedback(`${label} changed to ${e.target.value}.`); }}>{items.map(item => <option key={item}>{item}</option>)}</select><Icon name="chevron" size={13}/></label>;
}

function AlertQueue({ openAlert, alertData }: { openAlert: () => void; alertData: DisplayAlert[] }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [severity, setSeverity] = useState("All severity");
  const [status, setStatus] = useState("All statuses");
  const [source, setSource] = useState("All sources");
  const [analyst, setAnalyst] = useState("All analysts");
  const [date, setDate] = useState("Last 24 hours");
  const [moreFilters, setMoreFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => alertData.filter(a =>
    (a.name.toLowerCase().includes(query.toLowerCase()) || a.id.toLowerCase().includes(query.toLowerCase())) &&
    (severity === "All severity" || a.severity === severity) &&
    (status === "All statuses" || a.status === status) &&
    (source === "All sources" || a.source === source) &&
    (analyst === "All analysts" || a.owner === analyst)
  ), [alertData, query, severity, status, source, analyst]);
  const refresh = () => { setLoading(true); setTimeout(() => setLoading(false), 850); };
  const clearFilters = () => { setQuery(""); setSeverity("All severity"); setStatus("All statuses"); setSource("All sources"); setAnalyst("All analysts"); setDate("Last 24 hours"); };
  return <div className="page">
    <PageTitle eyebrow="Detection operations" title="Alert queue" description="Triage, assign, and investigate detections across connected sources." actions={<><Button icon="activity" onClick={refresh}>Refresh</Button><Button kind="primary" icon="plus" onClick={openAlert}>Create investigation</Button></>}/>
    <div className="queue-stats"><div className="active"><strong>12</strong><span>New alerts</span></div><div><strong>5</strong><span>Investigating</span></div><div><strong>8</strong><span>Awaiting review</span></div><div><strong>94%</strong><span>Within SLA</span></div></div>
    <Card className="queue-card">
      <div className="filter-bar">
        <div className="table-search"><Icon name="search" size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search alerts or IDs"/></div>
        <FilterSelect label="Severity" value={severity} onChange={setSeverity} options={["All severity","Critical","High","Medium","Low"]}/>
        <FilterSelect label="Status" value={status} onChange={setStatus} options={["All statuses","New","Investigating","Triaged","Resolved"]}/>
        <FilterSelect label="Source" value={source} onChange={setSource} options={["All sources",...Array.from(new Set(alertData.map(a => a.source)))]}/>
        <FilterSelect label="Date" value={date} onChange={setDate} options={["Last 24 hours","Last 7 days","Last 30 days"]}/>
        <FilterSelect label="Analyst" value={analyst} onChange={setAnalyst} options={["All analysts","Maya Chen","Jon Bell","Sam Okafor","Ravi Shah","Unassigned"]}/>
        <button className={`icon-button filter-button ${moreFilters ? "active" : ""}`} title="More filters" onClick={() => setMoreFilters(value => !value)}><Icon name="filter" size={16}/></button>
      </div>
      {moreFilters && <div className="advanced-filter"><span><Icon name="filter" size={14}/>Advanced filters enabled</span><button onClick={clearFilters}>Reset all filters</button></div>}
      {selectedIds.length > 0 && <div className="bulk-bar"><span>{selectedIds.length} alert{selectedIds.length > 1 ? "s" : ""} selected</span><Button kind="ghost" onClick={() => { setSelectedIds([]); feedback("Selection cleared."); }}>Clear</Button><Button onClick={() => feedback(`${selectedIds.length} selected alert(s) assigned to Maya Chen.`)}>Assign to me</Button></div>}
      {loading ? <div className="state-panel"><div className="spinner"/><strong>Refreshing alert stream</strong><span>Checking connected detection sources…</span></div> :
      filtered.length === 0 ? <div className="state-panel"><Icon name="search" size={28}/><strong>No matching alerts</strong><span>Try changing your search or filters.</span><Button onClick={clearFilters}>Clear filters</Button></div> :
      <div className="table-scroll"><table className="alert-table"><thead><tr><th><input type="checkbox" aria-label="Select all" checked={filtered.length > 0 && filtered.every(a => selectedIds.includes(a.id))} onChange={e => setSelectedIds(e.target.checked ? filtered.map(a => a.id) : [])}/></th><th>Alert</th><th>Severity</th><th>Confidence</th><th>Source</th><th>Detected</th><th>Status</th><th>Owner</th><th/></tr></thead>
        <tbody>{filtered.map((a,i) => <tr key={a.id} className={i === 0 ? "critical-row" : ""} onClick={openAlert}>
          <td onClick={e => e.stopPropagation()}><input type="checkbox" aria-label={`Select ${a.id}`} checked={selectedIds.includes(a.id)} onChange={e => setSelectedIds(current => e.target.checked ? [...current, a.id] : current.filter(id => id !== a.id))}/></td>
          <td><div className="alert-name"><span className={`alert-marker marker-${a.severity.toLowerCase()}`}/><div><strong>{a.name}</strong><small>{a.id}</small></div></div></td>
          <td><Severity level={a.severity}/></td><td><div className="confidence"><strong>{a.confidence}%</strong><span><i style={{ width: `${a.confidence}%` }}/></span></div></td><td>{a.source}</td><td>{a.time}</td><td><StatusPill status={a.status}/></td>
          <td><div className="owner"><span className={a.owner === "Unassigned" ? "empty-avatar" : ""}>{a.owner === "Unassigned" ? "—" : a.owner.split(" ").map(n => n[0]).join("")}</span>{a.owner}</div></td>
          <td><button className="row-action" aria-label="Open alert" onClick={e => { e.stopPropagation(); openAlert(); }}><Icon name="chevron" size={16}/></button></td>
        </tr>)}</tbody>
      </table></div>}
      <div className="table-footer"><span>Showing {filtered.length} of 48 alerts · {date}</span><div><Button kind="ghost" disabled={page === 1} onClick={() => setPage(value => Math.max(1,value-1))}>Previous</Button><span className="page-number">{page}</span><Button kind="ghost" disabled={page === 2} onClick={() => { setPage(2); feedback("Loaded page 2 of alert results."); }}>Next</Button></div></div>
    </Card>
  </div>;
}

function AISuggestion({ status, approve, dismiss }: { status: "awaiting" | "approved" | "dismissed"; approve: () => void; dismiss: () => void }) {
  return <Card className="ai-action-card">
    <div className="ai-action-head"><div className="ai-icon"><Icon name="spark" size={19}/></div><div><div className="ai-label">AI suggestion</div><strong>Isolate endpoint FIN-WS-042 from the network</strong></div>{status === "awaiting" ? <StatusPill status="Awaiting analyst approval"/> : status === "approved" ? <StatusPill status="Analyst approved"/> : <StatusPill status="Dismissed"/>}</div>
    <p>Contain the affected workstation to prevent lateral movement while preserving its connection to the EDR control channel.</p>
    <div className="action-detail"><div><span>Expected impact</span><strong>Network access interrupted for 1 user</strong></div><div><span>Scope</span><strong>Single endpoint · reversible</strong></div><div><span>AI confidence</span><strong>94% · High</strong></div></div>
    {status === "awaiting" && <div className="approval-note"><Icon name="lock" size={15}/><span>This action will not execute without analyst approval.</span></div>}
    {status === "approved" && <div className="approved-record"><Icon name="check" size={16}/><div><strong>Approval recorded</strong><span>Approved by Maya Chen · 14:37 UTC · Response queued, execution not yet confirmed</span></div></div>}
    {status === "dismissed" && <div className="dismissed-record">Suggestion dismissed by Maya Chen. No response was initiated.</div>}
    {status === "awaiting" && <div className="ai-actions"><Button onClick={dismiss}>Dismiss suggestion</Button><Button kind="primary" icon="check" onClick={approve}>Review & approve</Button></div>}
  </Card>;
}

function Investigation({ back, openIncident, suggestion, updateSuggestion, notify }: { back: () => void; openIncident: () => void; suggestion: "awaiting" | "approved" | "dismissed"; updateSuggestion: (s: "approved" | "dismissed") => Promise<boolean>; notify: (m: string) => void }) {
  const [modal, setModal] = useState(false);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const approve = async () => {
    const recorded = await updateSuggestion("approved");
    if (recorded) {
      setModal(false);
      notify("Approval recorded in Supabase. Response is queued; execution is not yet confirmed.");
    }
  };
  return <div className="page">
    <button className="back-link" onClick={back}><Icon name="back" size={16}/>Back to alert queue</button>
    <PageTitle eyebrow="ALT-2481 · Detected 14:30:12 UTC" title="Suspicious PowerShell & credential access" description="Correlated endpoint behavior indicates a likely credential dumping attempt." actions={<><Button icon="case" onClick={openIncident}>Open incident workspace</Button><Button kind="primary" icon="plus" onClick={() => { notify("Alert ALT-2481 added to incident INC-1047."); openIncident(); }}>Add to incident</Button></>}/>
    <div className="investigation-status"><Severity level="Critical"/><span className="divider"/><StatusPill status="Investigating"/><span className="divider"/><span><b>96%</b> detection confidence</span><span className="divider"/><span>Owner: <b>Maya Chen</b></span></div>
    <div className="investigation-layout">
      <main className="investigation-main">
        <Card className="ai-summary">
          <div className="summary-head"><div className="ai-icon"><Icon name="spark" size={20}/></div><div><div className="ai-label">AI suggestion · Investigation summary</div><strong>Likely credential access following malicious script execution</strong></div><div className="confidence-badge"><span>Confidence</span><strong>94%</strong></div></div>
          <p>PowerShell executed an obfuscated command on <b>FIN-WS-042</b>, followed by access to LSASS memory and an outbound connection to a newly registered domain. This sequence aligns with credential dumping and command-and-control behavior.</p>
          <div className="rationale"><strong>Why Aegis reached this conclusion</strong><div><span>1</span>Three high-fidelity detections occurred within 4 minutes</div><div><span>2</span>Process lineage matches known Mimikatz execution patterns</div><div><span>3</span>Destination domain has two threat-intelligence matches</div></div>
          <div className="ai-disclaimer"><Icon name="eye" size={15}/>AI-generated analysis. Verify supporting evidence before taking action.</div>
        </Card>
        <Card>
          <CardHeader title="Incident timeline" eyebrow="6 correlated events" action={<Button kind="ghost" icon="filter" onClick={() => notify("Timeline filtered to high-confidence correlated events.")}>Filter</Button>}/>
          <div className="timeline">
            {[
              ["14:30:12","Critical","Credential access","powershell.exe accessed LSASS memory using a suspicious handle.","CrowdStrike EDR"],
              ["14:29:48","High","Obfuscated PowerShell","Encoded command spawned from winword.exe on FIN-WS-042.","Microsoft Defender"],
              ["14:28:55","High","Threat intel match","Outbound request to update-sync[.]cloud matched a newly registered IOC.","Zscaler"],
              ["14:27:09","Medium","Document execution","Invoice_Q2.docm launched a child process from Outlook.","CrowdStrike EDR"],
            ].map(([time,sev,title,text,source],i) => <div className="timeline-item" key={time}><div className={`timeline-node node-${sev.toLowerCase()}`}>{i === 0 && <Icon name="alert" size={13}/>}</div><div className="timeline-time">{time}<span>UTC</span></div><div className="timeline-content"><div><strong>{title}</strong><Severity level={sev}/></div><p>{text}</p><span>{source}</span></div></div>)}
          </div>
        </Card>
        <Card>
          <CardHeader title="Suggested response" eyebrow="Human review required"/>
          <AISuggestion status={suggestion} approve={() => { setApprovalConfirmed(false); setModal(true); }} dismiss={() => { void updateSuggestion("dismissed").then(recorded => recorded && notify("Suggestion dismissal recorded. No response was initiated.")); }}/>
          <div className="secondary-suggestions"><div><span className="step-number">02</span><div><strong>Reset credentials for affected user</strong><small>Suggested after containment · awaiting analyst approval</small></div><Button kind="ghost" onClick={() => notify("Credential-reset suggestion opened for review. No action has been approved.")}>Review</Button></div><div><span className="step-number">03</span><div><strong>Block destination domain</strong><small>Suggested scope: all managed egress points</small></div><Button kind="ghost" onClick={() => notify("Domain-block suggestion opened for review. No action has been approved.")}>Review</Button></div></div>
        </Card>
      </main>
      <aside className="investigation-side">
        <Card><CardHeader title="Affected assets"/><div className="asset"><div className="asset-icon"><Icon name="server"/></div><div><strong>FIN-WS-042</strong><span>Windows 11 · Finance</span></div><StatusPill status="At risk"/></div><div className="detail-list"><div><span>IP address</span><strong>10.40.18.27</strong></div><div><span>User</span><strong>elena.morris</strong></div><div><span>Last seen</span><strong>14:31 UTC</strong></div><div><span>EDR status</span><strong className="green-text">Online</strong></div></div></Card>
        <Card><CardHeader title="Threat intelligence" eyebrow="2 matched indicators"/><div className="intel-item"><div><Severity level="Critical"/></div><strong>update-sync[.]cloud</strong><p>Command & control infrastructure</p><span>Recorded Future · 98% confidence</span></div><div className="intel-item"><div><Severity level="High"/></div><strong>185.220.101.34</strong><p>Known malicious exit node</p><span>VirusTotal · 17 vendors</span></div><button className="full-link" onClick={() => notify("Threat-intelligence details opened for 2 matched indicators.")}>View all intelligence <Icon name="arrow" size={14}/></button></Card>
        <Card><CardHeader title="Evidence" eyebrow="4 artifacts"/>{[["PowerShell transcript","TXT · 18 KB"],["Process tree snapshot","JSON · 42 KB"],["Memory access event","EVTX · 8 KB"],["Network connection log","PCAP · 1.2 MB"]].map(([name,meta]) => <div className="evidence-item" key={name}><div><Icon name="file" size={16}/></div><span><strong>{name}</strong><small>{meta}</small></span><button aria-label={`View ${name}`} onClick={() => notify(`${name} opened in evidence viewer.`)}><Icon name="eye" size={15}/></button></div>)}</Card>
      </aside>
    </div>
    {modal && <div className="modal-backdrop" onMouseDown={() => setModal(false)}><div className="modal" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="modal-icon"><Icon name="shield" size={26}/></div><button className="modal-close" onClick={() => setModal(false)} aria-label="Close"><Icon name="x" size={17}/></button><div className="eyebrow">Confirmation required</div><h2 id="confirm-title">Approve endpoint isolation?</h2><p>You are authorizing Aegis to queue network isolation for <b>FIN-WS-042</b>. The endpoint will retain its EDR control channel.</p><div className="confirm-summary"><div><span>Target</span><strong>FIN-WS-042 · 10.40.18.27</strong></div><div><span>Action</span><strong>Network isolation</strong></div><div><span>Impact</span><strong>1 user may lose connectivity</strong></div></div><label className="confirm-check"><input type="checkbox" checked={approvalConfirmed} onChange={e => setApprovalConfirmed(e.target.checked)}/><span>I reviewed the evidence and understand the operational impact.</span></label><div className="modal-actions"><Button onClick={() => setModal(false)}>Cancel</Button><Button kind="primary" icon="check" disabled={!approvalConfirmed} onClick={approve}>Approve & queue response</Button></div><div className="modal-foot"><Icon name="lock" size={13}/>Approval will be recorded in the incident audit trail.</div></div></div>}
  </div>;
}

function Incident({ suggestion, navigate, notify, persistStatus, persistNote }: { suggestion: string; navigate: (s: Screen) => void; notify: (m: string) => void; persistStatus: (status: string) => Promise<boolean>; persistNote: (note: string) => Promise<boolean> }) {
  const [status, setStatus] = useState("Investigating");
  const [note, setNote] = useState("");
  const checklistLabels = ["Validate detection evidence","Confirm affected identity","Review threat intelligence","Contain affected endpoint","Reset compromised credentials","Document final disposition"];
  const [checklist, setChecklist] = useState([true,true,true,suggestion === "approved",false,false]);
  const completeCount = checklist.filter(Boolean).length;
  const updateStatus = async (value: string) => {
    if (await persistStatus(value)) {
      setStatus(value);
      notify(`Incident status updated to ${value} and recorded in the audit trail.`);
    }
  };
  return <div className="page">
    <button className="back-link" onClick={() => navigate("investigation")}><Icon name="back" size={16}/>Back to alert investigation</button>
    <PageTitle eyebrow="INC-1047 · Created 14:34 UTC" title="Credential access on finance endpoint" description="Active incident workspace · linked to 3 alerts and 1 affected asset." actions={<><Button icon="download">Export case</Button><Button kind="primary" onClick={() => navigate("overview")}>Return to overview</Button></>}/>
    <div className="incident-toolbar"><div><Severity level="Critical"/><StatusPill status={status}/><span>Owner <b>Maya Chen</b></span></div><label>Update status<select value={status} onChange={e => updateStatus(e.target.value)}><option>Investigating</option><option>Contained</option><option>Monitoring</option><option>Resolved</option></select></label></div>
    <div className="incident-grid">
      <main>
        <Card><CardHeader title="Investigation checklist" eyebrow={`${completeCount} of 6 complete`} action={<span className="completion">{Math.round(completeCount / 6 * 100)}%</span>}/><div className="check-progress"><span style={{width:`${completeCount / 6 * 100}%`}}/></div>
          {checklistLabels.map((text,i) => <label className="check-item" key={text}><input type="checkbox" checked={checklist[i]} onChange={e => { const next = [...checklist]; next[i] = e.target.checked; setChecklist(next); notify(`${text} marked ${e.target.checked ? "complete" : "incomplete"}.`); }}/><span><strong>{text}</strong><small>{checklist[i] ? "Completed by Maya Chen" : "Pending analyst action"}</small></span></label>)}
        </Card>
        <Card><CardHeader title="Analyst notes" eyebrow="Case collaboration" action={<Button kind="ghost" icon="plus">Add collaborator</Button>}/><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Record investigation findings, decisions, or handoff context…"/><div className="note-actions"><span>Markdown supported · Entries are retained in the audit log</span><Button kind="primary" disabled={!note} onClick={() => { void persistNote(note).then(recorded => { if (recorded) { setNote(""); notify("Analyst note stored on the incident."); } }); }}>Add note</Button></div><div className="existing-note"><div className="avatar small">MC</div><div><strong>Maya Chen <span>· 14:35 UTC</span></strong><p>Validated process lineage and IOC matches. Reviewing containment recommendation before action.</p></div></div></Card>
        <Card><CardHeader title="Response history" eyebrow="Human-approved actions"/>{suggestion === "approved" ? <div className="response-record"><div className="response-icon"><Icon name="check"/></div><div><strong>Endpoint isolation approved</strong><p>Approval recorded by Maya Chen. Response has been queued for the CrowdStrike connector; execution result is pending.</p><span>14:37 UTC · Approval ID APR-7731</span></div><StatusPill status="Queued"/></div> : <div className="empty-compact"><Icon name="shield" size={25}/><strong>No approved responses yet</strong><span>AI suggestions remain inactive until an analyst approves them.</span></div>}</Card>
      </main>
      <aside>
        <Card><CardHeader title="Incident details"/><div className="detail-list wide"><div><span>Severity</span><Severity level="Critical"/></div><div><span>Owner</span><strong>Maya Chen</strong></div><div><span>Created</span><strong>14 May, 14:34</strong></div><div><span>SLA remaining</span><strong className="orange-text">42 minutes</strong></div><div><span>Affected user</span><strong>elena.morris</strong></div><div><span>Asset</span><strong>FIN-WS-042</strong></div></div></Card>
        <Card><CardHeader title="Evidence" eyebrow="4 attached"/>{["PowerShell transcript","Process tree snapshot","Memory access event","Network connection log"].map(x => <button className="evidence-link" key={x} onClick={() => notify(`${x} opened in evidence viewer.`)}><Icon name="file" size={15}/><span>{x}</span><Icon name="chevron" size={13}/></button>)}</Card>
        <Card><CardHeader title="Audit trail" eyebrow="Immutable record"/><div className="audit-list">{[["14:37","Response approved","Maya Chen"],["14:35","Note added","Maya Chen"],["14:34","Incident created","Aegis AI"],["14:30","Alert assigned","Routing policy"]].map(([time,event,who]) => <div key={time+event}><span>{time}</span><i/><p><strong>{event}</strong><small>{who}</small></p></div>)}</div></Card>
      </aside>
    </div>
  </div>;
}

function Reports() {
  const [tab,setTab] = useState<"reports"|"incidents">("reports");
  return <div className="page"><PageTitle eyebrow="Operational intelligence" title="Reports & history" description="Analyze security outcomes, audit decisions, and export stakeholder-ready reports." actions={<><Button icon="filter">Filters</Button><Button kind="primary" icon="download">Export data</Button></>}/>
    <div className="tabs"><button className={tab==="reports"?"active":""} onClick={()=>setTab("reports")}>Report history</button><button className={tab==="incidents"?"active":""} onClick={()=>setTab("incidents")}>Incident history</button></div>
    <div className="metrics-grid reports-metrics"><Card><div className="metric-label"><span>Incidents this month</span></div><div className="metric-value">148</div><div className="metric-foot"><span className="delta positive">↓ 9%</span><span>from last month</span></div></Card><Card><div className="metric-label"><span>Mean time to contain</span></div><div className="metric-value">21m</div><div className="metric-foot"><span className="delta positive">↓ 3m 18s</span><span>month over month</span></div></Card><Card><div className="metric-label"><span>Analyst approval rate</span></div><div className="metric-value">74%</div><div className="metric-foot"><span>312 of 422 AI suggestions</span></div></Card><Card><div className="metric-label"><span>SLA compliance</span></div><div className="metric-value">96.4%</div><div className="metric-foot"><span className="delta positive">↑ 1.8%</span><span>this month</span></div></Card></div>
    <div className="overview-grid"><Card className="span-2"><CardHeader title="Incident trend" eyebrow="Last 30 days" action={<FilterSelect label="Range" value="30 days"/>}/><div className="stacked-bars">{[45,62,54,78,68,82,58,65,88,72,60,76,52,67,84].map((v,i)=><div key={i}><span style={{height:`${v}%`}}><i style={{height:`${Math.max(v-38,12)}%`}}/></span></div>)}</div><div className="report-legend"><span><i className="critical"/>Critical</span><span><i className="high"/>High</span><span><i className="medium"/>Medium</span><span><i className="low"/>Low</span></div></Card><Card><CardHeader title="Response-time distribution" eyebrow="By severity"/>{[["Critical","12m","82%"],["High","26m","66%"],["Medium","1h 14m","48%"],["Low","3h 22m","28%"]].map(([s,t,w])=><div className="response-metric" key={s}><div><Severity level={s}/><strong>{t}</strong></div><span><i className={s.toLowerCase()} style={{width:w}}/></span></div>)}</Card></div>
    <Card className="history-card"><CardHeader title={tab==="reports"?"Saved reports":"Incident history"} eyebrow={tab==="reports"?"Generated and scheduled":"Closed and archived cases"} action={<Button icon="plus">{tab==="reports"?"Create report":"New query"}</Button>}/><table><thead><tr>{(tab==="reports"?["Name","Type","Period","Created by","Generated","Status"]:["Incident","Severity","Owner","Resolution","Closed","Status"]).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{(tab==="reports"?[
      ["Executive security briefing","PDF","May 1–14","Maya Chen","Today, 09:00","Ready"],["Weekly detection efficacy","CSV","May 6–12","Aegis schedule","Mon, 08:00","Ready"],["Incident response audit","PDF","April 2025","Jon Bell","May 2, 16:22","Ready"]
    ]:[["INC-1039 · OAuth token theft","Critical","Jon Bell","Contained","May 13","Closed"],["INC-1031 · Malware on HR endpoint","High","Maya Chen","Remediated","May 11","Closed"],["INC-1028 · Suspicious data transfer","Medium","Sam Okafor","False positive","May 10","Closed"]]).map((row,i)=><tr key={i}>{row.map((v,j)=><td key={j}>{j===0?<strong>{v}</strong>:j===row.length-1?<StatusPill status={v}/>:v}</td>)}</tr>)}</tbody></table></Card>
  </div>;
}

function Administration() {
  const [tab,setTab]=useState("Users & roles");
  const [userQuery,setUserQuery]=useState("");
  return <div className="page"><PageTitle eyebrow="Workspace controls" title="Administration" description="Manage access, integrations, automation policies, and workspace settings." actions={<Button kind="primary" icon="plus">Invite analyst</Button>}/>
    <div className="admin-layout"><aside className="admin-nav">{["Users & roles","Data sources","Approval policies","System settings"].map((x,i)=><button className={tab===x?"active":""} onClick={()=>setTab(x)} key={x}><Icon name={(["users","database","shield","settings"] as IconName[])[i]}/>{x}</button>)}</aside>
    <main>{tab==="Users & roles"?<><Card><CardHeader title="Users & roles" eyebrow="12 active users" action={<div className="table-search compact"><Icon name="search" size={15}/><input value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="Search users"/></div>}/><table><thead><tr><th>User</th><th>Role</th><th>Last active</th><th>Status</th><th/></tr></thead><tbody>{[["Maya Chen","SOC Analyst","Now","Active"],["Jon Bell","Incident Response Team","6 min ago","Active"],["Sam Okafor","Cybersecurity Engineer","22 min ago","Active"],["Ravi Shah","IT Administrator","1 hr ago","Active"]].filter(row => row[0].toLowerCase().includes(userQuery.toLowerCase()) || row[1].toLowerCase().includes(userQuery.toLowerCase())).map(([n,r,a,s])=><tr key={n}><td><div className="owner"><span>{n.split(" ").map(x=>x[0]).join("")}</span><strong>{n}</strong></div></td><td>{r}</td><td>{a}</td><td><StatusPill status={s}/></td><td><Button kind="ghost">Manage</Button></td></tr>)}</tbody></table></Card><Card><CardHeader title="Role permissions" eyebrow="Least-privilege access"/><div className="roles">{[["SOC Analyst","Investigate and approve responses","5 users"],["Cybersecurity Engineer","Tune detections and integrations","4 users"],["Incident Response Team","Manage incidents and approvals","2 users"],["IT Administrator","Full workspace administration","1 user"]].map(([r,d,c])=><div key={r}><div className="role-icon"><Icon name="lock" size={17}/></div><span><strong>{r}</strong><small>{d}</small></span><b>{c}</b><Icon name="chevron" size={15}/></div>)}</div></Card></>:tab==="Data sources"?<Card><CardHeader title="Connected data sources" eyebrow="18 of 19 healthy" action={<Button icon="plus">Add integration</Button>}/>{[["CrowdStrike EDR","Endpoint detection","Healthy"],["Microsoft Entra ID","Identity provider","Healthy"],["Splunk Cloud","SIEM","Healthy"],["Zscaler Internet Access","Secure web gateway","Delayed"],["Proofpoint","Email security","Connection error"]].map(([n,t,s])=><div className="integration-row" key={n}><div className="source-icon"><Icon name="database"/></div><div><strong>{n}</strong><span>{t}</span></div><StatusPill status={s}/><Button kind="ghost">Configure</Button></div>)}</Card>:<Card><div className="empty-state"><div className="empty-icon"><Icon name={tab==="Approval policies"?"shield":"settings"} size={28}/></div><strong>{tab}</strong><span>Configure workspace-wide {tab.toLowerCase()} and governance controls.</span><Button kind="primary">Open configuration</Button></div></Card>}</main></div>
  </div>;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [screen, setScreen] = useState<Screen>("overview");
  const [suggestion, setSuggestion] = useState<"awaiting" | "approved" | "dismissed">("awaiting");
  const [toast, setToast] = useState("");
  const [databaseAlerts, setDatabaseAlerts] = useState<DisplayAlert[]>([]);
  const [dataStatus, setDataStatus] = useState<"loading" | "success" | "empty" | "error">("loading");
  const [dataError, setDataError] = useState("");
  const [incidentNotes, setIncidentNotes] = useState<Array<{ author: string; text: string; created_at?: string }>>([]);
  const navigate = (next: Screen) => {
    const allowed = currentUser && (roleScreens[currentUser.role].includes(next) || (next === "investigation" && roleScreens[currentUser.role].includes("alerts")));
    if (currentUser && !allowed) {
      setToast(`Access denied: ${currentUser.role} does not have permission for that workspace.`);
      return;
    }
    setScreen(next);
    window.scrollTo(0, 0);
  };
  const notify = (message: string) => setToast(message);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 3600); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    const handleFeedback = (event: Event) => setToast((event as CustomEvent<string>).detail);
    window.addEventListener("aegis-feedback", handleFeedback);
    return () => window.removeEventListener("aegis-feedback", handleFeedback);
  }, []);
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      if (!isSupabaseConfigured) {
        if (active) {
          setAuthError("Supabase configuration is missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
          setAuthLoading(false);
        }
        return;
      }
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        if (active) {
          setAuthError(error.message);
          setAuthLoading(false);
        }
        return;
      }
      if (!session) {
        if (active) setAuthLoading(false);
        return;
      }
      const { data: profile, error: profileError } = await supabase.from("profiles").select("id, display_name, role, account_status").eq("id", session.user.id).single<ProfileRecord>();
      if (!active) return;
      if (profileError || !profile || profile.account_status !== "active") {
        await supabase.auth.signOut();
        setAuthError(profileError?.message ?? "This account does not have an active SOC profile.");
      } else {
        setCurrentUser(toAppUser(profile, session.user.email ?? ""));
      }
      setAuthLoading(false);
    };
    void restoreSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT" && active) {
        setCurrentUser(null);
        setDatabaseAlerts([]);
      }
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    const loadLiveData = async () => {
      setDataStatus("loading");
      const [alertsResult, incidentResult, responseResult] = await Promise.all([
        supabase.from("alerts").select("id,title,severity,confidence,source,status,assigned_analyst,created_at,updated_at").order("created_at", { ascending: false }),
        supabase.from("incidents").select("notes").eq("id", incidentRecordId).maybeSingle(),
        supabase.from("response_actions").select("approval_status").eq("id", responseActionRecordId).maybeSingle(),
      ]);
      if (!active) return;
      const operationError = alertsResult.error ?? incidentResult.error ?? responseResult.error;
      if (operationError) {
        setDataError(operationError.message);
        setDataStatus("error");
        return;
      }
      const records = (alertsResult.data ?? []) as AlertRecord[];
      setDatabaseAlerts(records.map(record => ({
        name: record.title,
        severity: record.severity,
        confidence: record.confidence,
        source: record.source,
        time: relativeTime(record.created_at),
        status: record.status,
        owner: "Unassigned",
        id: record.id,
      })));
      setIncidentNotes(Array.isArray(incidentResult.data?.notes) ? incidentResult.data.notes : []);
      const approval = responseResult.data?.approval_status;
      if (approval === "approved") setSuggestion("approved");
      else if (approval === "dismissed") setSuggestion("dismissed");
      else setSuggestion("awaiting");
      setDataError("");
      setDataStatus(records.length ? "success" : "empty");
    };
    void loadLiveData();
    const channel = supabase.channel("soc-live-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => void loadLiveData())
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => void loadLiveData())
      .on("postgres_changes", { event: "*", schema: "public", table: "response_actions" }, () => void loadLiveData())
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const updateSuggestion = async (next: "approved" | "dismissed") => {
    if (!currentUser || !["SOC Analyst", "Incident Response Team"].includes(currentUser.role)) {
      setToast("Access denied: your role cannot approve or dismiss response actions.");
      return false;
    }
    const { error } = await supabase.from("response_actions").update({
      approval_status: next,
      approver: currentUser.id,
    }).eq("id", responseActionRecordId).eq("approval_status", "pending");
    if (error) {
      setToast(`Database error: ${error.message}`);
      return false;
    }
    setSuggestion(next);
    return true;
  };

  const persistIncidentStatus = async (status: string) => {
    const { error } = await supabase.from("incidents").update({ status }).eq("id", incidentRecordId);
    if (error) {
      setToast(`Unable to update incident: ${error.message}`);
      return false;
    }
    return true;
  };

  const persistIncidentNote = async (text: string) => {
    if (!currentUser) return false;
    const notes = [...incidentNotes, { author: currentUser.name, text, created_at: new Date().toISOString() }];
    const { error } = await supabase.from("incidents").update({ notes }).eq("id", incidentRecordId);
    if (error) {
      setToast(`Unable to save note: ${error.message}`);
      return false;
    }
    setIncidentNotes(notes);
    return true;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setToast(`Unable to sign out: ${error.message}`);
      return;
    }
    setCurrentUser(null);
    setScreen("overview");
  };

  if (authLoading) return <div className="login-page"><div className="state-panel auth-state"><div className="spinner"/><strong>Restoring secure session</strong><span>Connecting to Supabase Auth…</span></div></div>;
  if (!currentUser) return <Login externalError={authError} onLogin={user => { setAuthError(""); setCurrentUser(user); setScreen("overview"); }}/>;
  return <div className="app-shell">
    <Sidebar screen={screen} navigate={navigate} user={currentUser}/>
    <div className="app-content"><Topbar user={currentUser} onLogout={() => void signOut()} onSearch={() => navigate("alerts")}/><div className="content-scroll">
      {dataStatus === "loading" && <div className="data-banner loading"><span className="spinner small-spinner"/>Loading live SOC data…</div>}
      {dataStatus === "error" && <div className="data-banner error"><Icon name="alert" size={15}/><span><strong>Live data unavailable.</strong> {dataError}</span><Button kind="ghost" onClick={() => window.location.reload()}>Retry</Button></div>}
      {dataStatus === "empty" && <div className="data-banner empty"><Icon name="database" size={15}/><span>No live alerts are available for this account.</span></div>}
      {screen === "overview" && <RoleDashboard user={currentUser} navigate={navigate} alertData={databaseAlerts}/>}
      {screen === "alerts" && <AlertQueue alertData={databaseAlerts} openAlert={() => navigate("investigation")}/>}
      {screen === "investigation" && <Investigation back={() => navigate("alerts")} openIncident={() => navigate("incident")} suggestion={suggestion} updateSuggestion={updateSuggestion} notify={notify}/>}
      {screen === "incident" && <Incident suggestion={suggestion} navigate={navigate} notify={notify} persistStatus={persistIncidentStatus} persistNote={persistIncidentNote}/>}
      {screen === "reports" && <Reports/>}
      {screen === "admin" && <Administration/>}
    </div></div>
    {toast && <div className="toast"><div><Icon name="check" size={16}/></div><span>{toast}</span><button onClick={() => setToast("")}><Icon name="x" size={15}/></button></div>}
  </div>;
}
