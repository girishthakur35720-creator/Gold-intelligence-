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

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((link) => link.classList.remove("active"));
    item.classList.add("active");
  });
});
