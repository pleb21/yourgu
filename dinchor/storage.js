// Thin storage layer for activity blocks, keyed by day.
// Backed by localStorage for now; export/import exist so a future
// sync backend (e.g. Firebase) can slot in without touching callers.

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function storageKeyFor(key) {
  return `dinchor.day.${key}`;
}

function loadDay(key) {
  const raw = localStorage.getItem(storageKeyFor(key));
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      // fall through to empty day on corrupt data
    }
  }
  return [];
}

function saveDay(key, blocks) {
  localStorage.setItem(storageKeyFor(key), JSON.stringify(blocks));
}

function allDayKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('dinchor.day.')) keys.push(k.slice('dinchor.day.'.length));
  }
  return keys.sort();
}

function exportAllJSON() {
  const days = {};
  allDayKeys().forEach((key) => {
    days[key] = loadDay(key);
  });
  return JSON.stringify({ app: 'dinchor', version: 1, exportedAt: new Date().toISOString(), days }, null, 2);
}

// Returns the { [dayKey]: blocks[] } payload from an export file. Throws if
// the file doesn't look like a dinchor export — callers should catch.
function importAllJSON(json) {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || typeof parsed.days !== 'object' || parsed.days === null) {
    throw new Error('Not a dinchor export file.');
  }
  return parsed.days;
}
