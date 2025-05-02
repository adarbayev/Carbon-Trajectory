export async function fetchHazards(lat, lon) {
  const target = `https://www.thinkhazard.org/en/report/bycoordinates?lat=${lat}&lon=${lon}`;
  const proxy  = 'https://corsproxy.io/?';                  // ← no url=
  const res    = await fetch(proxy + encodeURIComponent(target));

  if (!res.ok) throw new Error('proxy failed');
  return res.json().then(j => j.hazards);
} 
