// src/logic/simulationConstants.js
import { standardWiresData as defaultStandardWiresData } from '../storage/standardWires.js'; // 从 .js 文件导入

// 辅助函数：获取当前使用的导线数据（用户定义优先，否则为默认）
function getCurrentWireData() {
  const userWiresString = localStorage.getItem('userDefinedStandardWires');
  if (userWiresString) {
    try {
      const userWires = JSON.parse(userWiresString);
      // 基本验证：检查是否为数组且结构基本正确 (至少有 gauge)
      if (Array.isArray(userWires) && userWires.every(wire => wire.hasOwnProperty('gauge'))) {
        return userWires;
      } else {
        console.warn('localStorage中的userDefinedStandardWires格式不正确，将使用默认值。');
        // 清理掉损坏的数据
        localStorage.removeItem('userDefinedStandardWires');
        return defaultStandardWiresData;
      }
    } catch (error) {
      console.error('从localStorage解析userDefinedStandardWires失败:', error, '将使用默认值。');
      // 清理掉损坏的数据
      localStorage.removeItem('userDefinedStandardWires');
      return defaultStandardWiresData;
    }
  }
  return defaultStandardWiresData;
}

// 导出一个函数来获取最新的 WIRE_OD_TABLE
// WIRE_OD_TABLE 的键是导线规格 (string)，值是包含 Thin, Thick, "Ultra Thin" 外径的对象
export function getWireOdTable() {
  const dataToUse = getCurrentWireData();
  return dataToUse.reduce((table, wire) => {
    // 确保 wire.gauge 存在且不为 null/undefined
    if (wire.gauge !== undefined && wire.gauge !== null) {
      table[String(wire.gauge)] = { // 确保键是字符串
        Thin: wire.thin,       // 从 localStorage (或默认) 的 .thin 映射
        Thick: wire.thick,     // 从 localStorage (或默认) 的 .thick 映射
        "Ultra Thin": wire.ultraThin // 从 localStorage (或默认) 的 .ultraThin 映射
      };
    }
    return table;
  }, {});
}

// 导出一个函数来获取最新的 STANDARD_GAUGES 列表
// 返回一个已排序的字符串规格数组
export function getStandardGauges() {
  const dataToUse = getCurrentWireData();
  const gauges = dataToUse
    .map(wire => wire.gauge)
    .filter(gauge => gauge !== undefined && gauge !== null) // 过滤掉无效的 gauge
    .map(gauge => String(gauge)); // 转换为字符串以保持一致性

  // 去重并按数值排序
  return [...new Set(gauges)].sort((a, b) => parseFloat(a) - parseFloat(b));
}

// WIRE_TYPES 通常是固定的，代表绝缘层类型
export const WIRE_TYPES = ["Thin", "Thick", "Ultra Thin"];

// 从localStorage获取模拟参数，如果没有则使用默认值
function getSimulationParam(paramName, defaultValue) {
  try {
    const savedParams = JSON.parse(localStorage.getItem('simulationParams'));
    if (savedParams && savedParams[paramName] !== undefined) {
      return savedParams[paramName];
    }
  } catch (e) {
    console.warn(`获取模拟参数 ${paramName} 失败:`, e);
  }
  return defaultValue;
}

// 物理和模拟常量
export const PI = getSimulationParam('pi', 3.1415926);
export const SNG_R2_TO_R1 = getSimulationParam('r2r1', 1.01); // 外部容器半径 / 内部填充区域半径 的比率
export const ACCELERATION = getSimulationParam('accel', 1.7); // 圆形每步互相推开的强度系数
export const WEIGHT_FACTOR = getSimulationParam('weight', 2); // 质量计算的指数 (r^WF) -> 影响大圆推小圆的程度
export const CONVERGENCE_THRESHOLD = getSimulationParam('conv', 0.001); // 收敛目标：平均穿透深度与半径的比值
export const MAX_ITERATIONS_RUNPACKING = getSimulationParam('max-iter-run', 500); // 主填充循环的安全中断迭代次数
export const MAX_ITERATIONS_PACKSTEP = getSimulationParam('max-iter-step', 15); // 每个主循环步骤中，在调整容器大小之前的最大迭代次数
export const CONTAINER_ADJUST_FACTOR = getSimulationParam('container-adjust', 0.05); // 根据穿透情况调整容器大小的幅度

// 新增：提供一个方法来获取默认标准导线数据，ConfigPage 会用到
// 返回一个深拷贝以防止意外修改原始数据
export function getDefaultStandardWires() {
    return JSON.parse(JSON.stringify(defaultStandardWiresData));
}

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