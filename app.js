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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name")).trim();
  const low = Number(data.get("low"));
  const high = Number(data.get("high"));
  const type = String(data.get("type"));

  if (!name || !Number.isFinite(low) || !Number.isFinite(high) || low >= high) {
    alert("Enter a zone name and a valid price range. Upper price must be greater than lower price.");
    return;
  }

  const symbolClass = type === "Support" ? "support" : type === "Resistance" ? "resistance" : "neutral";
  const typeClass = type === "Support" ? "support-text" : type === "Resistance" ? "resistance-text" : "neutral-text";
  const status = type === "Support" ? "Manual level" : type === "Resistance" ? "Manual level" : "Manual LVN";
  const row = document.createElement("tr");
  row.innerHTML = `<td><span class="zone-symbol ${symbolClass}">M</span><strong>${escapeHtml(name)}</strong></td>
    <td class="mono">${low.toFixed(2)} – ${high.toFixed(2)}</td>
    <td><span class="type ${typeClass}">${type}</span></td>
    <td>Not assessed</td><td>User-defined</td><td><span class="status-pill watch-pill">${status}</span></td>`;
  rows.prepend(row);
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
syncActiveNav();

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
