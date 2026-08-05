const GEO_BASE =
  process.env.OPEN_METEO_GEO_BASE_URL ||
  'https://customer-geocoding-api.open-meteo.com';

function withKey(url) {
  const key = process.env.OPEN_METEO_API_KEY;
  if (!key) {
    throw new Error('Falta OPEN_METEO_API_KEY en el entorno');
  }
  const u = new URL(url);
  u.searchParams.set('apikey', key);
  return u.toString();
}

async function searchPlaces(name, language = 'es') {
  const q = String(name || '').trim();
  if (q.length < 2) return [];

  const url = withKey(
    `${GEO_BASE}/v1/search?name=${encodeURIComponent(q)}` +
      `&count=8&language=${encodeURIComponent(language)}&format=json`,
  );

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Geocoding HTTP ${res.status} ${body.slice(0, 160)}`);
  }

  const data = await res.json();
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
