/**
 * Reverse geocoding con Nominatim (OpenStreetMap).
 * Política: 1 req/s aprox.; identificar la app en User-Agent.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT =
  'HabertronicOrion/1.0 (https://habertronic-orion.netlify.app; research contact)';

let lastCallAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickState(address) {
  return (
    address.state ||
    address.region ||
    address.province ||
    address.state_district ||
    null
  );
}

function pickLocality(address) {
  const suburb =
    address.suburb ||
    address.neighbourhood ||
    address.quarter ||
    address.residential ||
    null;
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.city_district ||
    address.county ||
    null;

  if (suburb && city && suburb !== city) return `${suburb}, ${city}`;
  return suburb || city || null;
}

function buildLabel({ country, state, locality }) {
  return [locality, state, country].filter(Boolean).join(', ') || null;
}

async function reverseGeocode(lat, lng, language = 'es') {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const wait = 1100 - (Date.now() - lastCallAt);
  if (wait > 0) await sleep(wait);

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('zoom', '14');
  url.searchParams.set('accept-language', String(language || 'es'));

  lastCallAt = Date.now();
  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Nominatim HTTP ${res.status} ${body.slice(0, 120)}`);
  }

  const data = await res.json();
  const address = data?.address && typeof data.address === 'object' ? data.address : {};
  const country = address.country ? String(address.country) : null;
  const state = pickState(address);
  const locality = pickLocality(address);
  const label =
    buildLabel({ country, state, locality }) ||
    (data.display_name ? String(data.display_name).slice(0, 200) : null);

  return {
    country,
    state,
    locality,
    label,
    countryCode: address.country_code
      ? String(address.country_code).toUpperCase()
      : null,
    provider: 'nominatim',
  };
}

module.exports = { reverseGeocode };
