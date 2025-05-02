export async function fetchHazards(lat, lon) {
  const url  = `https://www.thinkhazard.org/en/report/bycoordinates?lat=${lat}&lon=${lon}`;
  const prox = 'https://corsproxy.io/?url=';  // NEW: use url=
  const res  = await fetch(prox + encodeURIComponent(url)); // encode the URL
  if (!res.ok) throw new Error('proxy failed');
  return res.json().then(j => j.hazards);
} 
