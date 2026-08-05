const CUSTOMER_GEO =
  process.env.OPEN_METEO_GEO_BASE_URL ||
  'https://customer-geocoding-api.open-meteo.com';
const PUBLIC_GEO = 'https://geocoding-api.open-meteo.com';

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
    throw new Error(`${label} HTTP ${res.status} ${body.slice(0, 160)}`);
  }
  return res.json();
}

async function searchPlaces(name, language = 'es') {
  const q = String(name || '').trim();
  if (q.length < 2) return [];

  const path =
    `/v1/search?name=${encodeURIComponent(q)}` +
    `&count=8&language=${encodeURIComponent(language)}&format=json`;

  let data;
  if (apiKey()) {
    try {
      data = await fetchJson(withKey(`${CUSTOMER_GEO}${path}`), 'Geocoding customer');
    } catch (err) {
      console.warn('Geocoding customer falló, usando API pública:', err.message);
      data = await fetchJson(`${PUBLIC_GEO}${path}`, 'Geocoding public');
    }
  } else {
    data = await fetchJson(`${PUBLIC_GEO}${path}`, 'Geocoding public');
  }

  const results = Array.isArray(data.results) ? data.results : [];

  return results.map((item) => ({
    id: item.id,
    name: item.name,
    country: item.country || item.country_code || '',
    admin1: item.admin1 || '',
    latitude: item.latitude,
    longitude: item.longitude,
    label: [item.name, item.admin1, item.country || item.country_code]
      .filter(Boolean)
      .join(', '),
  }));
}

module.exports = { searchPlaces };
