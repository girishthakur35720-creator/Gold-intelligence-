const modal = document.getElementById("zoneModal");
const form = document.getElementById("zoneForm");
const rows = document.getElementById("zoneRows");

document.getElementById("addZoneBtn").addEventListener("click", () => {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
});
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}
document.getElementById("closeModal").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

const STORAGE_KEYS = {
  manualZones: "gold-intelligence.manual-zones.v1",
  activeSection: "gold-intelligence.active-section.v1"
};

function readSaved(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}
function saveValue(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {
    // Keep the workspace usable if browser storage is unavailable or full.
  }
}

let manualZones = readSaved(STORAGE_KEYS.manualZones, []);
if (!Array.isArray(manualZones)) manualZones = [];

function renderManualZone(zone, prepend = false) {
  const symbolClass = zone.type === "Support" ? "support" : zone.type === "Resistance" ? "resistance" : "neutral";
  const typeClass = zone.type === "Support" ? "support-text" : zone.type === "Resistance" ? "resistance-text" : "neutral-text";
  const status = zone.type === "LVN" ? "Manual LVN" : "Manual level";
  const row = document.createElement("tr");
  row.dataset.manualZone = "true";
  row.innerHTML = `<td><span class="zone-symbol ${symbolClass}">M</span><strong>${escapeHtml(zone.name)}</strong></td>
    <td class="mono">${Number(zone.low).toFixed(2)} – ${Number(zone.high).toFixed(2)}</td>
    <td><span class="type ${typeClass}">${escapeHtml(zone.type)}</span></td>
    <td>Not assessed</td><td>User-defined</td><td><span class="status-pill watch-pill">${status}</span></td>`;
  if (prepend) rows.prepend(row); else rows.append(row);
}
manualZones.forEach((zone) => {
  if (zone && typeof zone.name === "string" && Number.isFinite(Number(zone.low)) &&
      Number.isFinite(Number(zone.high)) && Number(zone.low) < Number(zone.high) &&
      ["Support", "Resistance", "LVN"].includes(zone.type)) renderManualZone(zone);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const zone = {
    name: String(data.get("name")).trim(),
    low: Number(data.get("low")),
    high: Number(data.get("high")),
    type: String(data.get("type"))
  };
  if (!zone.name || !Number.isFinite(zone.low) || !Number.isFinite(zone.high) ||
      zone.low >= zone.high || !["Support", "Resistance", "LVN"].includes(zone.type)) {
    alert("Enter a zone name and a valid price range. Upper price must be greater than lower price.");
    return;
  }
  manualZones.unshift(zone);
  saveValue(STORAGE_KEYS.manualZones, manualZones);
  renderManualZone(zone, true);
  form.reset();
  closeModal();
});

const navLinks = Array.from(document.querySelectorAll(".nav-item"));
const navSections = navLinks.map((link) => ({
  link,
  section: document.getElementById(decodeURIComponent(link.hash.slice(1)))
})).filter((item) => item.section);

function setActiveNav(activeLink) {
  navLinks.forEach((link) => {
    const active = link === activeLink;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  if (activeLink) saveValue(STORAGE_KEYS.activeSection, activeLink.hash.slice(1));
}

function syncActiveNav() {
  const marker = window.scrollY + Math.min(190, window.innerHeight * 0.28);
  let current = navSections[0];
  for (const item of navSections) {
    if (item.section.getBoundingClientRect().top + window.scrollY <= marker) current = item;
    else break;
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
    current = navSections[navSections.length - 1];
  }
  if (current) setActiveNav(current.link);
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const target = navSections.find((item) => item.link === link);
    if (target) setActiveNav(link);
  });
});
let navTicking = false;
function requestNavSync() {
  if (navTicking) return;
  navTicking = true;
  window.requestAnimationFrame(() => {
    syncActiveNav();
    navTicking = false;
  });
}
window.addEventListener("scroll", requestNavSync, { passive: true });
window.addEventListener("resize", requestNavSync);

// Restore the last workspace section after a reload; first visit stays on Overview.
const savedSection = readSaved(STORAGE_KEYS.activeSection, "overview");
const savedTarget = navSections.find((item) => item.section.id === savedSection);
if (savedTarget) {
  requestAnimationFrame(() => {
    savedTarget.section.scrollIntoView({ block: "start" });
    setActiveNav(savedTarget.link);
  });
} else {
  syncActiveNav();
}

function updateProfileState() {
  const badge = document.querySelector(".freeze-badge");
  if (!badge) return;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour").value);
  const minute = Number(parts.find((part) => part.type === "minute").value);
  const total = hour * 60 + minute;
  const live = total >= 330 && total < 570;
  badge.classList.toggle("is-live", live);
  badge.classList.toggle("is-frozen", !live);
  badge.innerHTML = live
    ? '<span aria-hidden="true">◉</span> PROFILE LIVE <b>UNTIL 09:30</b>'
    : '<span aria-hidden="true">❄</span> PROFILE FROZEN <b>09:30</b>';
  badge.setAttribute("aria-label", live
    ? "Volume profile is live and building until 9:30 AM India time"
    : "Volume profile is frozen");
}
updateProfileState();
setInterval(updateProfileState, 30000);


/* Persistent chart workspace: Lightweight Charts + public Hyperliquid candles */
(() => {
  const host = document.getElementById("goldChart");
  if (!host || !window.LightweightCharts) return;
  const KEY = "gold-intelligence.chart-workspace.v1";
  const defaults = { theme: "dark", interval: "5m", levels: [], range: null };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) {}
  const prefs = { ...defaults, ...saved };
  if (!Array.isArray(prefs.levels)) prefs.levels = [];
  const intervals = { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h", "4h": "4h", "1d": "1d" };
  let chart, candleSeries, coin = null, pendingLevel = false, resizeObserver;
  const levelLines = [];
  const $ = (id) => document.getElementById(id);
  const fmt = (v) => Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); $("chartSaveStatus").textContent = "Saved in this browser"; } catch (_) {
      $("chartSaveStatus").textContent = "Browser storage unavailable";
    }
  }
  function palette() {
    return prefs.theme === "light"
      ? { bg: "#f4f7fb", text: "#263447", grid: "#e1e7ef", border: "#cbd5e1", cross: "#7c8da3" }
      : { bg: "#0b1119", text: "#aab8c9", grid: "#1d2a39", border: "#29394b", cross: "#75869a" };
  }
  function makeChart() {
    const p = palette();
    chart = LightweightCharts.createChart(host, {
      width: host.clientWidth || 900, height: host.clientHeight || 500,
      layout: { background: { type: "solid", color: p.bg }, textColor: p.text, fontFamily: "DM Mono, monospace", fontSize: 11 },
      grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal, vertLine: { color: p.cross, labelBackgroundColor: "#b68a43" }, horzLine: { color: p.cross, labelBackgroundColor: "#b68a43" } },
      rightPriceScale: { borderColor: p.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: p.border, timeVisible: true, secondsVisible: false, rightOffset: 8, barSpacing: 7, fixLeftEdge: true },
      localization: { priceFormatter: fmt },
      handleScroll: true, handleScale: true
    });
    candleSeries = chart.addCandlestickSeries({
      upColor: "#20b887", downColor: "#e56f73", borderUpColor: "#20b887", borderDownColor: "#e56f73",
      wickUpColor: "#20b887", wickDownColor: "#e56f73", priceLineVisible: true, lastValueVisible: true
    });
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) { prefs.range = range; persist(); }
    });
    chart.subscribeClick((param) => {
      if (!pendingLevel || !param || !param.point) return;
      const price = candleSeries.coordinateToPrice(param.point.y);
      if (!Number.isFinite(price)) return;
      prefs.levels.push({ price: Number(price.toFixed(2)), color: "#d6a84f" });
      pendingLevel = false;
      $("addChartLevel").classList.remove("armed");
      drawLevels(); persist();
    });
    resizeObserver = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      chart.applyOptions({ width: Math.floor(box.width), height: Math.floor(box.height) });
    });
    resizeObserver.observe(host);
    drawLevels();
  }
  function drawLevels() {
    levelLines.splice(0).forEach((line) => candleSeries.removePriceLine(line));
    prefs.levels.forEach((item) => {
      const line = candleSeries.createPriceLine({ price: Number(item.price), color: item.color || "#d6a84f", lineWidth: 1, lineStyle: LightweightCharts.LineStyle.Dashed, axisLabelVisible: true, title: "MANUAL" });
      levelLines.push(line);
    });
  }
  function applyTheme() {
    document.documentElement.dataset.theme = prefs.theme;
    const button = $("chartThemeToggle");
    const appButton = $("appThemeToggle");
    if (button) button.textContent = prefs.theme === "dark" ? "☀ Light mode" : "☾ Dark mode";
    if (appButton) appButton.textContent = prefs.theme === "dark" ? "☀" : "☾";
    if (chart) {
      const p = palette();
      chart.applyOptions({ layout: { background: { type: "solid", color: p.bg }, textColor: p.text }, grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } }, rightPriceScale: { borderColor: p.border }, timeScale: { borderColor: p.border } });
    }
    persist();
  }
  function setIntervalValue(value) {
    if (!intervals[value]) return;
    prefs.interval = value;
    document.querySelectorAll("[data-interval]").forEach((b) => b.classList.toggle("selected", b.dataset.interval === value));
    persist(); loadCandles();
  }
  async function discoverCoin() {
    const response = await fetch("https://api.hyperliquid.xyz/info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "metaAndAssetCtxs" }) });
    if (!response.ok) throw new Error("Hyperliquid discovery HTTP " + response.status);
    const meta = await response.json();
    const assets = meta && meta[0] && meta[0].universe || [];
    const match = assets.find((x) => /gold|xau/i.test(x.name || ""));
    if (match) return match.name;
    const dexResponse = await fetch("https://api.hyperliquid.xyz/info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "perpDexs" }) });
    if (!dexResponse.ok) throw new Error("No gold contract on main DEX");
    const dexs = await dexResponse.json();
    for (const dex of (dexs || [])) {
      if (!dex || !dex.name) continue;
      try {
        const r = await fetch("https://api.hyperliquid.xyz/info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "metaAndAssetCtxs", dex: dex.name }) });
        if (!r.ok) continue;
        const m = await r.json();
        const found = (m && m[0] && m[0].universe || []).find((x) => /gold|xau/i.test(x.name || ""));
        if (found) return dex.name + ":" + found.name;
      } catch (_) {}
    }
    throw new Error("No supported GOLD/XAU perpetual found");
  }
  async function loadCandles() {
    if (!coin) return;
    $("chartFeedStatus").textContent = "LOADING " + coin.toUpperCase() + " · " + prefs.interval;
    $("chartEmpty").style.display = "none";
    try {
      const endTime = Date.now();
      const durations = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400 };
      const startTime = endTime - durations[prefs.interval] * 1000 * 500;
      const response = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "candleSnapshot", req: { coin, interval: prefs.interval, startTime, endTime } })
      });
      if (!response.ok) throw new Error("Candle feed HTTP " + response.status);
      const raw = await response.json();
      const candles = (Array.isArray(raw) ? raw : []).map((x) => ({ time: Math.floor(Number(x.t) / 1000), open: Number(x.o), high: Number(x.h), low: Number(x.l), close: Number(x.c) }))
        .filter((x) => Number.isFinite(x.time) && x.open > 0 && x.high > 0 && x.low > 0 && x.close > 0)
        .sort((a, b) => a.time - b.time);
      if (!candles.length) throw new Error("No candles returned for " + coin);
      const unique = candles.filter((c, i) => !i || c.time !== candles[i - 1].time);
      candleSeries.setData(unique);
      drawLevels();
      if (prefs.range) {
        try { chart.timeScale().setVisibleLogicalRange(prefs.range); } catch (_) { chart.timeScale().fitContent(); }
      } else {
        chart.timeScale().fitContent();
      }
      $("chartFeedStatus").textContent = coin.toUpperCase() + " · " + unique.length + " BARS · " + prefs.interval.toUpperCase();
      $("chartEmpty").style.display = "none";
    } catch (error) {
      $("chartFeedStatus").textContent = "FEED UNAVAILABLE";
      $("chartEmpty").style.display = "grid";
      $("chartEmpty").textContent = error.message + ". Chart is waiting for an accessible public gold candle market.";
    }
  }
  $("chartThemeToggle").addEventListener("click", () => { prefs.theme = prefs.theme === "dark" ? "light" : "dark"; applyTheme(); });
  $("appThemeToggle").addEventListener("click", () => { prefs.theme = prefs.theme === "dark" ? "light" : "dark"; applyTheme(); });
  document.querySelectorAll("[data-interval]").forEach((button) => button.addEventListener("click", () => setIntervalValue(button.dataset.interval)));
  $("addChartLevel").addEventListener("click", () => {
    pendingLevel = !pendingLevel;
    $("addChartLevel").classList.toggle("armed", pendingLevel);
    $("chartFeedStatus").textContent = pendingLevel ? "CLICK CHART TO PLACE LEVEL" : "LEVEL TOOL CANCELLED";
  });
  $("clearChartLevels").addEventListener("click", () => { prefs.levels = []; drawLevels(); persist(); });
  makeChart();
  applyTheme();
  setInterval(() => { if (coin) loadCandles(); }, 60000);
  discoverCoin().then((found) => { coin = found; loadCandles(); }).catch((error) => {
    $("chartFeedStatus").textContent = "FEED UNAVAILABLE";
    $("chartEmpty").style.display = "grid";
    $("chartEmpty").textContent = error.message + ". Public candle data could not be discovered.";
  });
})();
