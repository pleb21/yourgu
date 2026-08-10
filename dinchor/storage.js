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

function exportJSON(blocks) {
  return JSON.stringify(blocks, null, 2);
}

function importJSON(json) {
  return JSON.parse(json);
}
