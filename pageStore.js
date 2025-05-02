const STORAGE_KEY = 'companyData';

export function saveCompanyData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadCompanyData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCompanyData() {
  localStorage.removeItem(STORAGE_KEY);
} 