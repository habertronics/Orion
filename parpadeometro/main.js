import "./style.css";
import { FilesetResolver, FaceLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { createTetris } from "./tetris.js";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const chartCanvas = document.getElementById("chart");
const chartCtx = chartCanvas.getContext("2d");
const statusEl = document.getElementById("status");
const placeholder = document.getElementById("placeholder");
const viewport = document.getElementById("viewport");
const cameraSelect = document.getElementById("cameraSelect");
const startCamBtn = document.getElementById("startCamBtn");
const stopCamBtn = document.getElementById("stopCamBtn");
const calibrateBtn = document.getElementById("calibrateBtn");
const inicioBtn = document.getElementById("inicioBtn");
const durationModal = document.getElementById("durationModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const statsBar = document.getElementById("statsBar");
const blinkCountEl = document.getElementById("blinkCount");
const timeLeftEl = document.getElementById("timeLeft");
const apertureValueEl = document.getElementById("apertureValue");
const chartHint = document.getElementById("chartHint");
const lecturaBtn = document.getElementById("lecturaBtn");
const exitLecturaBtn = document.getElementById("exitLecturaBtn");
const readerPanel = document.getElementById("readerPanel");
const pipBadge = document.getElementById("pipBadge");
const senseChip = document.getElementById("senseChip");
const senseChipText = document.getElementById("senseChipText");
const bgNote = document.getElementById("bgNote");
const inicioMain = document.getElementById("inicioMain");
const inicioSub = document.getElementById("inicioSub");
const resultBanner = document.getElementById("resultBanner");
const resultTitle = document.getElementById("resultTitle");
const resultDetail = document.getElementById("resultDetail");
const metricsPanel = document.getElementById("metricsPanel");
const metricsInfoBtn = document.getElementById("metricsInfoBtn");
const metricsInfoPanel = document.getElementById("metricsInfoPanel");
const metricBpm = document.getElementById("metricBpm");
const metricMean = document.getElementById("metricMean");
const metricMedian = document.getElementById("metricMedian");
const metricMode = document.getElementById("metricMode");
const metricCv = document.getElementById("metricCv");
const metricIncomplete = document.getElementById("metricIncomplete");
const sparklineCanvas = document.getElementById("sparkline");
const sparklineCtx = sparklineCanvas?.getContext("2d");
const APP_VERSION = "v2.4";
const SENSE_POS_KEY = "habertronic-sense-chip-pos";
const wikiTopicGrid = document.getElementById("wikiTopicGrid");
const wikiForm = document.getElementById("wikiForm");
const wikiUrlInput = document.getElementById("wikiUrlInput");
const wikiTitle = document.getElementById("wikiTitle");
const wikiBody = document.getElementById("wikiBody");
const wikiOpenLink = document.getElementById("wikiOpenLink");
const videoPresetGrid = document.getElementById("videoPresetGrid");
const videoForm = document.getElementById("videoForm");
const videoUrlInput = document.getElementById("videoUrlInput");
const videoFrame = document.getElementById("videoFrame");
const localVideo = document.getElementById("localVideo");
const videoFileInput = document.getElementById("videoFileInput");
const videoFallback = document.getElementById("videoFallback");

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** Lab 11 — umbrales dinámicos (apertura ≈ EAR: mayor = más abierto). */
const BASELINE_WINDOW = 20;
const BASELINE_MIN_SAMPLES = 11;
const BASELINE_PERCENTILE = 75;
const DYNAMIC_RED_GAMMA = 0.25;
const MIN_GAP_BASELINE_TO_RED = 0.052;
const WARMUP_GAP_SAMPLES = 48;
const WARMUP_GAP_EXTRA_MAX = 0.028;
const DEFAULT_APERTURE_THRESHOLD = 0.55;
const HYSTERESIS_OPEN = 0.04;

const WIKI_TOPICS = [
  { label: "Astronomía", title: "Astronomía" },
  { label: "Matemáticas", title: "Matemáticas" },
  { label: "Física", title: "Física" },
  { label: "Sistema solar", title: "Sistema solar" },
  { label: "Recetas", title: "Gastronomía" },
  { label: "Ejercicio", title: "Ejercicio físico" },
  { label: "Biología", title: "Biología" },
  { label: "Historia", title: "Historia" },
  { label: "Música", title: "Música" },
  { label: "Café", title: "Café" },
];

// Videos públicos cortos / educativos (duración aproximada).
const PRESET_VIDEOS = [
  { id: "0fKBhvDjuy0", title: "Escala del universo", topic: "Astronomía", mins: 9 },
  { id: "libKVRa01L8", title: "Viaje por el sistema solar", topic: "NASA", mins: 7 },
  { id: "WuyPuH9ojCE", title: "Cómo el estrés afecta el cerebro", topic: "Ciencia", mins: 5 },
  { id: "FQYdkEyO_zQ", title: "¿Qué es la luz?", topic: "Física", mins: 5 },
  { id: "aqz-KE-bpKQ", title: "Big Buck Bunny", topic: "Animación", mins: 10 },
  { id: "eRsGyueVLvQ", title: "Sintel (corto)", topic: "Animación", mins: 15 },
];

let faceLandmarker = null;
let visionFileset = null;
let stream = null;
let rafId = 0;
let lastDetectTs = 0;
let lastTimestampMs = 0;
let running = false;
let drawingUtils = new DrawingUtils(ctx);
let latestLandmarks = [];
let selectedDeviceId = "";
let mirrorPreview = true;
let switchingCamera = false;
let readingMode = false;
let wakeLock = null;
let hiddenWarningShown = false;
let localVideoUrl = null;
let tetrisGame = null;
let armedSeconds = 0;
let testTimerId = 0;

let testActive = false;
let testEndsAt = 0;
let testDurationMs = 0;
let blinkCount = 0;
let incompleteBlinkCount = 0;
let eyesClosed = false;
let inIntermediateZone = false;
let apertureHistory = [];
let liveApertureHistory = [];
let recentApertureWindow = [];
let blinkTimestamps = [];
let apertureThreshold = DEFAULT_APERTURE_THRESHOLD;
let thrRedDyn = DEFAULT_APERTURE_THRESHOLD;
let thrYellowDyn = DEFAULT_APERTURE_THRESHOLD + 0.08;
let calibrating = false;
let calibrationCollecting = false;
let calibrationValues = [];
let calibrationTimerId = 0;
let audioCtx = null;
let lastMetrics = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function playBeep(frequency = 880, durationMs = 160, when = 0, volume = 0.2) {
  const ctxAudio = ensureAudio();
  const osc = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctxAudio.destination);
  const t0 = ctxAudio.currentTime + when;
  const peak = Math.max(0.001, volume);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.02);
}

function playStartBeep() {
  playBeep(920, 180, 0, 0.22);
}

function playEndBeeps() {
  // 5 vips de tonos distintos para notarlo aunque estés en Tetris.
  const tones = [523, 587, 659, 784, 880];
  tones.forEach((freq, index) => {
    playBeep(freq, 140, index * 0.18, 0.24);
  });
}

function formatDurationLabel(seconds) {
  if (seconds < 60) return `${seconds} segundos`;
  if (seconds === 60) return "1 minuto";
  return `${seconds / 60} minutos`;
}

function resetInicioButton() {
  armedSeconds = 0;
  inicioBtn.classList.remove("armed", "running");
  inicioMain.textContent = "Inicio";
  inicioSub.hidden = true;
  inicioSub.textContent = "";
  inicioBtn.disabled = !running || testActive;
}

function armTest(seconds) {
  armedSeconds = seconds;
  inicioBtn.classList.remove("running");
  inicioBtn.classList.add("armed");
  inicioMain.textContent = "Inicio";
  inicioSub.hidden = false;
  inicioSub.textContent = formatDurationLabel(seconds);
  inicioBtn.disabled = false;
  setStatus(`Listo: ${formatDurationLabel(seconds)}. Ve a Actividad y luego pulsa Inicio (amarillo)`);
}

function onInicioClick() {
  if (!running || testActive || calibrating) return;
  ensureAudio();
  if (armedSeconds > 0) {
    startTest(armedSeconds);
    return;
  }
  openDurationModal();
}

async function requestWakeLock() {
  try {
    if (!("wakeLock" in navigator)) return;
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch (err) {
    console.warn("Wake Lock no disponible:", err);
  }
}

async function releaseWakeLock() {
  try {
    await wakeLock?.release?.();
  } catch {
    // ignore
  }
  wakeLock = null;
}

function updateSenseChipLabel() {
  if (!senseChipText) return;
  if (testActive) {
    senseChipText.textContent = `Sensando · ${blinkCount}`;
  } else {
    senseChipText.textContent = "Sensando";
  }
}

function restoreSenseChipPosition() {
  try {
    const raw = localStorage.getItem(SENSE_POS_KEY);
    if (!raw) return;
    const pos = JSON.parse(raw);
    if (typeof pos?.left === "number" && typeof pos?.top === "number") {
      senseChip.style.left = `${pos.left}px`;
      senseChip.style.top = `${pos.top}px`;
      senseChip.style.right = "auto";
      senseChip.style.bottom = "auto";
    }
  } catch {
    // ignore
  }
}

function saveSenseChipPosition() {
  const rect = senseChip.getBoundingClientRect();
  localStorage.setItem(
    SENSE_POS_KEY,
    JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top) }),
  );
}

function setupSenseChipDrag() {
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;

  const onDown = (event) => {
    if (senseChip.hidden) return;
    const point = event.touches?.[0] || event;
    dragging = true;
    moved = false;
    startX = point.clientX;
    startY = point.clientY;
    const rect = senseChip.getBoundingClientRect();
    originLeft = rect.left;
    originTop = rect.top;
    senseChip.style.left = `${originLeft}px`;
    senseChip.style.top = `${originTop}px`;
    senseChip.style.right = "auto";
    senseChip.style.bottom = "auto";
    event.preventDefault();
  };

  const onMove = (event) => {
    if (!dragging) return;
    const point = event.touches?.[0] || event;
    const dx = point.clientX - startX;
    const dy = point.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
    const maxLeft = window.innerWidth - senseChip.offsetWidth - 8;
    const maxTop = window.innerHeight - senseChip.offsetHeight - 8;
    const nextLeft = Math.min(maxLeft, Math.max(8, originLeft + dx));
    const nextTop = Math.min(maxTop, Math.max(8, originTop + dy));
    senseChip.style.left = `${nextLeft}px`;
    senseChip.style.top = `${nextTop}px`;
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    if (moved) {
      saveSenseChipPosition();
    } else {
      // Tap: mini vista opcional de la malla (~1/4).
      viewport.classList.toggle("show-mini");
    }
  };

  senseChip.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

function setReadingMode(enabled) {
  readingMode = enabled;
  document.body.classList.toggle("reading-mode", enabled);
  readerPanel.hidden = !enabled;
  pipBadge.hidden = true;
  senseChip.hidden = !enabled;
  viewport.classList.remove("show-mini");
  lecturaBtn.textContent = enabled ? "Salir actividad" : "Actividad";
  if (enabled) {
    bgNote.hidden = true;
    restoreSenseChipPosition();
    updateSenseChipLabel();
    setStatus(testActive ? "Prueba + actividad" : "Actividad activa · el sensor sigue midiendo");
    void requestWakeLock();
  } else {
    localVideo.pause?.();
    tetrisGame?.pauseForTabHide?.();
    if (!testActive) {
      void releaseWakeLock();
      if (running) setStatus("Cámara activa");
    }
  }
  drawChart();
}

function switchActivityTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tabName;
  });
  if (tabName !== "tetris" && tetrisGame?.isRunning?.()) {
    tetrisGame.pauseForTabHide();
  }
}

function normalizeUrl(raw) {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function showFallback(el, message) {
  el.hidden = false;
  el.textContent = message;
}

function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : "";
    }
    if (host.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/live/")) {
        const shortId = u.pathname.split("/").filter(Boolean)[1];
        return shortId ? `https://www.youtube.com/embed/${shortId}?rel=0` : "";
      }
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : "";
    }
  } catch {
    return "";
  }
  return "";
}

function toTikTokEmbed(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("tiktok.com")) return "";
    const parts = u.pathname.split("/").filter(Boolean);
    const videoIdx = parts.indexOf("video");
    const id = videoIdx >= 0 ? parts[videoIdx + 1] : "";
    if (!id) return "";
    return `https://www.tiktok.com/embed/v2/${id}`;
  } catch {
    return "";
  }
}

function wikiTitleFromInput(raw) {
  const value = raw.trim();
  if (!value) return "";
  if (/wikipedia\.org/i.test(value)) {
    try {
      const u = new URL(normalizeUrl(value));
      const marker = "/wiki/";
      const idx = u.pathname.indexOf(marker);
      if (idx >= 0) {
        return decodeURIComponent(u.pathname.slice(idx + marker.length)).replace(/_/g, " ");
      }
    } catch {
      return value;
    }
  }
  return value.replace(/_/g, " ");
}

async function loadWikipediaArticle(rawTitle, { fromChip = false } = {}) {
  const title = wikiTitleFromInput(rawTitle);
  if (!title) return;

  wikiBody.classList.add("loading");
  wikiBody.textContent = "Cargando artículo de Wikipedia…";
  wikiTitle.textContent = title;
  wikiOpenLink.hidden = true;

  try {
    const api =
      "https://es.wikipedia.org/w/api.php?action=query&format=json&origin=*" +
      "&prop=extracts&explaintext=1&redirects=1&titles=" +
      encodeURIComponent(title);
    const res = await fetch(api);
    if (!res.ok) throw new Error("No se pudo consultar Wikipedia");
    const data = await res.json();
    const page = Object.values(data?.query?.pages || {})[0];
    if (!page || page.missing != null) {
      throw new Error("No encontré ese artículo. Prueba otro título o enlace.");
    }

    wikiTitle.textContent = page.title;
    wikiBody.classList.remove("loading");
    wikiBody.textContent = page.extract || "Este artículo no tiene texto disponible.";
    wikiOpenLink.href = `https://es.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
    wikiOpenLink.hidden = false;
    wikiUrlInput.value = wikiOpenLink.href;

    if (!fromChip) {
      document.querySelectorAll(".topic-chip").forEach((chip) => chip.classList.remove("active"));
    }
  } catch (err) {
    wikiBody.classList.remove("loading");
    wikiBody.textContent = err?.message || "Error al cargar Wikipedia.";
    wikiOpenLink.hidden = true;
  }
}

function clearLocalVideo() {
  if (localVideoUrl) {
    URL.revokeObjectURL(localVideoUrl);
    localVideoUrl = null;
  }
  localVideo.removeAttribute("src");
  localVideo.load();
  localVideo.hidden = true;
}

function playPresetVideo(videoId) {
  videoFallback.hidden = true;
  clearLocalVideo();
  document.querySelectorAll(".video-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.videoId === videoId);
  });
  videoFrame.hidden = false;
  videoFrame.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
  videoUrlInput.value = `https://www.youtube.com/watch?v=${videoId}`;
}

function loadVideoUrl(raw) {
  const url = normalizeUrl(raw);
  videoFallback.hidden = true;
  clearLocalVideo();
  videoFrame.hidden = true;
  document.querySelectorAll(".video-card").forEach((card) => card.classList.remove("active"));
  if (!url) return;
  videoUrlInput.value = url;

  const yt = toYouTubeEmbed(url);
  if (yt) {
    videoFrame.hidden = false;
    videoFrame.src = yt;
    return;
  }

  const tt = toTikTokEmbed(url);
  if (tt) {
    videoFrame.hidden = false;
    videoFrame.src = tt;
    showFallback(
      videoFallback,
      "Intentando TikTok embebido. Si ves pantalla en blanco, sube un MP4 o usa YouTube/Shorts.",
    );
    return;
  }

  videoFrame.removeAttribute("src");
  showFallback(
    videoFallback,
    "No reconocí ese enlace. Prueba YouTube/Shorts, un TikTok de video, o sube un archivo MP4.",
  );
}

function buildActivityPickers() {
  wikiTopicGrid.innerHTML = "";
  WIKI_TOPICS.forEach((topic) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "topic-chip";
    btn.textContent = topic.label;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".topic-chip").forEach((chip) => chip.classList.remove("active"));
      btn.classList.add("active");
      void loadWikipediaArticle(topic.title, { fromChip: true });
    });
    wikiTopicGrid.appendChild(btn);
  });

  videoPresetGrid.innerHTML = "";
  PRESET_VIDEOS.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "video-card";
    btn.dataset.videoId = item.id;
    btn.innerHTML = `<span class="v-title">${item.title}</span><span class="v-meta">${item.topic} · ~${item.mins} min</span>`;
    btn.addEventListener("click", () => playPresetVideo(item.id));
    videoPresetGrid.appendChild(btn);
  });
}

function friendlyCameraLabel(device, index) {
  const raw = (device.label || "").trim();
  const lower = raw.toLowerCase();
  if (/front|user|facing front|frontal|delantera/i.test(lower)) return raw || "Cámara frontal";
  if (/back|rear|environment|facing back|trasera|posterior/i.test(lower)) return raw || "Cámara trasera";
  if (raw) return raw;
  return `Cámara ${index + 1}`;
}

function updateMirrorFromTrack(track) {
  const facing = track?.getSettings?.()?.facingMode;
  mirrorPreview = facing !== "environment";
}

async function refreshCameraList(preferredId = "") {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter((d) => d.kind === "videoinput");
  const previous = preferredId || cameraSelect.value || selectedDeviceId;
  cameraSelect.innerHTML = "";

  if (!cameras.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No se encontraron cámaras";
    cameraSelect.appendChild(opt);
    cameraSelect.disabled = true;
    selectedDeviceId = "";
    return;
  }

  cameras.forEach((device, index) => {
    const opt = document.createElement("option");
    opt.value = device.deviceId;
    opt.textContent = friendlyCameraLabel(device, index);
    cameraSelect.appendChild(opt);
  });

  const match = cameras.find((c) => c.deviceId === previous);
  selectedDeviceId = match?.deviceId || cameras[0].deviceId;
  cameraSelect.value = selectedDeviceId;
  cameraSelect.disabled = false;
}

function buildVideoConstraints(deviceId) {
  const base = {
    width: { ideal: isMobile ? 640 : 1280 },
    height: { ideal: isMobile ? 480 : 720 },
    frameRate: { ideal: 30, max: 30 },
  };
  if (deviceId) return { ...base, deviceId: { exact: deviceId } };
  return { ...base, facingMode: { ideal: "user" } };
}

function stopStreamTracks() {
  if (!stream) return;
  for (const track of stream.getTracks()) track.stop();
  stream = null;
}

function resizeCanvas() {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    drawingUtils = new DrawingUtils(ctx);
  }
  viewport.style.aspectRatio = `${w} / ${h}`;
}

function resizeChartCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const cssW = chartCanvas.clientWidth || 900;
  const cssH = chartCanvas.clientHeight || 140;
  chartCanvas.width = Math.floor(cssW * ratio);
  chartCanvas.height = Math.floor(cssH * ratio);
  chartCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return 0.3;
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1),
  );
  return sortedAsc[idx];
}

function computeBaseline(windowValues) {
  if (windowValues.length < BASELINE_MIN_SAMPLES) return 0.3;
  const sorted = [...windowValues].sort((a, b) => a - b);
  return percentile(sorted, BASELINE_PERCENTILE);
}

function computeDynamicThresholds(windowValues, sliderThreshold) {
  const baseline = computeBaseline(windowValues);
  const n = windowValues.length;
  const extra =
    n < WARMUP_GAP_SAMPLES
      ? ((WARMUP_GAP_SAMPLES - n) / WARMUP_GAP_SAMPLES) * WARMUP_GAP_EXTRA_MAX
      : 0;
  const gap = MIN_GAP_BASELINE_TO_RED + extra;
  const raw =
    sliderThreshold + DYNAMIC_RED_GAMMA * Math.max(0, baseline - sliderThreshold);
  const cap = baseline - gap;
  const thrRed = Math.max(0.1, Math.min(raw, cap));
  const thrYellow = (baseline + thrRed) / 2;
  return { baseline, thrRed, thrYellow };
}

function drawSeries(ctx, canvasEl, series, opts = {}) {
  if (!ctx || !canvasEl) return;
  const ratio = window.devicePixelRatio || 1;
  const w = canvasEl.clientWidth || canvasEl.width || 900;
  const h = canvasEl.clientHeight || canvasEl.height || 28;
  canvasEl.width = Math.floor(w * ratio);
  canvasEl.height = Math.floor(h * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const pad = opts.pad ?? 3;
  if (opts.grid) {
    ctx.strokeStyle = "rgba(14, 116, 144, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i += 1) {
      const y = (h * i) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  if (opts.showThresholds && Number.isFinite(opts.thrYellow)) {
    const yY = h - pad - opts.thrYellow * (h - pad * 2);
    ctx.strokeStyle = "rgba(234, 179, 8, 0.85)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, yY);
    ctx.lineTo(w, yY);
    ctx.stroke();
  }
  if (opts.showThresholds && Number.isFinite(opts.thrRed)) {
    const yR = h - pad - opts.thrRed * (h - pad * 2);
    ctx.strokeStyle = "rgba(220, 38, 38, 0.85)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, yR);
    ctx.lineTo(w, yR);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.setLineDash([]);
  }

  if (series.length < 2) return;
  const maxPoints = Math.max(series.length, 2);
  ctx.beginPath();
  series.forEach((value, index) => {
    const x = (index / (maxPoints - 1)) * (w - pad * 2) + pad;
    const y = h - pad - value * (h - pad * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = opts.color || "#0891b2";
  ctx.lineWidth = opts.lineWidth || 2;
  ctx.lineJoin = "round";
  ctx.stroke();

  if (opts.dot) {
    const last = series[series.length - 1];
    const lx = w - pad;
    const ly = h - pad - last * (h - pad * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(lx, ly, opts.compact ? 2.2 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function sparklineDisplaySeries(series) {
  if (series.length < 2) return series.map(() => 0.5);
  let min = Infinity;
  let max = -Infinity;
  for (const v of series) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  // Amplifica el rango local para que se note el sensado dentro del renglón.
  const span = Math.max(0.02, max - min);
  return series.map((v) => {
    const t = (v - min) / span;
    return 0.1 + t * 0.8;
  });
}

function drawSparkline() {
  if (!sparklineCanvas || !sparklineCtx) return;
  drawSeries(sparklineCtx, sparklineCanvas, sparklineDisplaySeries(liveApertureHistory), {
    color: "#0e7490",
    lineWidth: 1.8,
    pad: 2,
    showThresholds: false,
    compact: true,
    dot: true,
  });
}

function drawChart() {
  drawSeries(chartCtx, chartCanvas, apertureHistory, {
    color: "#0891b2",
    lineWidth: 2.5,
    pad: 8,
    grid: true,
    thrRed: thrRedDyn,
    thrYellow: thrYellowDyn,
    showThresholds: true,
    dot: true,
  });
}

function blendshapeScore(blendshapes, name) {
  const cats = blendshapes?.categories;
  if (!cats) return 0;
  const hit = cats.find((c) => c.categoryName === name);
  return hit?.score ?? 0;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function modeValue(values) {
  if (!values.length) return null;
  const freq = new Map();
  for (const v of values) {
    const key = Math.round(v * 100) / 100;
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  let best = null;
  let bestCount = 0;
  for (const [key, count] of freq) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function calculateStatistics() {
  const durationSec = Math.max(0.001, testDurationMs / 1000);
  const bpm = Math.round((blinkCount * 60) / durationSec);
  const intervals = [];
  for (let i = 1; i < blinkTimestamps.length; i += 1) {
    const sec = (blinkTimestamps[i] - blinkTimestamps[i - 1]) / 1000;
    if (sec >= 0.1 && sec <= 10) intervals.push(sec);
  }

  let mean = null;
  let med = null;
  let mode = null;
  let cvPct = null;
  if (intervals.length) {
    mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    med = median(intervals);
    mode = modeValue(intervals);
    if (intervals.length >= 2 && mean > 0) {
      const variance =
        intervals.reduce((acc, v) => acc + (v - mean) ** 2, 0) /
        (intervals.length - 1);
      cvPct = (Math.sqrt(variance) / mean) * 100;
    }
  }

  return {
    blinkCount,
    incompleteBlinkCount,
    durationMs: testDurationMs,
    bpm,
    meanIntervalSec: mean,
    medianIntervalSec: med,
    modeIntervalSec: mode,
    arrhythmiaCvPct: cvPct,
  };
}

function formatSec(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)} s`;
}

function renderMetrics(metrics) {
  if (!metricsPanel) return;
  metricsPanel.hidden = false;
  if (metricsInfoBtn) metricsInfoBtn.hidden = false;
  metricBpm.textContent = String(metrics.bpm);
  metricMean.textContent = formatSec(metrics.meanIntervalSec);
  metricMedian.textContent = formatSec(metrics.medianIntervalSec);
  metricMode.textContent = formatSec(metrics.modeIntervalSec);
  metricCv.textContent =
    metrics.arrhythmiaCvPct == null
      ? "—"
      : `${metrics.arrhythmiaCvPct.toFixed(1)} %`;
  metricIncomplete.textContent = String(metrics.incompleteBlinkCount);
}

function startCalibration() {
  if (!running || testActive || calibrating) return;
  ensureAudio();
  calibrating = true;
  calibrationCollecting = false;
  calibrationValues = [];
  calibrateBtn.disabled = true;
  inicioBtn.disabled = true;
  setStatus("Calibración · mantén los ojos abiertos… 2");
  let count = 2;
  const tick = () => {
    if (count > 0) {
      setStatus(`Calibración · mantén los ojos abiertos… ${count}`);
      count -= 1;
      calibrationTimerId = window.setTimeout(tick, 1000);
      return;
    }
    calibrationCollecting = true;
    setStatus("Calibrando apertura… 3 s");
    const collectUntil = performance.now() + 3000;
    const collect = () => {
      if (performance.now() < collectUntil && calibrating) {
        calibrationTimerId = window.setTimeout(collect, 80);
        return;
      }
      finishCalibration();
    };
    collect();
  };
  tick();
}

function finishCalibration() {
  calibrating = false;
  calibrationCollecting = false;
  if (calibrationTimerId) {
    clearTimeout(calibrationTimerId);
    calibrationTimerId = 0;
  }
  if (calibrationValues.length < 8) {
    setStatus("Calibración incompleta — mira a la cámara e inténtalo de nuevo");
    if (running) {
      calibrateBtn.disabled = false;
      inicioBtn.disabled = false;
    }
    return;
  }
  const mean =
    calibrationValues.reduce((a, b) => a + b, 0) / calibrationValues.length;
  // Lab 11: 30% por debajo del promedio (×0.70), acotado al rango de apertura.
  apertureThreshold = Math.max(0.35, Math.min(0.75, mean * 0.7));
  setStatus(
    `Calibrado · umbral ${(apertureThreshold * 100).toFixed(0)}% (media apertura ${(mean * 100).toFixed(0)}%)`,
  );
  if (running) {
    calibrateBtn.disabled = false;
    inicioBtn.disabled = false;
  }
}

function processBlink(blendshapes, now) {
  const left = blendshapeScore(blendshapes, "eyeBlinkLeft");
  const right = blendshapeScore(blendshapes, "eyeBlinkRight");
  const blink = (left + right) / 2;
  const aperture = Math.max(0, Math.min(1, 1 - blink));

  apertureValueEl.textContent = `${Math.round(aperture * 100)}%`;

  if (calibrationCollecting) {
    calibrationValues.push(aperture);
  }

  recentApertureWindow.push(aperture);
  if (recentApertureWindow.length > BASELINE_WINDOW) {
    recentApertureWindow.shift();
  }
  const dyn = computeDynamicThresholds(recentApertureWindow, apertureThreshold);
  thrRedDyn = dyn.thrRed;
  thrYellowDyn = dyn.thrYellow;

  liveApertureHistory.push(aperture);
  if (liveApertureHistory.length > 90) liveApertureHistory.shift();
  drawSparkline();

  if (testActive) {
    apertureHistory.push(aperture);
    if (apertureHistory.length > 6000) apertureHistory.shift();
    drawChart();

    const isFullBlink = aperture < thrRedDyn;
    if (!eyesClosed && isFullBlink) {
      eyesClosed = true;
      blinkCount += 1;
      blinkTimestamps.push(now);
      blinkCountEl.textContent = String(blinkCount);
      updateSenseChipLabel();
    } else if (eyesClosed && aperture > thrRedDyn + HYSTERESIS_OPEN) {
      eyesClosed = false;
    }

    const inZone =
      !isFullBlink && aperture <= thrYellowDyn && aperture > thrRedDyn;
    if (inZone && !inIntermediateZone) {
      incompleteBlinkCount += 1;
    }
    inIntermediateZone = inZone;

    const remaining = testEndsAt - now;
    timeLeftEl.textContent = formatTime(remaining);
    if (remaining <= 0) {
      finishTest();
    }
  }

  return aperture;
}

async function getVision() {
  if (!visionFileset) {
    visionFileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm",
    );
  }
  return visionFileset;
}

async function createLandmarkerWithDelegate(delegate) {
  const vision = await getVision();
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate,
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
  });
}

async function createLandmarker() {
  setStatus("Cargando modelo Face…");
  const order = isMobile ? ["CPU", "GPU"] : ["GPU", "CPU"];
  let lastError = null;
  for (const delegate of order) {
    try {
      faceLandmarker = await createLandmarkerWithDelegate(delegate);
      setStatus(`Modelo listo (${delegate})`);
      return;
    } catch (err) {
      console.warn(`MediaPipe delegate ${delegate} falló:`, err);
      lastError = err;
      faceLandmarker = null;
    }
  }
  throw lastError ?? new Error("No se pudo crear FaceLandmarker");
}

function waitForVideoReady() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("La cámara no entregó frames a tiempo"));
    }, 8000);
    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        cleanup();
        resolve();
      }
    };
    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("loadedmetadata", onReady);
    };
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("loadedmetadata", onReady);
    onReady();
  });
}

async function openCameraStream(deviceId) {
  let media;
  try {
    media = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: buildVideoConstraints(deviceId),
    });
  } catch (err) {
    if (deviceId) {
      media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: buildVideoConstraints(""),
      });
    } else {
      throw err;
    }
  }
  const track = media.getVideoTracks()[0];
  updateMirrorFromTrack(track);
  selectedDeviceId = track?.getSettings?.()?.deviceId || deviceId || "";
  return media;
}

async function startCamera() {
  if (running || switchingCamera) return;
  startCamBtn.disabled = true;
  setStatus("Pidiendo permiso de cámara…");
  try {
    if (!faceLandmarker) await createLandmarker();
    stream = await openCameraStream(cameraSelect.value || selectedDeviceId);
    await refreshCameraList(selectedDeviceId);
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    video.muted = true;
    await video.play();
    await waitForVideoReady();
    resizeCanvas();
    placeholder.classList.add("hidden");
    running = true;
    stopCamBtn.disabled = false;
    startCamBtn.disabled = true;
    lecturaBtn.disabled = false;
    cameraSelect.disabled = false;
    calibrateBtn.disabled = false;
    if (sparklineCanvas) sparklineCanvas.hidden = false;
    liveApertureHistory = [];
    recentApertureWindow = [];
    resetInicioButton();
    lastDetectTs = 0;
    lastTimestampMs = 0;
    latestLandmarks = [];
    setStatus(
      isMobile
        ? "Cámara activa (móvil) · Calibrar recomendado"
        : "Cámara activa · Calibrar recomendado",
    );
    detectLoop();
  } catch (err) {
    console.error(err);
    startCamBtn.disabled = false;
    stopCamBtn.disabled = true;
    inicioBtn.disabled = true;
    calibrateBtn.disabled = true;
    if (sparklineCanvas) sparklineCanvas.hidden = true;
    setStatus(err?.name === "NotAllowedError" ? "Permiso de cámara denegado" : err?.message || "No se pudo iniciar la cámara");
    lecturaBtn.disabled = true;
  }
}

async function switchCamera(deviceId) {
  if (!running || switchingCamera || !deviceId || deviceId === selectedDeviceId) return;
  switchingCamera = true;
  cameraSelect.disabled = true;
  setStatus("Cambiando cámara…");
  try {
    stopStreamTracks();
    stream = await openCameraStream(deviceId);
    await refreshCameraList(selectedDeviceId);
    video.srcObject = stream;
    await video.play();
    await waitForVideoReady();
    resizeCanvas();
    latestLandmarks = [];
    lastDetectTs = 0;
    lastTimestampMs = 0;
    setStatus("Cámara activa");
  } catch (err) {
    console.error(err);
    setStatus(err?.message || "No se pudo cambiar de cámara");
  } finally {
    switchingCamera = false;
    cameraSelect.disabled = false;
  }
}

function stopCamera() {
  if (testActive) finishTest(false);
  if (readingMode) setReadingMode(false);
  running = false;
  switchingCamera = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  stopStreamTracks();
  void releaseWakeLock();
  video.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  latestLandmarks = [];
  placeholder.classList.remove("hidden");
  startCamBtn.disabled = false;
  stopCamBtn.disabled = true;
  inicioBtn.disabled = true;
  calibrateBtn.disabled = true;
  lecturaBtn.disabled = true;
  bgNote.hidden = true;
  senseChip.hidden = true;
  if (sparklineCanvas) sparklineCanvas.hidden = true;
  liveApertureHistory = [];
  recentApertureWindow = [];
  calibrating = false;
  viewport.classList.remove("show-mini");
  clearTestTimer();
  resetInicioButton();
  setStatus("Detenido");
}

function openDurationModal() {
  if (!running || testActive || calibrating) return;
  ensureAudio();
  durationModal.hidden = false;
}

function closeDurationModal() {
  durationModal.hidden = true;
}

function clearTestTimer() {
  if (testTimerId) {
    clearInterval(testTimerId);
    testTimerId = 0;
  }
}

function startTest(seconds) {
  closeDurationModal();
  ensureAudio();
  playStartBeep();
  void requestWakeLock();
  hiddenWarningShown = false;
  clearTestTimer();
  resultBanner.hidden = true;
  if (metricsPanel) metricsPanel.hidden = true;
  if (metricsInfoBtn) {
    metricsInfoBtn.hidden = true;
    metricsInfoBtn.textContent = "Info";
  }
  if (metricsInfoPanel) metricsInfoPanel.hidden = true;
  lastMetrics = null;

  testActive = true;
  testDurationMs = seconds * 1000;
  testEndsAt = performance.now() + testDurationMs;
  blinkCount = 0;
  incompleteBlinkCount = 0;
  eyesClosed = false;
  inIntermediateZone = false;
  apertureHistory = [];
  blinkTimestamps = [];
  blinkCountEl.textContent = "0";
  timeLeftEl.textContent = formatTime(testDurationMs);
  apertureValueEl.textContent = "—";
  statsBar.hidden = false;
  calibrateBtn.disabled = true;
  chartHint.textContent = `Prueba de ${formatDurationLabel(seconds)} en curso · umbral dinámico activo`;

  armedSeconds = 0;
  inicioBtn.classList.remove("armed");
  inicioBtn.classList.add("running");
  inicioMain.textContent = "En curso";
  inicioSub.hidden = false;
  inicioSub.textContent = formatDurationLabel(seconds);
  inicioBtn.disabled = true;

  updateSenseChipLabel();
  setStatus(readingMode ? "Prueba + actividad" : "Prueba en curso · puedes ir a Actividad");
  bgNote.hidden = Boolean(readingMode);
  drawChart();

  // Temporizador independiente del canvas/rAF para no perder el final en Actividad.
  testTimerId = window.setInterval(() => {
    if (!testActive) {
      clearTestTimer();
      return;
    }
    const remaining = testEndsAt - performance.now();
    timeLeftEl.textContent = formatTime(remaining);
    if (remaining <= 0) finishTest(true);
  }, 200);
}

function finishTest(playSound = true) {
  if (!testActive) return;
  testActive = false;
  clearTestTimer();
  timeLeftEl.textContent = "0:00";
  const metrics = calculateStatistics();
  lastMetrics = metrics;
  chartHint.textContent = `Prueba terminada · ${blinkCount} parpadeo${blinkCount === 1 ? "" : "s"} · ${metrics.bpm} /min`;
  setStatus(`Prueba terminada · ${blinkCount} parpadeos · CV ${metrics.arrhythmiaCvPct?.toFixed?.(1) ?? "—"}%`);
  statsBar.hidden = false;
  bgNote.hidden = true;

  // Salir de Actividad para mostrar gráfica y resultado de inmediato.
  if (readingMode) setReadingMode(false);
  tetrisGame?.pauseForTabHide?.();

  resultTitle.textContent = "Prueba terminada";
  resultDetail.textContent = `${blinkCount} parpadeo${blinkCount === 1 ? "" : "s"} · ${metrics.bpm} por minuto. Gráfica y métricas abajo.`;
  resultBanner.hidden = false;
  renderMetrics(metrics);

  if (playSound) {
    ensureAudio();
    playEndBeeps();
  }
  resetInicioButton();
  if (running) {
    inicioBtn.disabled = false;
    calibrateBtn.disabled = false;
  }
  updateSenseChipLabel();

  // Llevar la vista al resultado/gráfica.
  requestAnimationFrame(() => {
    resultBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
    drawChart();
    document.getElementById("chartPanel")?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  });

  window.parent?.postMessage(
    {
      source: "habertronic-parpadeometro",
      type: "test-finished",
      blinkCount,
      incompleteBlinkCount,
      durationMs: testDurationMs,
      bpm: metrics.bpm,
      meanIntervalSec: metrics.meanIntervalSec,
      medianIntervalSec: metrics.medianIntervalSec,
      modeIntervalSec: metrics.modeIntervalSec,
      arrhythmiaCvPct: metrics.arrhythmiaCvPct,
      apertureThreshold,
      finishedAt: new Date().toISOString(),
    },
    window.location.origin,
  );
}

function detectLoop() {
  if (!running) return;
  rafId = requestAnimationFrame(detectLoop);
  if (!faceLandmarker || video.readyState < 2 || !video.videoWidth) return;

  const now = performance.now();
  resizeCanvas();

  let blendshapes = null;
  if (now - lastDetectTs >= 33) {
    lastDetectTs = now;
    const timestampMs = now <= lastTimestampMs ? lastTimestampMs + 1 : now;
    lastTimestampMs = timestampMs;
    try {
      const result = faceLandmarker.detectForVideo(video, timestampMs);
      latestLandmarks = result.faceLandmarks ?? [];
      blendshapes = result.faceBlendshapes?.[0] ?? null;
      if (blendshapes) processBlink(blendshapes, now);
      else if (testActive) {
        const remaining = testEndsAt - now;
        timeLeftEl.textContent = formatTime(remaining);
        if (remaining <= 0) finishTest();
      }
    } catch (err) {
      console.error(err);
      setStatus("Error al detectar — reintenta");
      return;
    }
  } else if (testActive) {
    const remaining = testEndsAt - now;
    timeLeftEl.textContent = formatTime(remaining);
    if (remaining <= 0) finishTest();
  }

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (mirrorPreview) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  for (const landmarks of latestLandmarks) {
    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
      color: "rgba(34, 211, 238, 0.45)",
      lineWidth: 1,
    });
    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
      color: "#f59e0b",
      lineWidth: 1.5,
    });
    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
      color: "#f59e0b",
      lineWidth: 1.5,
    });
    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
      color: "#67e8f9",
      lineWidth: 1.5,
    });
  }
  ctx.restore();
}

startCamBtn.addEventListener("click", () => void startCamera());
stopCamBtn.addEventListener("click", stopCamera);
calibrateBtn.addEventListener("click", startCalibration);
inicioBtn.addEventListener("click", onInicioClick);
metricsInfoBtn?.addEventListener("click", () => {
  if (!metricsInfoPanel) return;
  const open = metricsInfoPanel.hidden;
  metricsInfoPanel.hidden = !open;
  metricsInfoBtn.textContent = open ? "Ocultar info" : "Info";
  if (open) {
    metricsInfoPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});
modalCloseBtn.addEventListener("click", closeDurationModal);
lecturaBtn.addEventListener("click", () => {
  if (!running) return;
  setReadingMode(!readingMode);
});
exitLecturaBtn.addEventListener("click", () => setReadingMode(false));

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchActivityTab(btn.dataset.tab));
});

wikiForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void loadWikipediaArticle(wikiUrlInput.value);
});

videoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadVideoUrl(videoUrlInput.value);
});

videoFileInput.addEventListener("change", () => {
  const file = videoFileInput.files?.[0];
  if (!file) return;
  videoFallback.hidden = true;
  videoFrame.hidden = true;
  videoFrame.removeAttribute("src");
  document.querySelectorAll(".video-card").forEach((card) => card.classList.remove("active"));
  clearLocalVideo();
  localVideoUrl = URL.createObjectURL(file);
  localVideo.src = localVideoUrl;
  localVideo.hidden = false;
  void localVideo.play().catch(() => {});
});

durationModal.addEventListener("click", (event) => {
  if (event.target === durationModal) closeDurationModal();
});

document.querySelectorAll(".duration-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const seconds = Number(btn.dataset.seconds);
    if (seconds > 0) {
      closeDurationModal();
      armTest(seconds);
    }
  });
});

cameraSelect.addEventListener("change", () => {
  selectedDeviceId = cameraSelect.value;
  if (running) void switchCamera(selectedDeviceId);
});

navigator.mediaDevices?.addEventListener?.("devicechange", () => {
  void refreshCameraList(selectedDeviceId);
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    if ((testActive || readingMode) && !wakeLock) void requestWakeLock();
    if (running && stream) {
      const track = stream.getVideoTracks()[0];
      if (track && track.readyState === "ended") {
        setStatus("La cámara se detuvo al salir. Vuelve a iniciar cámara.");
      }
    }
    return;
  }

  // Fuera de la app: Android/iOS suelen pausar cámara y JS.
  if (testActive || running) {
    bgNote.hidden = false;
    if (!hiddenWarningShown) {
      hiddenWarningShown = true;
      setStatus("Pausa del sistema al salir de la app · usa Actividad");
    }
  }
});

window.addEventListener("resize", () => {
  drawChart();
});

window.addEventListener("pagehide", stopCamera);
window.addEventListener("beforeunload", stopCamera);

drawChart();
buildActivityPickers();
setupSenseChipDrag();

// Ayuda a salir de cachés viejos de la PWA.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((regs) => {
    for (const reg of regs) {
      void reg.update?.();
    }
  });
}

tetrisGame = createTetris({
  canvas: document.getElementById("tetrisCanvas"),
  scoreEl: document.getElementById("tetrisScore"),
  linesEl: document.getElementById("tetrisLines"),
  statusEl: document.getElementById("tetrisStatus"),
  startBtn: document.getElementById("tetrisStartBtn"),
  pauseBtn: document.getElementById("tetrisPauseBtn"),
  resetBtn: document.getElementById("tetrisResetBtn"),
  leftBtn: document.getElementById("tetrisLeftBtn"),
  rightBtn: document.getElementById("tetrisRightBtn"),
  rotateBtn: document.getElementById("tetrisRotateBtn"),
  downBtn: document.getElementById("tetrisDownBtn"),
  dropBtn: document.getElementById("tetrisDropBtn"),
});

if (!navigator.mediaDevices?.getUserMedia) {
  setStatus("Este navegador no soporta cámara");
  startCamBtn.disabled = true;
  cameraSelect.disabled = true;
} else {
  void refreshCameraList();
}
