// 简单统一存储访问层：封装 localStorage 的常用读写，提供 JSON 安全解析

function safeParseJSON(str, fallback) {
  try {
    const val = JSON.parse(str);
    return val === undefined ? fallback : val;
  } catch (e) {
    return fallback;
  }
}

export function getJSON(key, defaultValue = null) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return defaultValue;
    return safeParseJSON(raw, defaultValue);
  } catch (e) {
    return defaultValue;
  }
}

export function setJSON(key, value) {
  try {
    const raw = JSON.stringify(value);
    window.localStorage.setItem(key, raw);
    return true;
  } catch (e) {
    return false;
  }
}

export function getString(key, defaultValue = "") {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? defaultValue : raw;
  } catch (e) {
    return defaultValue;
  }
}

export function setString(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function getNumber(key, defaultValue = null) {
  const str = getString(key, null);
  if (str == null) return defaultValue;
  const n = Number(str);
  return Number.isFinite(n) ? n : defaultValue;
}

export function setNumber(key, value) {
  try {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error("Invalid number");
    window.localStorage.setItem(key, String(n));
    return true;
  } catch (e) {
    return false;
  }
}

export function remove(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}

export function exists(key) {
  try {
    return window.localStorage.getItem(key) != null;
  } catch (e) {
    return false;
  }
}