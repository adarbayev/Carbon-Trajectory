export async function fetchHazards(lat, lon) {
  const prox = 'https://corsproxy.io/?';
  const url  = `https://www.thinkhazard.org/en/report/bycoordinates?lat=${lat}&lon=${lon}`;
  const res  = await fetch(prox + encodeURIComponent(url));
  if (!res.ok) throw new Error('proxy failed');
  return res.json().then(j => j.hazards);
} 
