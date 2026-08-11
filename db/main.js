import "./style.css";
import "../shared/sophiaMosaic.css";
import { mountSophiaMosaic } from "../shared/sophiaMosaic.js";
import {
  BANDS,
  INTERVENCION_COLUMNS,
  INVITACIONES_COLUMNS,
  MEDICOS_COLUMNS,
} from "./columns.js";
import { API_BASE, APP_VERSION, DB_ACCESS_PIN, SESSION_KEY } from "./config.js";

mountSophiaMosaic({ tint: "#38bdf8" });

const gatePanel = document.getElementById("gatePanel");
const boardPanel = document.getElementById("boardPanel");
const gateForm = document.getElementById("gateForm");
const pinInput = document.getElementById("pinInput");
const gateError = document.getElementById("gateError");
const summaryBar = document.getElementById("summaryBar");
const medicosDash = document.getElementById("medicosDash");
const tableWrap = document.getElementById("tableWrap");
const statusLine = document.getElementById("statusLine");
const onlyComplete = document.getElementById("onlyComplete");
const onlyCompleteWrap = document.getElementById("onlyCompleteWrap");
const inviteFilters = document.getElementById("inviteFilters");
const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const logoutBtn = document.getElementById("logoutBtn");
const appVer = document.getElementById("appVer");

if (appVer) appVer.textContent = APP_VERSION;

let workbook = null;
let invitationsData = null;
let currentView = "medicos";
let inviteFilter = "all";
let repRankSort = { key: "invited", dir: "desc" };
let currentPin = sessionStorage.getItem(`${SESSION_KEY}-pin`) || "";
/** Subespecialidad enfocada en la 2.ª gráfica de especialidades. */
let specialtyFocusSlug = "";

const SPECIALTY_SHORT = {
  cornea: "Córnea",
  refractive: "Refractiva",
  cataract: "Catarata",
  glaucoma: "Glaucoma",
  retina: "Retina",
  uvea: "Úvea",
  pediatric: "Pediátrica",
  oculoplastics: "Oculoplástica",
  neuro: "Neuro",
  oncology: "Oncología",
  lowVision: "Baja visión",
  pathology: "Patología",
  other: "Otra",
};

const CHART_PALETTE = [
  "#38bdf8",
  "#4ade80",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#2dd4bf",
  "#fb923c",
  "#60a5fa",
  "#e879f9",
  "#34d399",
  "#f87171",
  "#c084fc",
  "#94a3b8",
];

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

function isLocationDetailKey(key = "") {
  const k = key.toLowerCase();
  return (
    k.includes("locsource") ||
    k.includes("loccountry") ||
    k.includes("locstate") ||
    k.includes("loclocality") ||
    k.includes("loclabel") ||
    k.includes("loclat") ||
    k.includes("loclng") ||
    k.includes("locaccuracy") ||
    k.includes("loccity") ||
    k.includes("loccapturedat") ||
    k.includes("locplaceid")
  );
}

function locationProvided(data, key) {
  const raw = getPath(data, key);
  if (raw === true || raw === false) return raw;
  // Compatibilidad si el API aún no manda *Provided
  const base = key.replace(/Provided$/i, "");
  const source = getPath(data, `${base}Source`);
  return source === "device" || source === "geocoded";
}

function formatCell(value, key = "", data = null) {
  const k = key.toLowerCase();
  if (key === "soloRegistrado") {
    const only =
      value === true ||
      (data != null && Number(getPath(data, "counts.total") ?? 0) === 0);
    return only ? "Solo registrado" : "—";
  }
  if (key === "counts.completed") {
    const n =
      value != null
        ? Number(value)
        : Number(getPath(data, "counts.completed") ?? 0);
    return Number.isFinite(n) ? String(n) : "0";
  }
  if (k.includes("locprovided") || k.endsWith("provided")) {
    const on = data ? locationProvided(data, key) : value === true;
    return on ? "✓" : "✗";
  }
  if (isLocationDetailKey(key)) {
    if (data) {
      const providedKey = key.replace(
        /(Source|Country|State|Locality|Label|Lat|Lng|Accuracy|City|CapturedAt|PlaceId)$/i,
        "Provided",
      );
      if (!locationProvided(data, providedKey) && (value == null || value === "")) {
        return "";
      }
    } else if (value == null || value === "") {
      return "";
    }
  }
  if (
    (k.includes("specialtyother") || k.endsWith("specialtyother")) &&
    (value == null || value === "")
  ) {
    return "";
  }
  if (value == null || value === "") return "—";
  if (k.includes("osdi6hecho") || k.includes("osdi6done")) {
    if (value === true || value === "yes") return "Sí (realizado)";
    if (value === false || value === "no") return "No (no realizado)";
  }
  if (k.includes("osdi6posibleojoseco") || k.includes("possibledryeye")) {
    if (value === true) return "Sí (posible ojo seco)";
    if (value === false) return "No (poco probable)";
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (
    k.includes("at") ||
    k.includes("fecha") ||
    key.endsWith("At") ||
    key === "registeredAt" ||
    key === "createdAt" ||
    key === "completedAt" ||
    key === "meterFinishedAt" ||
    key === "researcherRegisteredAt"
  ) {
    if (typeof value === "string" && value.includes("T")) return fmtDate(value);
  }
  if (value === "device") return "Dispositivo (GPS)";
  if (value === "geocoded") return "Ciudad buscada";
  if (value === "skipped") return "Omitido";
  if (value === "yes") return "Sí";
  if (value === "no") return "No";
  if (value === "female") return "Mujer";
  if (value === "male") return "Hombre";
  if (value === "prefer_not") return "Prefiere no decir";
  if (value === "general") return "Oftalmólogo general";
  if (value === "specialty") return "Alta especialidad";
  if (value === "other") return "Otra";
  if (value === "ipl") return "IPL";
  if (value === "thermal") return "Térmico";
  if (value === "none") return "Ninguno";
  if (value === true) return "Sí";
  if (value === false) return "No";
  return String(value);
}

/** Tonos bien separados para seguir la fila completa. */
const HUES = [199, 158, 42, 18, 328, 268, 187, 118, 350, 78, 230, 290];

function hashTone(id, mod = HUES.length) {
  if (!id) return 0;
  let hash = 0;
  const text = String(id);
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash + text.charCodeAt(i) * (i + 1)) % mod;
  }
  return hash;
}

function hueForDoctor(id) {
  return HUES[hashTone(id)];
}

/** Color estable por intervención (no cambia al filtrar). */
function hueForCase(id, fallbackIndex = 0) {
  if (id) return HUES[hashTone(id)];
  return HUES[fallbackIndex % HUES.length];
}

function buildHeader(columns) {
  return `<tr>${columns
    .map(
      (c) =>
        `<th class="${BANDS[c.band]?.className || ""}" title="${esc(c.key)}">${esc(c.label)}</th>`,
    )
    .join("")}</tr>`;
}

/**
 * @param {{ hue: number, lightness?: number, saturation?: number, mode?: string }} color
 */
function buildRow(columns, data, color = {}) {
  const hue = Number.isFinite(color.hue) ? color.hue : 200;
  const lightness = color.lightness ?? 26;
  const saturation = color.saturation ?? 42;
  const mode = color.mode || "row";
  const style = `--row-h:${hue};--row-l:${lightness};--row-s:${saturation}`;
  const cells = columns
    .map((c) => {
      const raw = getPath(data, c.key);
      const text = formatCell(raw, c.key, data);
      const band = BANDS[c.band]?.className || "";
      const k = c.key.toLowerCase();
      if (c.key === "soloRegistrado") {
        const only =
          raw === true || Number(getPath(data, "counts.total") ?? 0) === 0;
        return only
          ? `<td class="${band}"><span class="badge mute">Solo registrado</span></td>`
          : `<td class="${band} muted">—</td>`;
      }
      if (c.key === "counts.completed") {
        const n = Number(raw ?? 0);
        const safe = Number.isFinite(n) ? n : 0;
        return safe > 0
          ? `<td class="${band}"><span class="badge ok">${safe}</span></td>`
          : `<td class="${band}">${safe}</td>`;
      }
      if (k.includes("locprovided") || k.endsWith("provided")) {
        const on = locationProvided(data, c.key);
        return `<td class="${band} loc-flag ${on ? "is-on" : "is-off"}">${on ? "✓" : "✗"}</td>`;
      }
      if (isLocationDetailKey(c.key)) {
        const providedKey = c.key.replace(
          /(Source|Country|State|Locality|Label|Lat|Lng|Accuracy|City|CapturedAt|PlaceId)$/i,
          "Provided",
        );
        if (!locationProvided(data, providedKey) && (raw == null || raw === "")) {
          return `<td class="${band} loc-empty"></td>`;
        }
      }
      return `<td class="${band}">${esc(text)}</td>`;
    })
    .join("");
  return `<tr class="paint-row paint-${mode}" style="${style}">${cells}</tr>`;
}

function renderTable(columns, rowHtml, { compact = false } = {}) {
  const sheetClass = compact ? "data sheet-reps" : "data sheet-full";
  tableWrap.innerHTML = `
    <table class="${sheetClass}">
      <thead>${buildHeader(columns)}</thead>
      <tbody>${rowHtml || `<tr><td colspan="${columns.length}" class="muted">Sin datos</td></tr>`}</tbody>
    </table>`;
}

function meanOf(values) {
  if (!values.length) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

function medianOf(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function modeOf(values) {
  if (!values.length) return null;
  const freq = new Map();
  let best = values[0];
  let bestCount = 0;
  for (const v of values) {
    const next = (freq.get(v) || 0) + 1;
    freq.set(v, next);
    if (next > bestCount || (next === bestCount && v < best)) {
      best = v;
      bestCount = next;
    }
  }
  return best;
}

function fmtStat(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

function doctorActivityStats() {
  const researchers = workbook?.researchers || [];
  const perDoctor = [];
  let soloRegistrados = 0;
  let conIntervenciones = 0;
  for (const r of researchers) {
    const n = Number(r.counts?.completed ?? 0);
    const safe = Number.isFinite(n) ? n : 0;
    perDoctor.push(safe);
    if (safe === 0) soloRegistrados += 1;
    else conIntervenciones += 1;
  }
  const totalIntervenciones =
    workbook?.summary?.completed ??
    (workbook?.interventions || []).filter((i) => i.status === "completa").length;
  return {
    totalMedicos: researchers.length,
    soloRegistrados,
    conIntervenciones,
    totalIntervenciones: Number(totalIntervenciones) || 0,
    perDoctor,
    promedio: meanOf(perDoctor),
    mediana: medianOf(perDoctor),
    moda: modeOf(perDoctor),
  };
}

function doctorDemoStats() {
  const researchers = workbook?.researchers || [];
  const sex = { male: 0, female: 0, prefer_not: 0, unknown: 0 };
  const profile = { general: 0, specialty: 0, unknown: 0 };
  const specialtyCounts = new Map();

  for (const r of researchers) {
    const s = r.sex || r.flat?.sex;
    if (s === "male" || s === "female" || s === "prefer_not") sex[s] += 1;
    else sex.unknown += 1;

    const p = r.ophthalmologyProfile || r.flat?.ophthalmologyProfile;
    if (p === "general") profile.general += 1;
    else if (p === "specialty") {
      profile.specialty += 1;
      const slug = r.specialtySlug || r.flat?.specialtySlug || "other";
      const label =
        SPECIALTY_SHORT[slug] ||
        r.specialtyLabel ||
        r.flat?.specialtyLabel ||
        slug;
      const prev = specialtyCounts.get(slug) || { slug, label, count: 0 };
      prev.count += 1;
      specialtyCounts.set(slug, prev);
    } else profile.unknown += 1;
  }

  const specialties = [...specialtyCounts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"),
  );
  return { sex, profile, specialties };
}

function drawDonut(canvas, slices, centerMain, centerSub) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const cssSize = Math.min(200, canvas.clientWidth || 200);
  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = cssSize / 2;
  const cy = cssSize / 2;
  const radius = cssSize * 0.38;
  const total = slices.reduce((sum, s) => sum + (s.value || 0), 0);

  ctx.clearRect(0, 0, cssSize, cssSize);

  if (total <= 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 0.9rem Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Sin datos", cx, cy);
    return;
  }

  let angle = -Math.PI / 2;
  for (const slice of slices.filter((s) => s.value > 0)) {
    const sweep = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    angle += sweep;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = "#0f172a";
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 1.25rem Segoe UI, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(centerMain ?? total), cx, cy - (centerSub ? 8 : 0));
  if (centerSub) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 0.7rem Segoe UI, system-ui, sans-serif";
    ctx.fillText(centerSub, cx, cy + 14);
  }
}

function drawSpecialtyBars(canvas, specialties) {
  if (!canvas) return;
  const rows = specialties.length
    ? specialties
    : [{ label: "Sin especialidades", count: 0, slug: "_" }];
  const dpr = window.devicePixelRatio || 1;
  const rowH = 28;
  const padL = 108;
  const padR = 44;
  const padT = 8;
  const cssW = Math.max(320, canvas.clientWidth || 420);
  const cssH = padT * 2 + rows.length * rowH;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const max = Math.max(1, ...rows.map((r) => r.count));
  const barMax = cssW - padL - padR;

  rows.forEach((row, index) => {
    const y = padT + index * rowH + 4;
    const color = CHART_PALETTE[index % CHART_PALETTE.length];
    const w = (row.count / max) * barMax;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 0.72rem Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(row.label, padL - 8, y + 8);
    ctx.fillStyle = color;
    ctx.fillRect(padL, y, Math.max(row.count > 0 ? 4 : 0, w), 16);
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "left";
    ctx.fillText(String(row.count), padL + w + 6, y + 8);
  });
}

function legendHtml(items) {
  return `<ul class="mdash__legend">${items
    .map(
      (it) =>
        `<li><span class="mdash__swatch" style="background:${it.color}"></span> ${esc(it.label)} <strong>${it.value}</strong></li>`,
    )
    .join("")}</ul>`;
}

function renderMedicosDashboard() {
  if (!medicosDash) return;
  const stats = doctorActivityStats();
  const demo = doctorDemoStats();
  if (
    !specialtyFocusSlug ||
    !demo.specialties.some((s) => s.slug === specialtyFocusSlug)
  ) {
    specialtyFocusSlug = demo.specialties[0]?.slug || "";
  }
  const focus =
    demo.specialties.find((s) => s.slug === specialtyFocusSlug) || null;
  const focusOthers = demo.specialties
    .filter((s) => s.slug !== specialtyFocusSlug)
    .reduce((sum, s) => sum + s.count, 0);
  const focusTotal = (focus?.count || 0) + focusOthers;

  const sexSlices = [
    { label: "Hombres", value: demo.sex.male, color: "#38bdf8" },
    { label: "Mujeres", value: demo.sex.female, color: "#f472b6" },
    { label: "Prefiere no decir", value: demo.sex.prefer_not, color: "#a78bfa" },
    { label: "Sin dato", value: demo.sex.unknown, color: "#64748b" },
  ];
  const profileSlices = [
    { label: "Oftalmólogo general", value: demo.profile.general, color: "#4ade80" },
    { label: "Alta especialidad", value: demo.profile.specialty, color: "#fbbf24" },
    { label: "Sin dato", value: demo.profile.unknown, color: "#64748b" },
  ];
  const focusLegend = [
    {
      label: focus?.label || "Elegida",
      value: focus?.count || 0,
      color: "#38bdf8",
    },
    {
      label: "Otras especialidades",
      value: focusOthers,
      color: "#64748b",
    },
  ].filter((s) => s.value > 0 || s.label === (focus?.label || "Elegida"));
  const sexLegendHtml = legendHtml(sexSlices.filter((s) => s.value > 0));
  const profileLegendHtml = legendHtml(profileSlices.filter((s) => s.value > 0));
  const focusLegendHtml = legendHtml(focusLegend);

  medicosDash.hidden = false;
  medicosDash.innerHTML = `
    <div class="mdash">
      <div class="mdash__chart">
        <h3 class="mdash__title">Distribución de médicos</h3>
        <canvas id="medicosPie" class="mdash__canvas" width="260" height="260" aria-label="Gráfica de pastel de médicos"></canvas>
        <ul class="mdash__legend">
          <li><span class="mdash__swatch mdash__swatch--all"></span> Médicos registrados <strong>${stats.totalMedicos}</strong></li>
          <li><span class="mdash__swatch mdash__swatch--solo"></span> Solo registrados <strong>${stats.soloRegistrados}</strong></li>
          <li><span class="mdash__swatch mdash__swatch--con"></span> Con ≥ 1 intervención <strong>${stats.conIntervenciones}</strong></li>
        </ul>
      </div>
      <div class="mdash__kpis">
        <button type="button" class="mdash__btn mdash__btn--medicos" disabled>
          <span class="mdash__btn-label">Total de médicos</span>
          <span class="mdash__btn-value">${stats.totalMedicos}</span>
        </button>
        <button type="button" class="mdash__btn mdash__btn--interv" disabled>
          <span class="mdash__btn-label">Total de intervenciones</span>
          <span class="mdash__btn-value">${stats.totalIntervenciones}</span>
        </button>
        <div class="mdash__stats" aria-label="Estadísticas por médico">
          <p class="mdash__stats-title">Intervenciones por médico</p>
          <div class="mdash__stats-grid">
            <div>
              <span class="mdash__stat-label">Promedio</span>
              <span class="mdash__stat-value">${fmtStat(stats.promedio)}</span>
            </div>
            <div>
              <span class="mdash__stat-label">Mediana</span>
              <span class="mdash__stat-value">${fmtStat(stats.mediana)}</span>
            </div>
            <div>
              <span class="mdash__stat-label">Moda</span>
              <span class="mdash__stat-value">${fmtStat(stats.moda)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mdash-stack">
      <div class="mdash mdash--compact">
        <div class="mdash__chart">
          <h3 class="mdash__title">Sexo</h3>
          <canvas id="sexPie" class="mdash__canvas" width="200" height="200" aria-label="Hombres y mujeres"></canvas>
        </div>
        <div class="mdash__side">
          ${sexLegendHtml}
        </div>
      </div>
      <div class="mdash mdash--compact">
        <div class="mdash__chart">
          <h3 class="mdash__title">Perfil oftalmológico</h3>
          <canvas id="profilePie" class="mdash__canvas" width="200" height="200" aria-label="General contra especialistas"></canvas>
        </div>
        <div class="mdash__side">
          ${profileLegendHtml}
        </div>
      </div>
      <div class="mdash mdash--compact mdash--wide">
        <div class="mdash__chart mdash__chart--bars">
          <h3 class="mdash__title">Todas las subespecialidades</h3>
          <canvas id="specialtyBars" class="mdash__bars" width="420" height="200" aria-label="Barras de subespecialidades"></canvas>
        </div>
        <div class="mdash__side">
          <ul class="mdash__legend">
            ${demo.specialties
              .map(
                (s, i) =>
                  `<li><span class="mdash__swatch" style="background:${CHART_PALETTE[i % CHART_PALETTE.length]}"></span> ${esc(s.label)} <strong>${s.count}</strong></li>`,
              )
              .join("") || `<li class="muted">Aún no hay altas especialidades registradas</li>`}
          </ul>
        </div>
      </div>
      <div class="mdash mdash--compact">
        <div class="mdash__chart">
          <h3 class="mdash__title">Una subespecialidad</h3>
          <canvas id="specialtyFocusPie" class="mdash__canvas" width="200" height="200" aria-label="Subespecialidad enfocada"></canvas>
        </div>
        <div class="mdash__side">
          <label class="mdash__focus-label" for="specialtyFocus">
            Enfoque
            <select id="specialtyFocus" class="mdash__select">
              ${demo.specialties
                .map(
                  (s) =>
                    `<option value="${String(s.slug).replaceAll('"', "")}" ${s.slug === specialtyFocusSlug ? "selected" : ""}>${esc(s.label)} (${s.count})</option>`,
                )
                .join("") || `<option value="">Sin datos</option>`}
            </select>
          </label>
          ${focusLegendHtml}
        </div>
      </div>
    </div>`;

  drawDonut(
    document.getElementById("medicosPie"),
    [
      { value: stats.soloRegistrados, color: "#94a3b8" },
      { value: stats.conIntervenciones, color: "#38bdf8" },
    ],
    stats.totalMedicos,
    "registrados",
  );
  drawDonut(
    document.getElementById("sexPie"),
    sexSlices,
    sexSlices.reduce((a, s) => a + s.value, 0),
    "sexo",
  );
  drawDonut(
    document.getElementById("profilePie"),
    profileSlices,
    profileSlices.reduce((a, s) => a + s.value, 0),
    "perfil",
  );
  drawSpecialtyBars(document.getElementById("specialtyBars"), demo.specialties);
  drawDonut(
    document.getElementById("specialtyFocusPie"),
    [
      { value: focus?.count || 0, color: "#38bdf8" },
      { value: focusOthers, color: "#64748b" },
    ],
    focusTotal || 0,
    focus?.label || "—",
  );

  const focusSelect = document.getElementById("specialtyFocus");
  if (focusSelect) {
    focusSelect.addEventListener("change", () => {
      specialtyFocusSlug = focusSelect.value || "";
      renderMedicosDashboard();
    });
  }
}

function hideMedicosDashboard() {
  if (!medicosDash) return;
  medicosDash.hidden = true;
  medicosDash.innerHTML = "";
}

function renderMedicos() {
  renderMedicosDashboard();
  const rows = workbook?.researchers || [];
  const html = rows
    .map((r) =>
      buildRow(MEDICOS_COLUMNS, r.flat || r, {
        hue: hueForDoctor(r.id),
        lightness: 28,
        saturation: 48,
        mode: "medico",
      }),
    )
    .join("");
  renderTable(MEDICOS_COLUMNS, html);
}

function filteredInterventions() {
  const rows = workbook?.interventions || [];
  if (onlyComplete?.checked) return rows.filter((row) => row.status === "completa");
  return rows;
}

function renderIntervenciones() {
  hideMedicosDashboard();
  const rows = filteredInterventions();
  const html = rows
    .map((row, index) =>
      buildRow(INTERVENCION_COLUMNS, row.flat || row, {
        hue: hueForCase(row.id || row.sessionId, index),
        lightness: 27,
        saturation: 48,
        mode: "caso",
      }),
    )
    .join("");
  renderTable(INTERVENCION_COLUMNS, html);
}

function renderAgrupado() {
  hideMedicosDashboard();
  const only = onlyComplete?.checked;
  const groups = workbook?.grouped || [];
  const chunks = [];
  // Tonos del mismo color: más intenso → más claro
  const shades = [22, 28, 34, 40, 46, 52];

  for (const group of groups) {
    const r = group.researcher;
    const hue = hueForDoctor(r.id);
    let list = group.interventions || [];
    if (only) list = list.filter((row) => row.status === "completa");

    if (!list.length) {
      chunks.push(
        buildRow(MEDICOS_COLUMNS, r.flat || r, {
          hue,
          lightness: shades[0],
          saturation: 50,
          mode: "grupo",
        }),
      );
      continue;
    }

    list.forEach((row, index) => {
      chunks.push(
        buildRow(INTERVENCION_COLUMNS, row.flat || row, {
          hue,
          lightness: shades[Math.min(index, shades.length - 1)],
          saturation: 50 - Math.min(index, 4) * 3,
          mode: "grupo",
        }),
      );
    });
  }

  const hasAnyIntervention = groups.some((g) =>
    (g.interventions || []).some((i) => (only ? i.status === "completa" : true)),
  );
  renderTable(
    hasAnyIntervention ? INTERVENCION_COLUMNS : MEDICOS_COLUMNS,
    chunks.join(""),
  );
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

/** Completa counts.completed / soloRegistrado si el API aún no los manda. */
function enrichResearchers(data) {
  if (!data?.researchers) return data;
  const completedById = new Map();
  for (const item of data.interventions || []) {
    if (item.status !== "completa") continue;
    const id = item.researcherId;
    completedById.set(id, (completedById.get(id) || 0) + 1);
  }
  for (const r of data.researchers) {
    const total = Number(r.counts?.total ?? 0);
    const completed =
      r.counts?.completed != null
        ? Number(r.counts.completed)
        : completedById.get(r.id) || 0;
    r.counts = { ...(r.counts || {}), completed, total };
    r.soloRegistrado = r.soloRegistrado === true || total === 0;
    if (r.flat) {
      r.flat.counts = { ...(r.flat.counts || r.counts), completed, total };
      r.flat.soloRegistrado = r.soloRegistrado;
    }
  }
  return data;
}

async function fetchInvitations(pin, type = "all") {
  const apiType = type === "ranking" ? "all" : type;
  const url = `${API_BASE}/api/admin/invitations?type=${encodeURIComponent(apiType)}`;
  const response = await fetch(url, {
    headers: { "X-Admin-Pin": pin, Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 401) throw new Error("pin");
  if (!response.ok) throw new Error(`http_${response.status}`);
  return response.json();
}

function updateViewChrome() {
  const isReps = currentView === "representantes";
  if (inviteFilters) inviteFilters.hidden = !isReps;
  if (onlyCompleteWrap) onlyCompleteWrap.hidden = isReps;
  if (medicosDash && !isReps && currentView !== "medicos") {
    medicosDash.hidden = true;
  }
}

function topRepLabel(rep) {
  if (!rep) return "—";
  const name = rep.name || rep.fullName || "—";
  return `${name} (${rep.invited ?? 0})`;
}

function renderRepresentantesDashboard() {
  if (!medicosDash) return;
  const c = invitationsData?.counts || {};
  const accepted = Number(c.accepted) || 0;
  const declined = Number(c.declined) || 0;
  const invited = Number(c.invited) || accepted + declined;
  const reps = Number(c.representatives) || invitationsData?.representatives?.length || 0;

  medicosDash.hidden = false;
  medicosDash.innerHTML = `
    <div class="mdash">
      <div class="mdash__chart">
        <h3 class="mdash__title">Respuestas de médicos</h3>
        <canvas id="repsPie" class="mdash__canvas" width="260" height="260" aria-label="Aceptó contra no aceptó"></canvas>
        <ul class="mdash__legend">
          <li><span class="mdash__swatch" style="background:#4ade80"></span> Aceptó <strong>${accepted}</strong></li>
          <li><span class="mdash__swatch" style="background:#f87171"></span> No aceptó <strong>${declined}</strong></li>
          <li><span class="mdash__swatch" style="background:#38bdf8"></span> Médicos invitados <strong>${invited}</strong></li>
        </ul>
      </div>
      <div class="mdash__kpis">
        <button type="button" class="mdash__btn mdash__btn--medicos" disabled>
          <span class="mdash__btn-label">Representantes registrados</span>
          <span class="mdash__btn-value">${reps}</span>
        </button>
        <button type="button" class="mdash__btn mdash__btn--interv" disabled>
          <span class="mdash__btn-label">Médicos invitados</span>
          <span class="mdash__btn-value">${invited}</span>
        </button>
        <div class="mdash__stats" aria-label="Invitados por representante">
          <p class="mdash__stats-title">Invitados por representante</p>
          <div class="mdash__stats-grid">
            <div>
              <span class="mdash__stat-label">Promedio</span>
              <span class="mdash__stat-value">${fmtStat(c.avgInvitedPerRep)}</span>
            </div>
            <div>
              <span class="mdash__stat-label">Mediana</span>
              <span class="mdash__stat-value">${fmtStat(c.medianInvitedPerRep)}</span>
            </div>
            <div>
              <span class="mdash__stat-label">Moda</span>
              <span class="mdash__stat-value">${fmtStat(c.modeInvitedPerRep)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="reps-highlights">
      <div class="reps-hi">
        <span class="reps-hi__label">Más invitados</span>
        <strong>${esc(topRepLabel(c.topByInvited))}</strong>
      </div>
      <div class="reps-hi">
        <span class="reps-hi__label">Más aceptados</span>
        <strong>${esc(topRepLabel(c.topByAccepted))}</strong>
      </div>
      <div class="reps-hi">
        <span class="reps-hi__label">Más no aceptaron</span>
        <strong>${esc(topRepLabel(c.topByDeclined))}</strong>
      </div>
      <div class="reps-hi reps-hi--totals">
        <span class="reps-hi__label">Totales</span>
        <strong>Invitados ${invited} · Aceptó ${accepted} · No aceptó ${declined}</strong>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    drawDonut(
      document.getElementById("repsPie"),
      [
        { label: "Aceptó", value: accepted, color: "#4ade80" },
        { label: "No aceptó", value: declined, color: "#f87171" },
      ],
      invited,
      "invitados",
    );
  });
}

function sortedRankings() {
  const rows = [...(invitationsData?.rankings || [])];
  const { key, dir } = repRankSort;
  const mult = dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    if (key === "name") {
      return mult * String(a.name || "").localeCompare(String(b.name || ""), "es");
    }
    const av = Number(a[key]) || 0;
    const bv = Number(b[key]) || 0;
    if (av !== bv) return mult * (av - bv);
    return String(a.name || "").localeCompare(String(b.name || ""), "es");
  });
  return rows;
}

function sortMark(key) {
  if (repRankSort.key !== key) return "";
  return repRankSort.dir === "asc" ? " ↑" : " ↓";
}

function renderRepRankingTable() {
  const rows = sortedRankings();
  const head = `
    <tr>
      <th class="band-reps"><button type="button" class="th-sort" data-sort="name">Representante${sortMark("name")}</button></th>
      <th class="band-reps"><button type="button" class="th-sort" data-sort="invited">Invitados${sortMark("invited")}</button></th>
      <th class="band-reps"><button type="button" class="th-sort" data-sort="accepted">Aceptaron${sortMark("accepted")}</button></th>
      <th class="band-reps"><button type="button" class="th-sort" data-sort="declined">No aceptaron${sortMark("declined")}</button></th>
    </tr>`;
  const body = rows
    .map(
      (row, index) => `<tr class="row-tone-${index % 2}">
        <td title="${esc(row.email || "")}">${esc(row.name)}</td>
        <td>${row.invited}</td>
        <td>${row.accepted}</td>
        <td>${row.declined}</td>
      </tr>`,
    )
    .join("");
  tableWrap.innerHTML = `
    <table class="data sheet-reps sheet-reps--rank">
      <thead>${head}</thead>
      <tbody>${body || `<tr><td colspan="4">Sin representantes</td></tr>`}</tbody>
    </table>`;
  tableWrap.querySelectorAll(".th-sort").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.sort || "invited";
      if (repRankSort.key === key) {
        repRankSort.dir = repRankSort.dir === "desc" ? "asc" : "desc";
      } else {
        repRankSort = { key, dir: key === "name" ? "asc" : "desc" };
      }
      renderRepRankingTable();
    });
  });
}

function renderRepresentantes() {
  renderRepresentantesDashboard();
  if (inviteFilter === "ranking") {
    renderRepRankingTable();
    return;
  }
  const rows = invitationsData?.invitations || [];
  const body = rows
    .map((row, index) => {
      const cells = INVITACIONES_COLUMNS.map((c) => {
        const value = row[c.key];
        return `<td>${esc(value)}</td>`;
      }).join("");
      return `<tr class="row-tone-${index % 2}">${cells}</tr>`;
    })
    .join("");
  renderTable(
    INVITACIONES_COLUMNS,
    body || `<tr><td colspan="${INVITACIONES_COLUMNS.length}">Sin respuestas aún</td></tr>`,
    { compact: true },
  );
}

function renderSummary() {
  if (currentView === "representantes") {
    const c = invitationsData?.counts || {};
    summaryBar.innerHTML = `
      <span class="pill">Representantes: <strong>${c.representatives ?? 0}</strong></span>
      <span class="pill">Invitados: <strong>${c.invited ?? 0}</strong></span>
      <span class="pill">Aceptó: <strong>${c.accepted ?? 0}</strong></span>
      <span class="pill">No aceptó: <strong>${c.declined ?? 0}</strong></span>
    `;
    return;
  }
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

function render() {
  updateViewChrome();
  renderSummary();
  if (currentView === "representantes") renderRepresentantes();
  else if (currentView === "medicos") renderMedicos();
  else if (currentView === "intervenciones") renderIntervenciones();
  else renderAgrupado();
}

async function loadData() {
  statusLine.textContent = "Cargando registros…";
  try {
    if (currentView === "representantes") {
      invitationsData = await fetchInvitations(currentPin, inviteFilter);
      statusLine.textContent = `Actualizado ${fmtDate(invitationsData.generatedAt)} · invitaciones de representantes`;
    } else {
      workbook = enrichResearchers(await fetchWorkbook(currentPin));
      statusLine.textContent = `Actualizado ${fmtDate(workbook.generatedAt)} · una fila = todos los parámetros`;
    }
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
  let lineBuilder = (row) =>
    columns.map((c) => csvEscape(formatCell(getPath(row, c.key), c.key, row))).join(",");

  if (currentView === "representantes") {
    if (inviteFilter === "ranking") {
      columns = [
        { key: "name", label: "Representante" },
        { key: "invited", label: "Invitados" },
        { key: "accepted", label: "Aceptaron" },
        { key: "declined", label: "No aceptaron" },
      ];
      rows = sortedRankings();
      lineBuilder = (row) => columns.map((c) => csvEscape(row[c.key])).join(",");
    } else {
      columns = INVITACIONES_COLUMNS;
      rows = invitationsData?.invitations || [];
      lineBuilder = (row) =>
        columns.map((c) => csvEscape(row[c.key])).join(",");
    }
  } else if (currentView === "medicos") {
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
    ...rows.map((row) => lineBuilder(row)),
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
  invitationsData = null;
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

document.querySelectorAll(".filters:not(.invite-filters) .filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.view || "medicos";
    const changed = next !== currentView;
    currentView = next;
    document.querySelectorAll(".filters:not(.invite-filters) .filter-btn").forEach((el) => {
      el.classList.toggle("active", el === btn);
    });
    if (changed && (currentView === "representantes" || !workbook)) {
      void loadData();
    } else {
      render();
    }
  });
});

document.querySelectorAll(".invite-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    inviteFilter = btn.dataset.invite || "all";
    document.querySelectorAll(".invite-filter").forEach((el) => {
      el.classList.toggle("active", el === btn);
    });
    if (currentView === "representantes") void loadData();
  });
});

onlyComplete?.addEventListener("change", () => render());
refreshBtn.addEventListener("click", () => void loadData());
exportBtn.addEventListener("click", exportCsv);
logoutBtn.addEventListener("click", lockBoard);
document.getElementById("boardBackBtn")?.addEventListener("click", lockBoard);

if (sessionStorage.getItem(SESSION_KEY) === "1" && currentPin) {
  startBoard(currentPin);
}
