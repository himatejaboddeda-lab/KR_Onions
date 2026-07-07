// ============================================
// SHARED HELPERS — KR Onions Stock Update
// ============================================

// ---- Session state helpers --------------------------------------
const Session = {
  set(key, value) { sessionStorage.setItem(key, JSON.stringify(value)); },
  get(key, fallback = null) {
    const v = sessionStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  },
  clearManagerFlow() {
    ["branchId", "branchName", "managerName", "product", "productName",
     "variety", "varietyName"].forEach(k => sessionStorage.removeItem(k));
  }
};

// ---- Date / time helpers ------------------------------------------
function dateKeyFor(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function prettyDate(d = new Date()) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function prettyTime(d = new Date()) {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function updateTypeLabel(id) {
  const u = UPDATE_TYPES.find(u => u.id === id);
  return u ? u.name : id;
}

// ---- Number formatting ----------------------------------------------
function fmtNum(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

// ---- Toast / message banner ------------------------------------------
function showBanner(msg, type = "success") {
  let el = document.getElementById("kr-banner");
  if (!el) {
    el = document.createElement("div");
    el.id = "kr-banner";
    document.body.appendChild(el);
  }
  el.className = `kr-banner kr-banner-${type} show`;
  el.textContent = msg;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 3200);
}

// ---- Guard helpers ----------------------------------------------------
function requireManagerSession(redirectTo = "index.html") {
  const branchId = Session.get("branchId");
  if (!branchId) {
    window.location.href = redirectTo;
    return null;
  }
  return branchId;
}

function requireOwnerSession(redirectTo = "index.html") {
  if (!Session.get("isOwner")) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

// ---- Backend API: save a stock record ----------------------------------
async function saveStockRecord(record) {
  const res = await fetch(`${WORKER_URL}/api/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
  return data;
}

// ---- Backend API: fetch records for a date (optionally filtered) --------
async function fetchRecordsByDate(dateKey, filters = {}) {
  const params = new URLSearchParams({ date: dateKey });
  if (filters.branchId) params.set("branch", filters.branchId);
  if (filters.productType) params.set("product", filters.productType);
  if (filters.updateType) params.set("updateType", filters.updateType);

  const res = await fetch(`${WORKER_URL}/api/records?${params.toString()}`);
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  return await res.json();
}

// ---- Poll "today" every few seconds for a live-ish dashboard -------------
function pollTodayRecords(callback, onError, intervalMs = 8000) {
  const todayKey = dateKeyFor();
  let stopped = false;

  async function tick() {
    if (stopped) return;
    try {
      const rows = await fetchRecordsByDate(todayKey);
      callback(rows);
    } catch (err) {
      if (onError) onError(err);
    }
  }

  tick();
  const timer = setInterval(tick, intervalMs);
  return () => { stopped = true; clearInterval(timer); };
}

// ---- Build breakdown line label -----------------------------------------
function lineLabel(record) {
  if (record.productType === "onions") {
    const v = ONION_VARIETIES.find(v => v.id === record.variety);
    return v ? v.name : "Onions";
  }
  const p = PRODUCTS.find(p => p.id === record.productType);
  return p ? p.name : record.productType;
}

// ---- WhatsApp message builder --------------------------------------------
function buildWhatsAppMessage({ branchName, dateLabel, timeLabel, updateTypeName, records, managerName }) {
  let totalBags = 0, totalKgs = 0;
  const lines = records.map(r => {
    totalBags += Number(r.bags || 0);
    totalKgs += Number(r.kgs || 0);
    return `- ${lineLabel(r)}: ${fmtNum(r.bags)} bags, ${fmtNum(r.kgs)} kgs`;
  });

  return [
    "KR Onions Stock Update",
    `Branch: ${branchName}`,
    `Date: ${dateLabel}`,
    `Time: ${timeLabel}`,
    `Update Type: ${updateTypeName}`,
    "",
    `Total Bags: ${fmtNum(totalBags)}`,
    `Total Kgs: ${fmtNum(totalKgs)}`,
    "",
    "Breakdown:",
    ...lines,
    "",
    `Updated by: ${managerName}`
  ].join("\n");
}

function whatsappShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// ---- Register service worker (PWA) ---------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
