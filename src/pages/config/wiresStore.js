import { getJSON, setJSON, remove } from "../../lib/storage.js";

export const STORAGE_KEY = "userDefinedStandardWires";

export function loadUserCustomWires() {
  const arr = getJSON(STORAGE_KEY, []);
  if (
    Array.isArray(arr) &&
    arr.every((wire) => wire && Object.prototype.hasOwnProperty.call(wire, "gauge"))
  ) {
    return arr;
  }
  return [];
}

export function saveUserCustomWires(customWires) {
  if (!Array.isArray(customWires)) {
    throw new Error("customWires must be an array");
  }
  setJSON(STORAGE_KEY, customWires);
}

export function clearUserCustomWires() {
  remove(STORAGE_KEY);
}