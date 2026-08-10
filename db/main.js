import "./style.css";
import {
  BANDS,
  INTERVENCION_COLUMNS,
  MEDICOS_COLUMNS,
} from "./columns.js";
import { API_BASE, APP_VERSION, DB_ACCESS_PIN, SESSION_KEY } from "./config.js";

const gatePanel = document.getElementById("gatePanel");
const boardPanel = document.getElementById("boardPanel");
const gateForm = document.getElementById("gateForm");
const pinInput = document.getElementById("pinInput");
const gateError = document.getElementById("gateError");
const summaryBar = document.getElementById("summaryBar");
const tableWrap = document.getElementById("tableWrap");
const statusLine = document.getElementById("statusLine");
const onlyComplete = document.getElementById("onlyComplete");
const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const logoutBtn = document.getElementById("logoutBtn");
const appVer = document.getElementById("appVer");

if (appVer) appVer.textContent = APP_VERSION;

let workbook = null;
let currentView = "medicos";
let currentPin = sessionStorage.getItem(`${SESSION_KEY}-pin`) || "";

function fmtDate(value) {
  if (value == null || value === "") return "—";
  try {
    return new Date(value).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

function esc(value) {
  return String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getPath(obj, path) {
  if (!obj) return null;
  if (!path.includes(".")) return obj[path];
  return path.split(".").reduce((acc, key) => (acc == null ? null : acc[key]), obj);
}

function formatCell(value, key = "") {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (
    key.toLowerCase().includes("at") ||
    key.toLowerCase().includes("fecha") ||
    key.endsWith("At") ||
    key === "registeredAt" ||
    key === "createdAt" ||
    key === "completedAt" ||
    key === "meterFinishedAt" ||
    key === "researcherRegisteredAt"
  ) {
    if (typeof value === "string" && value.includes("T")) return fmtDate(value);
  }
  if (value === "yes") return "Sí";
  if (value === "no") return "No";
  if (value === "female") return "Mujer";
  if (value === "male") return "Hombre";
  if (value === "prefer_not") return "Prefiere no decir";
  if (value === "general") return "Oftalmólogo general";
  if (value === "specialty") return "Alta especialidad";
  if (value === "ipl") return "IPL";
  if (value === "thermal") return "Térmico";
  if (value === "none") return "Ninguno";
  if (value === true) return "Sí";
  if (value === false) return "No";
  return String(value);
}

function doctorTone(id) {
  if (!id) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 8;
  }
  return hash;
}

function filteredInterventions() {
  const rows = workbook?.interventions || [];
  if (onlyComplete?.checked) return rows.filter((row) => row.status === "completa");
  return rows;
}

async function fetchWorkbook(pin) {
  const response = await fetch(`${API_BASE}/api/admin/workbook`, {
    headers: { "X-Admin-Pin": pin, Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 401) throw new Error("pin");
  if (!response.ok) throw new Error(`http_${response.status}`);
  return response.json();
}

function renderSummary() {
  if (!workbook?.summary) {
    summaryBar.innerHTML = "";
    return;
  }
  const s = workbook.summary;
  summaryBar.innerHTML = `
    <span class="pill">Médicos: <strong>${s.researchers}</strong></span>
    <span class="pill">Intervenciones: <strong>${s.interventions}</strong></span>
    <span class="pill">Completas: <strong>${s.completed}</strong></span>
    <span class="pill">Parciales: <strong>${s.partial}</strong></span>
  `;
}

function buildHeader(columns) {
  return `<tr>${columns
    .map(
      (c) =>
        `<th class="${BANDS[c.band]?.className || ""}" title="${esc(c.key)}">${esc(c.label)}</th>`,
    )
    .join("")}</tr>`;
}

function buildRow(columns, data, { tone = 0, secondary = false } = {}) {
  const cls = `doc-tone-${tone}${secondary ? " doc-secondary" : ""}`;
  const cells = columns
    .map((c) => {
      const raw = getPath(data, c.key);
      const text = formatCell(raw, c.key);
      return `<td class="${BANDS[c.band]?.className || ""}">${esc(text)}</td>`;
    })
    .join("");
  return `<tr class="${cls}">${cells}</tr>`;
}

function renderTable(columns, rowHtml) {
  tableWrap.innerHTML = `
    <table class="data sheet-full">
      <thead>${buildHeader(columns)}</thead>
      <tbody>${rowHtml || `<tr><td colspan="${columns.length}" class="muted">Sin datos</td></tr>`}</tbody>
    </table>`;
}

function renderMedicos() {
  const rows = workbook?.researchers || [];
  const html = rows
    .map((r) =>
      buildRow(MEDICOS_COLUMNS, r.flat || r, {
        tone: doctorTone(r.id),
        secondary: false,
      }),
    )
    .join("");
  renderTable(MEDICOS_COLUMNS, html);
}

function renderIntervenciones() {
  const rows = filteredInterventions();
  const html = rows
    .map((row) =>
      buildRow(INTERVENCION_COLUMNS, row.flat || row, {
        tone: doctorTone(row.researcherId),
      }),
    )
    .join("");
  renderTable(INTERVENCION_COLUMNS, html);
}

function renderAgrupado() {
  const only = onlyComplete?.checked;
  const groups = workbook?.grouped || [];
  const chunks = [];

  for (const group of groups) {
    const r = group.researcher;
    const tone = doctorTone(r.id);
    let list = group.interventions || [];
    if (only) list = list.filter((row) => row.status === "completa");

    if (!list.length) {
      // Médico sin intervenciones: igual una fila completa con flat del médico
      chunks.push(
        buildRow(MEDICOS_COLUMNS, r.flat || r, { tone, secondary: false }),
      );
      continue;
    }

    // Primera fila: médico + esa intervención (todos los campos de intervención)
    const first = list[0];
    chunks.push(
      buildRow(INTERVENCION_COLUMNS, first.flat || first, {
        tone,
        secondary: false,
      }),
    );
    for (const row of list.slice(1)) {
      chunks.push(
        buildRow(INTERVENCION_COLUMNS, row.flat || row, {
          tone,
          secondary: true,
        }),
      );
    }
  }

  // Si hay grupos sin intervenciones usamos MEDICOS_COLUMNS; si hay mixtas, unificar a INTERVENCION
  const hasAnyIntervention = groups.some((g) =>
    (g.interventions || []).some((i) => (only ? i.status === "completa" : true)),
  );
  renderTable(
    hasAnyIntervention ? INTERVENCION_COLUMNS : MEDICOS_COLUMNS,
    chunks.join(""),
  );
}

function render() {
  renderSummary();
  if (currentView === "medicos") renderMedicos();
  else if (currentView === "intervenciones") renderIntervenciones();
  else renderAgrupado();
}

async function loadData() {
  statusLine.textContent = "Cargando registros…";
  try {
    workbook = await fetchWorkbook(currentPin);
    statusLine.textContent = `Actualizado ${fmtDate(workbook.generatedAt)} · una fila = todos los parámetros`;
    render();
  } catch (err) {
    if (err.message === "pin") {
      lockBoard();
      gateError.hidden = false;
      statusLine.textContent = "PIN incorrecto o sesión cerrada";
      return;
    }
    statusLine.textContent =
      "No se pudo cargar (¿API despertando en Render?). Reintenta con Actualizar ahora.";
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function exportCsv() {
  let columns = MEDICOS_COLUMNS;
  let rows = [];
  if (currentView === "medicos") {
    columns = MEDICOS_COLUMNS;
    rows = (workbook?.researchers || []).map((r) => r.flat || r);
  } else if (currentView === "intervenciones") {
    columns = INTERVENCION_COLUMNS;
    rows = filteredInterventions().map((r) => r.flat || r);
  } else {
    columns = INTERVENCION_COLUMNS;
    for (const group of workbook?.grouped || []) {
      let list = group.interventions || [];
      if (onlyComplete?.checked) list = list.filter((i) => i.status === "completa");
      if (!list.length) {
        rows.push(group.researcher.flat || group.researcher);
        columns = MEDICOS_COLUMNS;
      } else {
        rows.push(...list.map((i) => i.flat || i));
      }
    }
  }
  if (!rows.length) {
    statusLine.textContent = "Nada que exportar";
    return;
  }
  const lines = [
    columns.map((c) => csvEscape(c.label)).join(","),
    ...rows.map((row) =>
      columns.map((c) => csvEscape(formatCell(getPath(row, c.key), c.key))).join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orion-db-${currentView}-completo-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function startBoard(pin) {
  currentPin = pin;
  sessionStorage.setItem(SESSION_KEY, "1");
  sessionStorage.setItem(`${SESSION_KEY}-pin`, pin);
  gatePanel.hidden = true;
  boardPanel.hidden = false;
  void loadData();
}

function lockBoard() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(`${SESSION_KEY}-pin`);
  currentPin = "";
  workbook = null;
  boardPanel.hidden = true;
  gatePanel.hidden = false;
  pinInput.value = "";
}

gateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const pin = String(pinInput.value || "").trim();
  if (pin !== DB_ACCESS_PIN) {
    gateError.hidden = false;
    return;
  }
  gateError.hidden = true;
  startBoard(pin);
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentView = btn.dataset.view || "medicos";
    document.querySelectorAll(".filter-btn").forEach((el) => {
      el.classList.toggle("active", el === btn);
    });
    render();
  });
});

onlyComplete?.addEventListener("change", () => render());
refreshBtn.addEventListener("click", () => void loadData());
exportBtn.addEventListener("click", exportCsv);
logoutBtn.addEventListener("click", lockBoard);

if (sessionStorage.getItem(SESSION_KEY) === "1" && currentPin) {
  startBoard(currentPin);
}
