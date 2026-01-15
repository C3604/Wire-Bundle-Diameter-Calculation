// src/logic/simulationConstants.js
// 约定：常量与线规数据均通过 wireManager 的最新数据动态获取；避免在此文件中维护静态副本。
import { getSimulationParameters, getEffectiveStandardWires } from "./wireManager.js";

// 初始加载一次模拟参数
let simulationParameters = getSimulationParameters();

// 导出动态参数对象（供需要完整参数的模块使用）
export { simulationParameters };

// 参数与数据统一由 wireManager 提供


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
