export async function fetchHazards(lat, lon) {
  const target = `https://www.thinkhazard.org/en/report/bycoordinates?lat=${lat}&lon=${lon}`;
  const url    = 'https://corsproxy.io/?' + encodeURIComponent(target);

  console.log('[ThinkHazard URL]', url);

  const res = await fetch(url);
  if (!res.ok) throw new Error('proxy failed');
  return res.json().then(j => j.hazards);
} 
