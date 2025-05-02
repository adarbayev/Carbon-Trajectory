/**********************************************************************
 *  thinkhazard.js
 *  Fetch physical-climate-risk levels for a site via your Cloudflare
 *  Worker proxy (CORS-safe, cached 24 h on the edge).
 *********************************************************************/

const PROXY_ENDPOINT = 'https://dry-sky-3b8b.aa-darbayev.workers.dev';

export const LEVEL_COLOUR = {
  'Very Low': '#c7f0d8',
  'Low'     : '#a3e4b1',
  'Medium'  : '#fddc7a',
  'High'    : '#f86e5c'
};

export async function fetchHazards(lat, lon) {
  const url = `${PROXY_ENDPOINT}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  console.log('[ThinkHazard URL]', url);

  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`Proxy responded ${res.status}`);
    const hazards = await res.json();
    return hazards;
  } catch (err) {
    console.error('[ThinkHazard] fetch failed:', err);
    return null;
  }
}

export function getWorstHazard(hazards) {
  if (!hazards || !hazards.length) return null;
  const rank = { 'Very Low': 0, 'Low': 1, 'Medium': 2, 'High': 3 };
  return hazards.reduce((worst, h) =>
    rank[h.level] > rank[worst.level] ? h : worst
  , hazards[0]);
}
