export async function fetchHazards(lat, lon) {
  const url  = `https://www.thinkhazard.org/en/report/bycoordinates?lat=${lat}&lon=${lon}`;
  const prox = 'https://corsproxy.io/?';   // NOTE: no encoding!
  const res  = await fetch(prox + url);     // just concatenate, no encodeURIComponent
  if (!res.ok) throw new Error('proxy failed');
  return res.json().then(j => j.hazards);
} 
