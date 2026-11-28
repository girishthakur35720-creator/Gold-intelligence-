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
