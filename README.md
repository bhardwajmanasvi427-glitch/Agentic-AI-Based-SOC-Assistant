# SOC Assistant Frontend

A frontend-only prototype of an agentic AI-based Security Operations Center (SOC) assistant. It covers the path from detection to an analyst-approved response: login, role dashboards, alert queue, alert investigation, incident workspace, reports and administration.

**All data is fictional and lives in the browser.** There is no backend, database, API or external service, and no environment variables or secrets are needed.

## Requirements

- Node.js 20.19 or newer (22 recommended; see `.nvmrc`)
- npm 10 or newer (included with Node.js)

## Setup and run

```bash
npm install        # install dependencies from package-lock.json
npm run dev        # start the dev server at http://localhost:5173
```

Production build and local preview:

```bash
npm run build      # outputs static files to dist/
npm run preview    # serves dist/ at http://localhost:4173
```

For a clean, reproducible install (for example in CI), use `npm ci` instead of `npm install`.

## Demo sign-in

Choose a role and enter the password `1234`.

| Role | Focus | Screens available |
| --- | --- | --- |
| SOC Analyst | Triage alerts, review evidence, approve or dismiss response actions | Overview, Alert Queue, Investigation, Incident Workspace, Reports |
| Cybersecurity Engineer | Detection rules and models, noisy alerts, source health | Overview, Alert Queue (read-only), Investigation (read-only), Incident Workspace (read-only), Reports, Administration (rules, sources) |
| Incident Response Team | Contain and recover; carry out approved actions | Overview, Alert Queue (read-only), Investigation (read-only), Incident Workspace, Reports |
| IT Administrator | Users, access requests, data sources, system settings, audit log | Overview, Reports, Administration |

Use **Switch role** in the sidebar or the account menu to move between roles without signing out. Screens a role cannot use show a lock and an access-denied page with a way back to the dashboard.

## Suggested walkthrough

1. Sign in as **SOC Analyst**.
2. Open **Alert Queue**, filter to Critical, and open `ALR-2041`.
3. On **Investigation**, read the summary, then check the timeline, correlated events, threat intelligence and evidence. Mark each evidence item as reviewed.
4. Read the **AI summary** and the **AI suggestion** response actions. They are labelled and kept separate from analyst decisions.
5. Choose **Approve…** and confirm, or **Dismiss…** and give a reason. The action is recorded as approved by the analyst but is **not executed**.
6. Open the linked incident (`INC-318`), add a note, and update the status.
7. Select **Return to dashboard**.
8. Switch to **Incident Response Team** and use **Mark executed** on an approved action. Execution is simulated.

## Behaviour to know about

- AI content is always labelled **AI suggestion**. A response action is shown as approved only after an analyst confirms it, and as executed only after the Incident Response Team confirms it.
- Only SOC Analysts can approve or dismiss response actions.
- An incident cannot be set to Resolved until its containment checklist is complete, and it must be Resolved before it can be Closed.
- State is held in memory. Reloading the page resets everything to the starting data.
- Report export shows a preview you can copy. File downloads are not part of this prototype.

## Project structure

```
soc-assistant-frontend/
├── index.html            App shell and entry point
├── package.json          Scripts and dependencies
├── package-lock.json     Locked dependency versions
├── vite.config.js        Vite configuration
├── .nvmrc                Recommended Node.js version
├── public/
│   └── favicon.svg
└── src/
    ├── main.js           Loads fonts and styles, starts the app
    ├── styles.css        Design tokens and all component styles
    ├── data.js           Fictional alerts, incidents, users, sources, rules, roles
    ├── state.js          Client-side application state
    ├── ui.js             Icons, badges, tables helpers and SVG charts
    ├── screens.js        Login, shell and the six main screens
    └── app.js            Actions, confirmation dialogs, event handling, rendering
```

## Design system

- Near-black charcoal surfaces with one muted teal accent.
- Red, orange, yellow and green are used only for severity and status.
- IBM Plex Sans for the interface and IBM Plex Mono for IDs, timestamps and counts. Both are bundled through `@fontsource`, so the app works offline.
- Compact tables, small corner radii, no gradients or shadows beyond menus, and simple line icons.
- All colours, spacing and type sizes are defined in `src/styles.css`. Colour tokens are at the top of the file.

## Customising

- **Sample data:** edit `src/data.js`.
- **Demo password:** change the `'1234'` comparison in the sign-in handler in `src/app.js`.
- **Roles and permissions:** the `ROLES` object in `src/data.js` controls what each role can see and do.

## Notes

This is a demonstration prototype. It does not authenticate real users, store data, or connect to any security tool. Do not use the demo password or sample data for anything real.
