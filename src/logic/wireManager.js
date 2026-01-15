import { standardWiresData } from "../storage/standardWires.js";
import { getJSON } from "../services/storage.js";

// 定义本地存储中使用的键
const STORAGE_KEYS = {
  CUSTOM_LIBRARIES: "userDefinedStandardWires", // 用户自定义的电线规格库
  SIMULATION_PARAMETERS: "simulationParameters", // 用户自定义的模拟参数
};

// --- 电线规格管理 ---

/**
 * 从 localStorage 获取用户自定义的电线库
 * @returns {Array} 用户电线库数组，如果不存在或解析失败则返回空数组
 */
function getCustomWireLibraries() {
  const arr = getJSON(STORAGE_KEYS.CUSTOM_LIBRARIES, []);
  return Array.isArray(arr) ? arr : [];
}

// 已由 pages/config/wiresStore.js 统一提供写入接口，移除此未使用导出

/**
 * 获取合并后的有效电线标准库（基础标准库 + 用户自定义库）
 * @param {Array} baseStandard 可选，外部加载的基础标准库；不传则使用内置 standardWiresData
 * @returns {Array} 合并并排序后的电线规格数组
 */
export function getEffectiveStandardWires(baseStandard) {
  const base = Array.isArray(baseStandard) && baseStandard.length > 0 ? baseStandard : standardWiresData;
  const standardMap = new Map(
    base.map((wire) => [String(wire.gauge).trim(), { ...wire }]),
  );

  const customWires = getCustomWireLibraries();
  customWires.forEach((wire) => {
    const key = String(wire.gauge).trim();
    if (key) {
      standardMap.set(key, { ...wire });
    }
  });

  return Array.from(standardMap.values()).sort((a, b) =>
    String(a.gauge).localeCompare(String(b.gauge), "zh-CN", { numeric: true }),
  );
}

// --- 模拟参数管理 ---

// 默认模拟参数（已与 ref/simulation.js 和 simulationConfig.json 对齐）
const DEFAULT_SIMULATION_PARAMETERS = {
  PI: 3.1415926535,
  SNG_R2_TO_R1: 1.01,
  ACCELERATION: 1.6,
  WEIGHT_FACTOR: 2.0,
  CONVERGENCE_THRESHOLD: 0.0012,
  MAX_ITERATIONS_RUNPACKING: 500,
  MAX_ITERATIONS_PACKSTEP: 15,
  CONTAINER_ADJUST_FACTOR: 0.05,
  SIMULATION_COUNT: 10,
};

/**
 * 获取模拟参数。优先从 localStorage 读取，如果失败或不存在则返回默认参数。
 * @returns {Object} 模拟参数对象
 */
export function getSimulationParameters() {
  const storedParamsString = localStorage.getItem(
    STORAGE_KEYS.SIMULATION_PARAMETERS,
  );
  if (storedParamsString) {
    try {
      const storedParams = JSON.parse(storedParamsString);
      // 确保所有必需的键都存在，防止因用户手动修改localStorage导致程序出错
      return { ...DEFAULT_SIMULATION_PARAMETERS, ...storedParams };
    } catch (error) {
      console.error("从localStorage解析模拟参数失败:", error);
    }
  }
  return { ...DEFAULT_SIMULATION_PARAMETERS };
}

/**
 * 将模拟参数保存到 localStorage
 * @param {Object} params - 要保存的参数对象
 */
export function saveSimulationParameters(params) {
  if (typeof params !== "object" || params === null) {
    console.error("保存失败：模拟参数必须是一个对象。");
    return;
  }
  localStorage.setItem(
    STORAGE_KEYS.SIMULATION_PARAMETERS,
    JSON.stringify(params),
  );
}

/**
 * 恢复默认模拟参数（通过从 localStorage 中移除）
 */
export function restoreDefaultSimulationParameters() {
  localStorage.removeItem(STORAGE_KEYS.SIMULATION_PARAMETERS);
}

/**
 * 获取默认的模拟参数
 * @returns {Object} 默认参数对象
 */
export function getDefaultSimulationParameters() {
  return { ...DEFAULT_SIMULATION_PARAMETERS };
}
