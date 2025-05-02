export async function fetchHazards(lat, lon) {
  const target = `https://www.thinkhazard.org/en/report/bycoordinates.json?lat=${lat}&lon=${lon}`;
  const proxy  = 'https://api.allorigins.win/raw?url=';   // adds CORS header
  const url    = proxy + encodeURIComponent(target);

  console.log('[ThinkHazard URL]', url);                 // should start with api.allorigins

  const res = await fetch(url);                          // CORS now OK
  if (!res.ok) throw new Error('proxy failed');
  return res.json().then(j => j.hazards);
}
