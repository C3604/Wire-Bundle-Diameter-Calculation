// src/logic/simulationConstants.js
// 约定：常量与线规数据均通过 wireManager 的最新数据动态获取；避免在此文件中维护静态副本。
import { standardWiresData } from "../storage/standardWires.js";
import { getSimulationParameters, getEffectiveStandardWires } from "./wireManager.js";

// 初始加载一次模拟参数
let simulationParameters = getSimulationParameters();

// 导出动态参数对象（供需要完整参数的模块使用）
export { simulationParameters };

// --- 静态数据 ---

// 提供一个标准的线规外径查找表 (gauge to OD)
const WIRE_OD_TABLE = new Map(
  standardWiresData.map((item) => [item.gauge, item]),
);

// 参数与数据统一由 wireManager 提供

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

// 线型枚举统一由 utils/wireTypes 提供，此处不再导出

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

// 如需全局通知配置变更，请在页面级模块自定义事件派发，避免在常量模块耦合 UI。
