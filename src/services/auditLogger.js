import { getJSON, setJSON } from "./storage.js";

const KEY = "audit-multi-match";
const MAX_LEN = 200;

function nowTs() {
  try {
    return new Date().toISOString();
  } catch (_) {
    return String(Date.now());
  }
}

export function recordMultiMatch(entry) {
  const list = getJSON(KEY, []);
  const item = {
    ts: nowTs(),
    wireSize: String(entry?.wireSize ?? ""),
    wallThickness: String(entry?.wallThickness ?? ""),
    count: Number(entry?.count ?? 0),
    maxOd: entry?.maxOd ?? null,
    items: Array.isArray(entry?.items) ? entry.items : [],
  };
  list.push(item);
  if (list.length > MAX_LEN) {
    list.splice(0, list.length - MAX_LEN);
  }
  setJSON(KEY, list);
  return true;
}

