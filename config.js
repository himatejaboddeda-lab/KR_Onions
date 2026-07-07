// ============================================
// KR ONIONS STOCK UPDATE — CONFIG
// ============================================
// Edit this file to rename branches, change PINs,
// or plug in your Cloudflare Worker URL.
// ============================================

// ---- Branches -------------------------------------------------
// Rename "name" any time — id should stay the same once you have
// live data saved against it.
const BRANCHES = [
  { id: "branch1", name: "Hanuman Junction", pin: "1111" },
  { id: "branch2", name: "Gudiwada",         pin: "2222" },
  { id: "branch3", name: "Machilipatnam",    pin: "3333" }
];

// ---- Owner PIN --------------------------------------------------
const OWNER_PIN = "9999";

// ---- Products ---------------------------------------------------
const PRODUCTS = [
  { id: "onions",   name: "Onions",   hasVariety: true },
  { id: "garlic",   name: "Garlic",   hasVariety: false },
  { id: "tamarind", name: "Tamarind", hasVariety: false }
];

const ONION_VARIETIES = [
  { id: "small",  name: "Small Onions" },
  { id: "medium", name: "Medium Onions" },
  { id: "large",  name: "Large Onions" }
];

const UPDATE_TYPES = [
  { id: "before_lunch", name: "Before Lunch" },
  { id: "closing",      name: "Closing Stock" }
];

// ---- Cloudflare Worker URL -----------------------------------------
// After you create the Worker in the Cloudflare dashboard, it gives you
// a URL like: https://kr-onions-worker.your-subdomain.workers.dev
// Paste that here (no trailing slash).
const WORKER_URL = "https://kr-onions.boddedahimateja.workers.dev";
