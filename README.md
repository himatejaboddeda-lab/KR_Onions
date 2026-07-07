# KR Onions Stock Update — Setup & Deployment Guide

A mobile-first PWA for KR Onions' three wholesale branches (Hanuman Junction, Gudiwada,
Machilipatnam) to log stock and let the owner watch it live — using **Cloudflare Workers +
KV** as the backend (no Firebase, no command line, everything through the dashboard).

## 1. Folder structure

```
kr-onions-stock/
├── index.html               Role selection (Owner / Manager)
├── manager-branch.html      Branch selection + manager PIN gate
├── manager-product.html     Onions / Garlic / Tamarind
├── manager-variety.html     Small / Medium / Large (onions only)
├── manager-entry.html       Stock entry form (bags, kgs, update type, notes)
├── manager-summary.html     Confirmation + Share to WhatsApp
├── owner-dashboard.html     "Today" view, grouped by branch (auto-refreshes)
├── owner-history.html       Date/branch/product/update-type filtered history
├── manifest.json            PWA manifest
├── service-worker.js        Offline app-shell caching
├── css/style.css            All styling
├── js/config.js             Branches, PINs, Worker URL — EDIT THIS FIRST
├── js/app.js                Shared helpers (save, fetch, WhatsApp text, etc.)
├── icons/icon-192.png, icon-512.png
└── worker/worker.js          Paste this into the Cloudflare Worker editor
```

## 2. Create the Worker (Cloudflare dashboard only — no CLI)

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create** →
   **Create Worker**.
2. Give it a name, e.g. `kr-onions-worker`, then **Deploy** (it deploys a "Hello World"
   placeholder — that's fine, you'll replace the code next).
3. Click **Edit code** on the Worker. Delete everything in the editor and paste in the
   full contents of `worker/worker.js` from this project. Click **Deploy**.
4. Copy the Worker's URL shown at the top — it looks like:
   `https://kr-onions-worker.<your-subdomain>.workers.dev`

## 3. Create the KV namespace and bind it

1. Still in the dashboard: **Workers & Pages → KV** (left sidebar) → **Create a
   namespace**. Name it `STOCK_KV` (or any name) → **Add**.
2. Go back to your Worker → **Settings → Variables** → scroll to **KV Namespace
   Bindings** → **Add binding**.
   - **Variable name:** `STOCK_KV`  ← must match exactly, the code depends on this name
   - **KV namespace:** select the namespace you just created
3. **Save and deploy.**

That's the entire backend — no servers, no wrangler, no npm install.

## 4. Point the app at your Worker

Open `js/config.js` and set:

```js
const WORKER_URL = "https://kr-onions-worker.<your-subdomain>.workers.dev";
```

(paste the exact URL from Step 2, no trailing slash)

## 5. Rename branches / change PINs

Still in `js/config.js`:

```js
const BRANCHES = [
  { id: "branch1", name: "Hanuman Junction", pin: "1111" },
  { id: "branch2", name: "Gudiwada",         pin: "2222" },
  { id: "branch3", name: "Machilipatnam",    pin: "3333" }
];
const OWNER_PIN = "9999";
```

Change `name` and `pin` freely. **Don't change `id`** once real data exists for that
branch — it's used to link stock records to the branch.

⚠️ These are simple PINs for v1, checked only in the browser — fine for an internal
tool, not meant to stop a determined person. Nothing sensitive is stored.

## 6. Host the frontend on GitHub Pages

1. Create a GitHub repo, e.g. `kr-onions-stock`.
2. Push everything **except the `worker/` folder** (that one only needs to live in the
   Cloudflare dashboard, but it's harmless to leave it in the repo too) to the repo root.
3. **Settings → Pages → Source: Deploy from a branch → main / (root)** → Save.
4. Your live app appears at: `https://<your-username>.github.io/kr-onions-stock/`

## 7. Test it

- Open the GitHub Pages link on your phone.
- Try Manager → pick a branch → enter PIN `1111`/`2222`/`3333` → save a stock update.
- Open Owner → PIN `9999` → you should see that update appear within a few seconds
  (the dashboard polls the Worker every 8 seconds — no realtime push, but close to it).
- Check History → pick today's date → your record should be listed.
- Tap **Share to WhatsApp** on the confirmation screen.

**Add to Home Screen** (this is the "app" for now, no APK needed yet):
- Android Chrome: ⋮ menu → **Add to Home screen**
- iPhone Safari: Share → **Add to Home Screen**
- Mac Chrome/Edge: install icon in the address bar → **Install**

## 8. How the data flows

Every save sends a `POST /api/records` to your Worker with the entry details. The
Worker stamps it with an IST date/time, gives it an id, and writes it to KV under a key
like `rec:2026-07-06:<timestamp>:<id>`.

Reading uses `GET /api/records?date=2026-07-06&branch=branch1&product=onions` — the
Worker lists all KV keys for that date, filters in memory, and returns them newest-first.

The **Owner Dashboard** polls today's records every 8 seconds and, per branch, takes the
**latest record per product+variety** as the current stock (so Closing overwrites Before
Lunch for that item — matches how a real stock book works). **History** instead lists
every individual saved record for the chosen date, so both entries show up separately.

## 9. When you're ready for an APK later

Nothing to change in the code for this — once the GitHub Pages link is live and
installable as a PWA, paste that link into **pwabuilder.com** and it will generate a
signed Android APK straight from your manifest.json and service worker. No rebuild
needed on the Worker/KV side.

## 10. What's already working in this version

- Branch → Product → Variety → Entry flow, PIN-gated per branch
- Save to Cloudflare KV with validation (no empty/negative bags or kgs)
- Auto IST date/time stamp on every save
- Owner dashboard, grouped by branch, refreshing every few seconds
- History page filterable by date, branch, product, and update type
- Share to WhatsApp with the exact message format you specified
- Installable PWA (manifest + service worker + icon)

## 11. Natural next upgrades (not built yet, on purpose)

- Real authentication instead of plain PINs
- Editing/deleting a record (currently create-only, matching a paper-book mindset)
- Exporting history to CSV/Excel for the owner
- A scheduled Worker Cron Trigger to nudge branches that haven't updated by a set time
