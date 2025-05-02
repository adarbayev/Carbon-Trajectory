export async function fetchHazards(lat, lon) {
  const target = `https://www.thinkhazard.org/en/report/bycoordinates.json?lat=${lat}&lon=${lon}`;
  const proxy = 'https://thingproxy.freeboard.io/fetch/';
  const url = proxy + target;

  console.log('[ThinkHazard URL]', url);

  const res = await fetch(url);
  if (!res.ok) throw new Error('proxy failed');
  return res.json().then(j => j.hazards);
} 
