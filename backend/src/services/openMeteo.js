const CUSTOMER_WEATHER =
  process.env.OPEN_METEO_BASE_URL || 'https://customer-api.open-meteo.com';
const PUBLIC_WEATHER = 'https://api.open-meteo.com';

const CUSTOMER_AIR =
  process.env.OPEN_METEO_AIR_BASE_URL ||
  'https://customer-air-quality-api.open-meteo.com';
const PUBLIC_AIR = 'https://air-quality-api.open-meteo.com';

function apiKey() {
  return String(process.env.OPEN_METEO_API_KEY || '').trim();
}

function withKey(url) {
  const key = apiKey();
  if (!key) return url;
  const u = new URL(url);
  u.searchParams.set('apikey', key);
  return u.toString();
}

async function fetchJson(url, label) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${label} HTTP ${res.status} ${body.slice(0, 180)}`);
  }
  return res.json();
}

async function fetchWithFallback(customerUrl, publicUrl, label) {
  if (apiKey()) {
    try {
      return await fetchJson(withKey(customerUrl), `${label} customer`);
    } catch (err) {
      console.warn(`${label} customer falló, usando API pública:`, err.message);
    }
  } else {
    console.warn(`${label}: sin OPEN_METEO_API_KEY, usando API pública`);
  }
  return fetchJson(publicUrl, `${label} public`);
}

/**
 * Snapshot ambiental a partir de coordenadas aproximadas.
 */
async function fetchEnvironmentSnapshot(lat, lng) {
  const query =
    `/v1/forecast?latitude=${lat}&longitude=${lng}` +
    '&current=temperature_2m,relative_humidity_2m,pressure_msl,surface_pressure,wind_speed_10m' +
    '&timezone=auto';

  const airQuery =
    `/v1/air-quality?latitude=${lat}&longitude=${lng}` +
    '&current=pm2_5,pm10,european_aqi,us_aqi,dust,ozone,nitrogen_dioxide,uv_index' +
    '&timezone=auto';

  const weather = await fetchWithFallback(
    `${CUSTOMER_WEATHER}${query}`,
    `${PUBLIC_WEATHER}${query}`,
    'Open-Meteo weather',
  );

  let air = { current: {} };
  try {
    air = await fetchWithFallback(
      `${CUSTOMER_AIR}${airQuery}`,
      `${PUBLIC_AIR}${airQuery}`,
      'Open-Meteo air',
    );
  } catch (err) {
    console.warn('Air quality opcional falló:', err.message);
  }

  const w = weather.current || {};
  const a = air.current || {};

  return {
    source: apiKey() ? 'open-meteo' : 'open-meteo-public',
    capturedAt: new Date().toISOString(),
    lat,
    lng,
    weather: {
      temperatureC: w.temperature_2m ?? null,
      humidityPct: w.relative_humidity_2m ?? null,
      pressureMslHpa: w.pressure_msl ?? null,
      surfacePressureHpa: w.surface_pressure ?? null,
      uvIndex: a.uv_index ?? null,
      windSpeedKmh: w.wind_speed_10m ?? null,
    },
    air: {
      pm25: a.pm2_5 ?? null,
      pm10: a.pm10 ?? null,
      dust: a.dust ?? null,
      ozone: a.ozone ?? null,
      nitrogenDioxide: a.nitrogen_dioxide ?? null,
      europeanAqi: a.european_aqi ?? null,
      usAqi: a.us_aqi ?? null,
    },
  };
}

module.exports = { fetchEnvironmentSnapshot };
