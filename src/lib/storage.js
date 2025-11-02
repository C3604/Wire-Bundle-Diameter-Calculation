// 简单统一存储访问层：封装 localStorage 的常用读写，提供 JSON 安全解析
// 文档说明（P2）：
// - 解析失败与异常处理：所有 JSON 解析/序列化失败均回退到调用方提供的默认值，
//   并以最小化日志策略避免噪音（不抛异常，不强制输出详细堆栈）。
// - 默认值策略：
//   * getJSON(key, defaultValue)：当 key 不存在/解析失败/访问异常时返回 defaultValue；
//   * setJSON(key, value)：序列化失败或存储异常时返回 false，调用方可按需提示用户；
//   * remove(key)：移除失败返回 false，不影响后续逻辑。
// - 设计取舍：统一 JSON API，避免字符串/数字混用导致的隐式类型转换问题；
//   如需更细粒度的错误上报，请在调用方捕获返回值并追加业务日志。

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

export function remove(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}