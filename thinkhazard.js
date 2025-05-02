export async function fetchHazards(lat, lon) {
  const res = await fetch(`/api/thinkhazard?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error('proxy failed');
  return res.json(); // already the hazards array
} 
