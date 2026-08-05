const WEATHER_BASE =
  process.env.OPEN_METEO_BASE_URL || 'https://customer-api.open-meteo.com';

const AIR_BASE =
  process.env.OPEN_METEO_AIR_BASE_URL ||
  'https://customer-air-quality-api.open-meteo.com';

function withKey(url) {
  const key = process.env.OPEN_METEO_API_KEY;
  if (!key) {
    throw new Error('Falta OPEN_METEO_API_KEY en el entorno');
  }
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

/**
 * Snapshot ambiental a partir de coordenadas aproximadas.
 */
async function fetchEnvironmentSnapshot(lat, lng) {
  const weatherUrl = withKey(
    `${WEATHER_BASE}/v1/forecast?latitude=${lat}&longitude=${lng}` +
      '&current=temperature_2m,relative_humidity_2m,pressure_msl,surface_pressure,wind_speed_10m' +
      '&timezone=auto',
  );

  const airUrl = withKey(
    `${AIR_BASE}/v1/air-quality?latitude=${lat}&longitude=${lng}` +
      '&current=pm2_5,pm10,european_aqi,us_aqi,dust,ozone,nitrogen_dioxide,uv_index' +
      '&timezone=auto',
  );

  const weather = await fetchJson(weatherUrl, 'Open-Meteo weather');

  let air = { current: {} };
  try {
    air = await fetchJson(airUrl, 'Open-Meteo air');
  } catch (err) {
    console.warn('Air quality opcional falló:', err.message);
  }

  const w = weather.current || {};
  const a = air.current || {};

  return {
    source: 'open-meteo',
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
