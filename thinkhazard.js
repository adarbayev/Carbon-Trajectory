export async function fetchHazards(lat, lon){
  const url = `https://www.thinkhazard.org/en/report/bycoordinates?lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('ThinkHazard fetch failed');
  const json = await res.json();
  return json.hazards;                 // array of {hazard, level,…}
} 