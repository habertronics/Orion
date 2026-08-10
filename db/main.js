import "./style.css";
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
  if (!value) return "—";
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

function filteredInterventions() {
  if (!workbook) return [];
  const rows = workbook.interventions || [];
  if (onlyComplete?.checked) {
    return rows.filter((row) => row.status === "completa");
  }
  return rows;
}

async function fetchWorkbook(pin) {
  const response = await fetch(`${API_BASE}/api/admin/workbook`, {
    headers: {
      "X-Admin-Pin": pin,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (response.status === 401) {
    throw new Error("pin");
  }
  if (!response.ok) {
    throw new Error(`http_${response.status}`);
  }
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

function labelYesNo(value) {
  if (value === "yes" || value === true) return "Sí";
  if (value === "no" || value === false) return "No";
  if (value == null || value === "") return "—";
  return String(value);
}

function labelSex(value) {
  const map = {
    female: "Mujer",
    male: "Hombre",
    other: "Otro",
    prefer_not: "Prefiere no decir",
  };
  return map[value] || (value == null ? "—" : String(value));
}

function labelTreatment(value) {
  const map = {
    ipl: "IPL",
    thermal: "Térmico",
    other: "Otro",
    none: "Ninguno",
  };
  return map[value] || (value == null ? "—" : String(value));
}

function cell(value) {
  return `<td>${esc(value == null || value === "" ? "—" : value)}</td>`;
}

function protocolCheck(done) {
  return done
    ? `<td class="check-cell"><span class="badge ok">✓ Sí</span></td>`
    : `<td class="check-cell"><span class="badge mute">No</span></td>`;
}

function blankCells(n) {
  return Array.from({ length: n }, () => `<td class="muted">—</td>`).join("");
}

function renderMedicos() {
  const rows = workbook?.researchers || [];
  const parpadeoCols = 18;
  const interferometriaCols = 4;

  const head = `
    <tr>
      <th rowspan="2">Alta</th>
      <th rowspan="2">Nombre</th>
      <th rowspan="2">Email</th>
      <th rowspan="2">Teléfono</th>
      <th rowspan="2">Edad</th>
      <th rowspan="2">Especialidad</th>
      <th rowspan="2">Ciudad</th>
      <th colspan="${parpadeoCols + 1}" class="proto-parpadeo">Protocolo Parpadeo</th>
      <th colspan="${interferometriaCols + 1}" class="proto-interf">Interferometría</th>
    </tr>
    <tr>
      <th>Hecho</th>
      <th>Estado</th>
      <th>Fecha</th>
      <th>Edad sujeto</th>
      <th>Sexo</th>
      <th>Dx ojo seco</th>
      <th>Trat. no lubricante</th>
      <th>Usa lubricante</th>
      <th>OSDI-6 hecho</th>
      <th>OSDI-6 total</th>
      <th>OSDI posible OS</th>
      <th>Localidad sesión</th>
      <th>Misma localidad</th>
      <th>BPM</th>
      <th>Parpadeos</th>
      <th>Incompletos</th>
      <th>CV %</th>
      <th>TBUT OD</th>
      <th>TBUT OS</th>
      <th>Hecho</th>
      <th>Estado</th>
      <th>Fecha</th>
      <th>Resultados</th>
      <th>Notas</th>
    </tr>`;

  const body = rows
    .map((r) => {
      const p = r.parpadeo;
      const i = r.interferometria;
      const parpadeoCells = p
        ? [
            protocolCheck(true),
            cell(p.status),
            cell(fmtDate(p.completedAt || p.createdAt)),
            cell(p.sujetoEdad),
            cell(labelSex(p.sujetoSexo)),
            cell(labelYesNo(p.ojoSecoDx)),
            cell(labelTreatment(p.tratamientoNoLubricante)),
            cell(labelYesNo(p.usaLubricante)),
            cell(labelYesNo(p.osdi6Hecho)),
            cell(p.osdi6Total),
            cell(labelYesNo(p.osdi6PosibleOjoSeco)),
            cell(p.localidadSesion),
            cell(labelYesNo(p.mismaLocalidad)),
            cell(p.bpm),
            cell(p.parpadeos),
            cell(p.incompletos),
            cell(p.arritmiaCv),
            cell(p.tbutOd),
            cell(p.tbutOs),
          ].join("")
        : protocolCheck(false) + blankCells(parpadeoCols);

      const interfCells = i
        ? [
            protocolCheck(true),
            cell(i.status),
            cell(fmtDate(i.completedAt || i.createdAt)),
            cell("Ver intervención (datos en JSON cuando el protocolo esté activo)"),
            cell("—"),
          ].join("")
        : protocolCheck(false) + blankCells(interferometriaCols);

      return `
    <tr>
      <td>${esc(fmtDate(r.registeredAt))}</td>
      <td>${esc(r.fullName)}</td>
      <td>${esc(r.email)}</td>
      <td>${esc(r.phone)}</td>
      <td>${esc(r.age)}</td>
      <td>${esc(r.specialtyLabel)}</td>
      <td>${esc(r.city)}</td>
      ${parpadeoCells}
      ${interfCells}
    </tr>`;
    })
    .join("");

  tableWrap.innerHTML = `<table class="data medicos-sheet"><thead>${head}</thead><tbody>${
    body || `<tr><td colspan="30" class="muted">Sin médicos aún</td></tr>`
  }</tbody></table>`;
}

function renderIntervenciones() {
  const rows = filteredInterventions();
  const head = `
    <tr>
      <th>Fecha sesión</th>
      <th>Protocolo</th>
      <th>Estado</th>
      <th>Médico</th>
      <th>Email</th>
      <th>Especialidad</th>
      <th>Sujeto edad</th>
      <th>Sexo</th>
      <th>Ojo seco</th>
      <th>Lubricante</th>
      <th>OSDI-6</th>
      <th>BPM</th>
      <th>Parpadeos</th>
      <th>Incompletos</th>
      <th>CV %</th>
      <th>TBUT OD</th>
      <th>TBUT OS</th>
      <th>Temp °C</th>
      <th>Humedad</th>
    </tr>`;
  const body = rows
    .map(
      (row) => `
    <tr>
      <td>${esc(fmtDate(row.createdAt))}</td>
      <td>${esc(row.protocol)}</td>
      <td><span class="badge ${row.status === "completa" ? "ok" : "warn"}">${esc(row.status)}</span></td>
      <td>${esc(row.researcherName)}</td>
      <td>${esc(row.researcherEmail)}</td>
      <td>${esc(row.researcherSpecialty)}</td>
      <td>${esc(row.sujetoEdad)}</td>
      <td>${esc(row.sujetoSexo)}</td>
      <td>${esc(row.ojoSecoDx)}</td>
      <td>${esc(row.usaLubricante)}</td>
      <td>${esc(row.osdi6Total)}</td>
      <td>${esc(row.bpm)}</td>
      <td>${esc(row.parpadeos)}</td>
      <td>${esc(row.incompletos)}</td>
      <td>${esc(row.arritmiaCv)}</td>
      <td>${esc(row.tbutOd)}</td>
      <td>${esc(row.tbutOs)}</td>
      <td>${esc(row.environmentTemp)}</td>
      <td>${esc(row.environmentHumidity)}</td>
    </tr>`,
    )
    .join("");
  tableWrap.innerHTML = `<table class="data"><thead>${head}</thead><tbody>${body || `<tr><td colspan="19" class="muted">Sin intervenciones</td></tr>`}</tbody></table>`;
}

function renderAgrupado() {
  const only = onlyComplete?.checked;
  const groups = (workbook?.grouped || [])
    .map((group) => ({
      researcher: group.researcher,
      interventions: (group.interventions || []).filter((row) =>
        only ? row.status === "completa" : true,
      ),
    }))
    .filter((group) => group.interventions.length > 0 || !only);

  const head = `
    <tr>
      <th>Bloque</th>
      <th>Médico / fecha</th>
      <th>Email / protocolo</th>
      <th>Tel / estado</th>
      <th>Especialidad</th>
      <th>Alta médico</th>
      <th>Sujeto edad</th>
      <th>Sexo</th>
      <th>Ojo seco</th>
      <th>Lubricante</th>
      <th>OSDI-6</th>
      <th>BPM</th>
      <th>Parpadeos</th>
      <th>Incompletos</th>
      <th>CV %</th>
      <th>TBUT OD</th>
      <th>TBUT OS</th>
      <th>Temp</th>
      <th>Humedad</th>
    </tr>`;

  const chunks = [];
  for (const group of groups) {
    const r = group.researcher;
    const list = group.interventions;
    if (!list.length) {
      chunks.push(`
        <tr class="group-head">
          <td>Médico</td>
          <td>${esc(r.fullName)}</td>
          <td>${esc(r.email)}</td>
          <td>${esc(r.phone)}</td>
          <td>${esc(r.specialtyLabel)}</td>
          <td>${esc(fmtDate(r.registeredAt))}</td>
          <td colspan="13" class="muted">Sin intervenciones${only ? " completas" : ""}</td>
        </tr>`);
      continue;
    }
    const first = list[0];
    chunks.push(`
      <tr class="group-head">
        <td>Médico + 1ª</td>
        <td>${esc(r.fullName)} · ${esc(fmtDate(first.createdAt))}</td>
        <td>${esc(r.email)} · ${esc(first.protocol)}</td>
        <td>${esc(r.phone)} · ${esc(first.status)}</td>
        <td>${esc(r.specialtyLabel)}</td>
        <td>${esc(fmtDate(r.registeredAt))}</td>
        <td>${esc(first.sujetoEdad)}</td>
        <td>${esc(first.sujetoSexo)}</td>
        <td>${esc(first.ojoSecoDx)}</td>
        <td>${esc(first.usaLubricante)}</td>
        <td>${esc(first.osdi6Total)}</td>
        <td>${esc(first.bpm)}</td>
        <td>${esc(first.parpadeos)}</td>
        <td>${esc(first.incompletos)}</td>
        <td>${esc(first.arritmiaCv)}</td>
        <td>${esc(first.tbutOd)}</td>
        <td>${esc(first.tbutOs)}</td>
        <td>${esc(first.environmentTemp)}</td>
        <td>${esc(first.environmentHumidity)}</td>
      </tr>`);
    for (const row of list.slice(1)) {
      chunks.push(`
        <tr>
          <td class="muted">+ intervención</td>
          <td>${esc(fmtDate(row.createdAt))}</td>
          <td>${esc(row.protocol)}</td>
          <td><span class="badge ${row.status === "completa" ? "ok" : "warn"}">${esc(row.status)}</span></td>
          <td class="muted">—</td>
          <td class="muted">—</td>
          <td>${esc(row.sujetoEdad)}</td>
          <td>${esc(row.sujetoSexo)}</td>
          <td>${esc(row.ojoSecoDx)}</td>
          <td>${esc(row.usaLubricante)}</td>
          <td>${esc(row.osdi6Total)}</td>
          <td>${esc(row.bpm)}</td>
          <td>${esc(row.parpadeos)}</td>
          <td>${esc(row.incompletos)}</td>
          <td>${esc(row.arritmiaCv)}</td>
          <td>${esc(row.tbutOd)}</td>
          <td>${esc(row.tbutOs)}</td>
          <td>${esc(row.environmentTemp)}</td>
          <td>${esc(row.environmentHumidity)}</td>
        </tr>`);
    }
  }

  tableWrap.innerHTML = `<table class="data"><thead>${head}</thead><tbody>${
    chunks.join("") || `<tr><td colspan="19" class="muted">Sin datos</td></tr>`
  }</tbody></table>`;
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
    statusLine.textContent = `Actualizado ${fmtDate(workbook.generatedAt)}`;
    render();
  } catch (err) {
    if (err.message === "pin") {
      lockBoard();
      gateError.hidden = false;
      statusLine.textContent = "PIN incorrecto o sesión cerrada";
      return;
    }
    statusLine.textContent =
      "No se pudo cargar (¿API despertando en Render?). Reintenta en unos segundos.";
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function exportCsv() {
  let rows = [];
  if (currentView === "medicos") {
    rows = (workbook?.researchers || []).map((r) => {
      const p = r.parpadeo || {};
      const i = r.interferometria || {};
      return {
        alta: fmtDate(r.registeredAt),
        nombre: r.fullName,
        email: r.email,
        telefono: r.phone,
        edad: r.age,
        especialidad: r.specialtyLabel,
        ciudad: r.city,
        parpadeoHecho: p.done ? "Sí" : "No",
        parpadeoEstado: p.status || "",
        parpadeoFecha: fmtDate(p.completedAt || p.createdAt),
        sujetoEdad: p.sujetoEdad ?? "",
        sexo: labelSex(p.sujetoSexo),
        ojoSeco: labelYesNo(p.ojoSecoDx),
        tratamiento: labelTreatment(p.tratamientoNoLubricante),
        lubricante: labelYesNo(p.usaLubricante),
        osdi6Hecho: labelYesNo(p.osdi6Hecho),
        osdi6Total: p.osdi6Total ?? "",
        osdiPosible: labelYesNo(p.osdi6PosibleOjoSeco),
        localidadSesion: p.localidadSesion ?? "",
        mismaLocalidad: labelYesNo(p.mismaLocalidad),
        bpm: p.bpm ?? "",
        parpadeos: p.parpadeos ?? "",
        incompletos: p.incompletos ?? "",
        cv: p.arritmiaCv ?? "",
        tbutOd: p.tbutOd ?? "",
        tbutOs: p.tbutOs ?? "",
        interferometriaHecho: i.done ? "Sí" : "No",
        interferometriaEstado: i.status || "",
        interferometriaFecha: fmtDate(i.completedAt || i.createdAt),
      };
    });
  } else {
    rows = filteredInterventions().map((row) => ({
      fecha: fmtDate(row.createdAt),
      protocolo: row.protocol,
      estado: row.status,
      medico: row.researcherName,
      email: row.researcherEmail,
      especialidad: row.researcherSpecialty,
      sujetoEdad: row.sujetoEdad,
      sexo: row.sujetoSexo,
      ojoSeco: row.ojoSecoDx,
      lubricante: row.usaLubricante,
      osdi6: row.osdi6Total,
      bpm: row.bpm,
      parpadeos: row.parpadeos,
      incompletos: row.incompletos,
      cv: row.arritmiaCv,
      tbutOd: row.tbutOd,
      tbutOs: row.tbutOs,
      temp: row.environmentTemp,
      humedad: row.environmentHumidity,
    }));
  }
  if (!rows.length) {
    statusLine.textContent = "Nada que exportar en esta vista";
    return;
  }
  const keys = Object.keys(rows[0]);
  const lines = [
    keys.join(","),
    ...rows.map((row) => keys.map((k) => csvEscape(row[k])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orion-db-${currentView}-${Date.now()}.csv`;
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
