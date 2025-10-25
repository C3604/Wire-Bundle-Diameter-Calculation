// src/logic/simulationConstants.js
import { standardWiresData } from "../storage/standardWires.js";
import { getSimulationParameters, getEffectiveStandardWires } from "./wireManager.js";

// 初始加载一次模拟参数
let simulationParameters = getSimulationParameters();

/**
 * @deprecated The `reloadParameters` function is deprecated. Parameters are now managed by wireManager.js
 * and the engine should get them from there.
 */
export function reloadParameters() {
  console.warn(
    "reloadParameters is deprecated and will be removed in a future version.",
  );
  simulationParameters = getSimulationParameters();
  // 同步更新导出的参数常量，保证渲染器等模块获取到最新值
  PI = simulationParameters.PI;
  SNG_R2_TO_R1 = simulationParameters.SNG_R2_TO_R1;
  ACCELERATION = simulationParameters.ACCELERATION;
  WEIGHT_FACTOR = simulationParameters.WEIGHT_FACTOR;
  CONVERGENCE_THRESHOLD = simulationParameters.CONVERGENCE_THRESHOLD;
  MAX_ITERATIONS_RUNPACKING = simulationParameters.MAX_ITERATIONS_RUNPACKING;
  MAX_ITERATIONS_PACKSTEP = simulationParameters.MAX_ITERATIONS_PACKSTEP;
  CONTAINER_ADJUST_FACTOR = simulationParameters.CONTAINER_ADJUST_FACTOR;
}

// 导出动态参数对象（供需要完整参数的模块使用）
export { simulationParameters };

// --- 静态数据 ---

// 提供一个标准的线规外径查找表 (gauge to OD)
const WIRE_OD_TABLE = new Map(
  standardWiresData.map((item) => [item.gauge, item]),
);

/**
 * 根据线规(gauge)获取对应的导线数据对象（已与 wireManager 对齐）
 * @param {string | number} gauge - 线规值
 * @returns {object | undefined} 导线数据对象或undefined
 */
export function getWireDataByGauge(gauge) {
  const table = buildWireOdTable();
  return table[String(gauge)];
}

/**
 * @deprecated This function is deprecated. Please use `getEffectiveStandardWires` from `wireManager.js` instead.
 * 获取当前的电线规格数据（这是一个历史遗留函数，为了兼容保留）
 * @returns {Array} 电线规格数组
 */
export function getCurrentWireData() {
  console.warn(
    "getCurrentWireData is deprecated. Use getEffectiveStandardWires from wireManager.js instead.",
  );
  return getEffectiveStandardWires();
}

/**
 * @deprecated This function is deprecated. Please use `getEffectiveStandardWires` from `wireManager.js` instead.
 * 获取默认的标准电线数据
 * @returns {Array}
 */
export function getDefaultStandardWires() {
  console.warn(
    "getDefaultStandardWires is deprecated. Use getEffectiveStandardWires from wireManager.js instead.",
  );
  return standardWiresData;
}

// 基于 wireManager 的有效库构建最新的 OD 映射表
function buildWireOdTable() {
  const dataToUse = getEffectiveStandardWires();
  return dataToUse.reduce((table, wire) => {
    if (wire.gauge !== undefined && wire.gauge !== null) {
      table[String(wire.gauge)] = {
        Thin: wire.thin,
        Thick: wire.thick,
        "Ultra Thin": wire.ultraThin,
      };
    }
    return table;
  }, {});
}

// 导出一个函数来获取最新的 WIRE_OD_TABLE（已与 wireManager 对齐）
export function getWireOdTable() {
  return buildWireOdTable();
}

// 导出一个函数来获取最新的 STANDARD_GAUGES 列表（已与 wireManager 对齐）
// 返回一个已排序的字符串规格数组
export function getStandardGauges() {
  const dataToUse = getEffectiveStandardWires();
  const gauges = dataToUse
    .map((wire) => wire.gauge)
    .filter((gauge) => gauge !== undefined && gauge !== null)
    .map((gauge) => String(gauge));
  return [...new Set(gauges)].sort((a, b) => parseFloat(a) - parseFloat(b));
}

// WIRE_TYPES 通常是固定的，代表绝缘层类型（UI 使用 i18n 标签展示）
export const WIRE_TYPES = ["Thin", "Thick", "Ultra Thin"];

// --- 模拟参数常量（统一来源于 wireManager） ---
export let PI = simulationParameters.PI;
export let SNG_R2_TO_R1 = simulationParameters.SNG_R2_TO_R1;
export let ACCELERATION = simulationParameters.ACCELERATION;
export let WEIGHT_FACTOR = simulationParameters.WEIGHT_FACTOR;
export let CONVERGENCE_THRESHOLD = simulationParameters.CONVERGENCE_THRESHOLD;
export let MAX_ITERATIONS_RUNPACKING =
  simulationParameters.MAX_ITERATIONS_RUNPACKING;
export let MAX_ITERATIONS_PACKSTEP =
  simulationParameters.MAX_ITERATIONS_PACKSTEP;
export let CONTAINER_ADJUST_FACTOR =
  simulationParameters.CONTAINER_ADJUST_FACTOR;

// 可选：如果需要全局通知配置变更，可以取消注释并使用
// export function dispatchWireConfigChangeEvent() {
//     window.dispatchEvent(new CustomEvent('wireConfigChanged'));
// }

// 旧的常量定义，现在由函数替代
// export const WIRE_OD_TABLE = standardWiresData.reduce((table, wire) => {
//   table[wire.gauge] = { // wire.gauge 是数字，对象键会自动字符串化
//     Thin: wire.thin,
//     Thick: wire.thick,
//     "Ultra Thin": wire.ultraThin
//   };
//   return table;
// }, {});
// export const STANDARD_GAUGES = Object.keys(WIRE_OD_TABLE);

// UI 相关常量 (例如 CANVAS_PADDING) 如果需要全局共享且与逻辑相关，也可以放在这里
// export const CANVAS_PADDING = 15; // 或者由渲染器自行处理或作为参数传入
