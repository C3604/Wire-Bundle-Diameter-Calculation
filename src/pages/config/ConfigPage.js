import { standardWiresData } from "../../storage/standardWires.js";
import {
  getEffectiveStandardWires,
  getSimulationParameters,
  saveSimulationParameters,
  restoreDefaultSimulationParameters,
  getDefaultSimulationParameters,
} from "../../logic/wireManager.js";
import i18n from "../../i18n/index.js";
import { showToast, showConfirm } from "../../components/feedback.js";
import { getJSON, setJSON, remove } from "../../services/storage.js";
import { loadUserCustomWires, saveUserCustomWires } from "./wiresStore.js";

// 全局变量，用于存储当前表格显示的数据和初始快照
let currentDisplayData = [];
let initialDataSnapshot = [];

// 用于存储当前重复的线规值 (存储的是 gauge 字符串)
let duplicateGaugeValues = new Set();

// 初始化标准线规映射和datalist
const standardGaugeMap = {};
standardWiresData.forEach((item) => {
  standardGaugeMap[parseFloat(item.gauge).toFixed(2)] = item;
});
const standardGaugeList = standardWiresData.map((item) =>
  parseFloat(item.gauge).toFixed(2),
);
if (!document.getElementById("gauge-list")) {
  let datalist = document.createElement("datalist");
  datalist.id = "gauge-list";
  standardGaugeList.forEach((g) => {
    let opt = document.createElement("option");
    opt.value = g;
    datalist.appendChild(opt);
  });
  document.body.appendChild(datalist);
}

// 配置页统一使用 wireManager 与 wiresStore 作为数据来源与存储层

// 已统一到 wiresStore 和 services/storage 的读写方式，移除旧的本地读取函数

// 深拷贝函数，用于创建数据副本
function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}

// 辅助函数：检查并更新重复的线规
function updateDuplicateGaugeState() {
  duplicateGaugeValues.clear();
  const gaugeCounts = new Map(); // key: gauge 字符串, value: count
  currentDisplayData.forEach((wire) => {
    const gaugeStr = String(wire.gauge).trim();
    if (gaugeStr !== "") {
      gaugeCounts.set(gaugeStr, (gaugeCounts.get(gaugeStr) || 0) + 1);
    }
  });
  for (const [gaugeStr, count] of gaugeCounts) {
    if (count > 1) {
      duplicateGaugeValues.add(gaugeStr);
    }
  }
}

// 合并标准库和自定义内容，返回合并后的数组
// 已改为直接使用 getEffectiveStandardWires，移除中转函数

// 只保存与标准库不同或新增的自定义条目
function getUserCustomWires() {
  const stdMap = {};
  standardWiresData.forEach((item) => {
    const key = String(item.gauge).trim();
    if (key) stdMap[key] = { ...item };
  });

  return currentDisplayData.filter((item) => {
    const key = String(item.gauge).trim();
    if (!key) return false; // 忽略空的 gauge
    const std = stdMap[key];
    // 如果标准库中不存在，或者任一外径值不同，则视为自定义
    return (
      !std ||
      std.thin !== item.thin ||
      std.thick !== item.thick ||
      std.ultraThin !== item.ultraThin
    );
  });
}

// 获取自定义内容（使用统一存储访问层）
// 统一通过 wiresStore.loadUserCustomWires 访问，移除此函数

/**
 * 渲染“配置”页面，绑定表格与模拟参数区的逻辑与事件。
 * @param {HTMLElement} container - 页面容器根元素。
 */
export function renderConfigPage(container) {
  container.innerHTML = `
    <div class="page-config">
      <div class="layout-left">
        <!-- 左侧：自定义标准导线配置区 -->
        <div class="group-config-table" id="group-config-table">
          <div class="group-title">
            <div class="title-container"><span class="emoji">⚙️</span><span data-i18n="config_standard_wires_title">自定义标准导线</span></div>
            <div class="group-actions">
              <button class="calc-table-btn" id="add-new-wire-btn-cfg"><span class="emoji">✨</span><span class="text" data-i18n="config_standard_wires_button_add_new">新增</span></button>
              <button class="calc-table-btn" id="save-config-btn-cfg"><span class="emoji">💾</span><span class="text" data-i18n="config_standard_wires_button_save">保存</span></button>
              <button class="calc-table-btn btn-danger" id="restore-defaults-btn-cfg"><span class="emoji">🔄</span><span class="text" data-i18n="config_standard_wires_button_restore_defaults">恢复默认</span></button>
            </div>
          </div>
          <div class="calc-table-content" id="config-table-content">
            <div id="config-table-header-wrapper">
              <table id="main-data-table-config" class="main-data-table calc-table calc-table-fixed">
                <thead>
                  <tr>
                    <th data-i18n="config_standard_wires_table_header_number">序号</th>
                    <th data-i18n="config_standard_wires_table_header_gauge">线规 (mm²)</th>
                    <th data-i18n="config_standard_wires_table_header_thin">Thin</th>
                    <th data-i18n="config_standard_wires_table_header_thick">Thick</th>
                    <th data-i18n="config_standard_wires_table_header_ultra_thin">UltraThin</th>
                    <th data-i18n="config_standard_wires_table_header_operations">操作</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div id="actual-table-display-area">
              <table id="main-data-table-config-body" class="main-data-table calc-table calc-table-fixed">
                <tbody>
                  <tr>
                    <td colspan="6" style="text-align:center;padding:20px;" data-i18n="config_standard_wires_table_loading">正在加载配置...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="layout-right">
        <!-- 右侧：模拟参数配置区域 -->
        <div class="group-simulation-params" id="layout-simulation-params">
          <div class="group-title">
            <div class="title-container"><span class="emoji">🎮</span><span data-i18n="config_simulation_params_title">模拟参数配置</span></div>
            <div class="group-actions">
              <button class="calc-table-btn" id="save-sim-params-btn"><span class="emoji">💾</span><span class="text" data-i18n="config_simulation_params_button_save">保存</span></button>
              <button class="calc-table-btn btn-danger" id="restore-sim-params-btn"><span class="emoji">🔄</span><span class="text" data-i18n="config_simulation_params_button_restore_defaults">恢复默认</span></button>
            </div>
          </div>
          <div class="simulation-params-content">
            <!-- PI 参数配置 -->
            <div class="param-group">
              <div class="param-header">
                <div class="param-title" data-i18n="config_simulation_params_params_pi_title">π (PI)</div>
                <button class="param-reset-btn" data-param="pi" data-i18n-title="config.simulation_params.reset_button_title" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description" data-i18n="config_simulation_params_params_pi_description">
                圆周率常数，用于计算圆形面积和周长。通常使用3.1415926，除非有特殊需求，建议保持默认值。
              </div>
              <div class="drag-area-content">
                <input type="range" id="pi-range" class="drag-area-range" min="3.14" max="3.15" step="0.0001" value="3.1415926">
                <div class="input-with-unit-wrapper">
                  <input type="text" id="pi-input" class="drag-area-input" value="3.1415926">
                </div>
              </div>
            </div>

            <!-- SNG_R2_TO_R1 参数配置 -->
            <div class="param-group">
              <div class="param-header">
                <div class="param-title" data-i18n="config_simulation_params_params_r2r1_title">容器半径比 (R2/R1)</div>
                <button class="param-reset-btn" data-param="r2r1" data-i18n-title="config.simulation_params.reset_button_title" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description" data-i18n="config_simulation_params_params_r2r1_description">
                外部容器半径与内部填充区域半径的比率。值越大，预留空间越多，但可能影响填充效率。默认值1.01通常能平衡空间利用和计算效率。
              </div>
              <div class="drag-area-content">
                <input type="range" id="r2r1-range" class="drag-area-range" min="1" max="1.1" step="0.001" value="1.01">
                <div class="input-with-unit-wrapper">
                  <input type="text" id="r2r1-input" class="drag-area-input" value="1.01">
                </div>
              </div>
            </div>

            <!-- ACCELERATION 参数配置 -->
            <div class="param-group">
              <div class="param-header">
                <div class="param-title" data-i18n="config_simulation_params_params_acceleration_title">加速系数</div>
                <button class="param-reset-btn" data-param="accel" data-i18n-title="config.simulation_params.reset_button_title" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description" data-i18n="config_simulation_params_params_acceleration_description">
                圆形每步互相推开的强度系数。较大的值可以加快收敛速度，但可能导致不稳定；较小的值收敛更稳定但计算较慢。默认值1.7在速度和稳定性之间取得平衡。
              </div>
              <div class="drag-area-content">
                <input type="range" id="accel-range" class="drag-area-range" min="1" max="3" step="0.1" value="1.7">
                <div class="input-with-unit-wrapper">
                  <input type="text" id="accel-input" class="drag-area-input" value="1.7">
                </div>
              </div>
            </div>

            <!-- WEIGHT_FACTOR 参数配置 -->
            <div class="param-group">
              <div class="param-header">
                <div class="param-title" data-i18n="config_simulation_params_params_weight_factor_title">质量因子</div>
                <button class="param-reset-btn" data-param="weight" data-i18n-title="config.simulation_params.reset_button_title" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description" data-i18n="config_simulation_params_params_weight_factor_description">
                质量计算的指数(r^WF)，影响大圆推小圆的程度。较大的值会使大直径导线的影响更显著，较小的值则使各导线影响更均匀。默认值2.0适用于大多数情况。
              </div>
              <div class="drag-area-content">
                <input type="range" id="weight-range" class="drag-area-range" min="1" max="5" step="0.1" value="2">
                <div class="input-with-unit-wrapper">
                  <input type="text" id="weight-input" class="drag-area-input" value="2">
                </div>
              </div>
            </div>

            <!-- CONVERGENCE_THRESHOLD 参数配置 -->
            <div class="param-group">
              <div class="param-header">
                <div class="param-title" data-i18n="config_simulation_params_params_convergence_threshold_title">收敛阈值</div>
                <button class="param-reset-btn" data-param="conv" data-i18n-title="config.simulation_params.reset_button_title" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description" data-i18n="config_simulation_params_params_convergence_threshold_description">
                收敛判定阈值，表示平均穿透深度与半径的比值。值越小要求精度越高但计算时间更长，值越大计算更快但精度较低。默认值0.001在精度和速度间取得良好平衡。
              </div>
              <div class="drag-area-content">
                <input type="range" id="conv-range" class="drag-area-range" min="0.0001" max="0.01" step="0.0001" value="0.001">
                <div class="input-with-unit-wrapper">
                  <input type="text" id="conv-input" class="drag-area-input" value="0.001">
                </div>
              </div>
            </div>

            <!-- MAX_ITERATIONS_RUNPACKING 参数配置 -->
            <div class="param-group">
              <div class="param-header">
                <div class="param-title" data-i18n="config_simulation_params_params_max_iterations_run_title">主循环最大迭代次数</div>
                <button class="param-reset-btn" data-param="max-iter-run" data-i18n-title="config.simulation_params.reset_button_title" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description" data-i18n="config_simulation_params_params_max_iterations_run_description">
                主填充循环的安全中断迭代次数。如果超过此次数仍未收敛，将终止计算。较大的值可以处理更复杂的情况，但可能增加计算时间。默认值500适用于大多数情况。
              </div>
              <div class="drag-area-content">
                <input type="range" id="max-iter-run-range" class="drag-area-range" min="100" max="1000" step="10" value="500">
                <div class="input-with-unit-wrapper">
                  <input type="text" id="max-iter-run-input" class="drag-area-input" value="500">
                </div>
              </div>
            </div>

            <!-- MAX_ITERATIONS_PACKSTEP 参数配置 -->
            <div class="param-group">
              <div class="param-header">
                <div class="param-title" data-i18n="config_simulation_params_params_max_iterations_step_title">单步最大迭代次数</div>
                <button class="param-reset-btn" data-param="max-iter-step" data-i18n-title="config.simulation_params.reset_button_title" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description" data-i18n="config_simulation_params_params_max_iterations_step_description">
                每个主循环步骤中，在调整容器大小之前的最大迭代次数。较大的值可以提高每步的精度，但会增加计算时间。默认值15通常能满足精度要求。
              </div>
              <div class="drag-area-content">
                <input type="range" id="max-iter-step-range" class="drag-area-range" min="5" max="30" step="1" value="15">
                <div class="input-with-unit-wrapper">
                  <input type="text" id="max-iter-step-input" class="drag-area-input" value="15">
                </div>
              </div>
            </div>

            <!-- CONTAINER_ADJUST_FACTOR 参数配置 -->
            <div class="param-group">
              <div class="param-header">
                <div class="param-title" data-i18n="config_simulation_params_params_container_adjust_title">容器调整系数</div>
                <button class="param-reset-btn" data-param="container-adjust" data-i18n-title="config.simulation_params.reset_button_title" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description" data-i18n="config_simulation_params_params_container_adjust_description">
                根据穿透情况调整容器大小的幅度。较大的值调整更激进可能导致不稳定，较小的值调整更平缓但收敛较慢。默认值0.05提供了稳定性和收敛速度的良好平衡。
              </div>
              <div class="drag-area-content">
                <input type="range" id="container-adjust-range" class="drag-area-range" min="0.01" max="0.2" step="0.01" value="0.05">
                <div class="input-with-unit-wrapper">
                  <input type="text" id="container-adjust-input" class="drag-area-input" value="0.05">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="config-bottom-bar">
      <div class="history-save-option">
        <!-- 占位元素-->
      </div>
      <button class="action-bar-btn" id="import-config-btn-cfg"><span class="emoji">📥</span><span class="text" data-i18n="config_standard_wires_button_import">导入配置</span></button>
      <button class="action-bar-btn" id="export-config-btn-cfg"><span class="emoji">📤</span><span class="text" data-i18n="config_standard_wires_button_export">导出配置</span></button>
    </div>
  `;

  // 更新样式
  const styleSheet = document.createElement("style");
  styleSheet.id = "config-page-styles";
  styleSheet.textContent = `
    .page-config {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding: 0;
      min-width: 0;
      background: transparent;
      border-radius: 0;
      box-shadow: none;
      height: calc(100vh - 40px);
      height: auto;
      padding-bottom: 80px; /* 为底部操作栏留出空间 */
    }

    .layout-left, .layout-right {
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    .layout-left {
      flex: 1 1 520px;
      min-width: 0;
    }

    .layout-right {
      flex: 1 1 360px;
      min-width: 0;
    }

    .group-config-table, .group-simulation-params {
      margin-bottom: 0;
      padding: 16px 18px;
      border-bottom: none;
      background: #FFFFFF;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
    }

    .calc-table-content {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      margin-top: 16px;
    }

    #actual-table-display-area {
      max-height: min(60vh, 750px);
      overflow-y: auto;
      margin-top: -1px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }

    .simulation-params-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      overflow-y: auto;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      max-height: min(60vh, 800px);
    }

    .group-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 15px;
      font-weight: 600;
      color: #495057;
      letter-spacing: normal;
    }

    .group-actions {
      display: flex;
      gap: 8px;
    }

    .param-group {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      background: #FFFFFF;
      border-radius: 6px;
      padding: 8px 12px;
      box-shadow: none;
      border: 1px solid #EAECEF;
    }

    .param-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .param-title {
      font-size: 14px;
      font-weight: 500;
      color: #495057;
    }

    .param-description {
      font-size: 12px;
      color: #6C757D;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .drag-area-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .drag-area-range {
      flex: 1;
      margin: 0;
      vertical-align: middle;
      height: 32px;
      accent-color: #3A86FF;
      background: transparent;
      cursor: pointer;
    }

    .drag-area-input {
      width: 65px;
      height: 32px;
      text-align: center;
      border-radius: 4px;
      border: 1px solid #CED4DA;
      vertical-align: middle;
      box-sizing: border-box;
      font-size: 14px;
      color: #495057;
      flex-shrink: 0;
      background: #FFFFFF;
    }

    .input-with-unit-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .param-reset-btn {
      padding: 4px 8px;
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
      border-radius: 4px;
      font-size: 14px;
    }

    .param-reset-btn:hover {
      opacity: 1;
      background: var(--color-bg-subtle);
    }

    /* 美化滑块样式 */
    .drag-area-range {
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      cursor: pointer;
      position: relative;
    }

    .drag-area-range::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 4px;
      background: #DEE2E6;
      border-radius: 2px;
      transform: translateY(-50%);
    }

    .drag-area-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #3A86FF;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      position: relative;
      z-index: 1;
      transition: all 0.2s;
    }

    .drag-area-range::-webkit-slider-thumb:hover {
      background: #2563EB;
      transform: scale(1.1);
    }

    .drag-area-range:focus {
      outline: none;
    }

    .drag-area-range:focus::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px rgba(58, 134, 255, 0.2);
    }

    .drag-area-input {
      padding: 6px 10px;
      border: 1px solid #CED4DA;
      border-radius: 4px;
      font-size: 14px;
      text-align: right;
      transition: all 0.2s;
    }

    .drag-area-input:hover {
      border-color: #ADB5BD;
    }

    .drag-area-input:focus {
      border-color: #3A86FF;
      outline: none;
      box-shadow: 0 0 0 2px rgba(58, 134, 255, 0.2);
    }

    /* 移除数字输入框的上下箭头 */
    .drag-area-input::-webkit-outer-spin-button,
    .drag-area-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .drag-area-input {
      -moz-appearance: textfield;
    }

    /* 滚动条样式 */
    .simulation-params-content::-webkit-scrollbar {
      width: 8px;
    }

    .simulation-params-content::-webkit-scrollbar-track {
      background: var(--color-bg-subtle);
      border-radius: 4px;
      margin: 4px;
    }

    .simulation-params-content::-webkit-scrollbar-thumb {
      background: var(--color-border-default);
      border-radius: 4px;
      border: 2px solid var(--color-bg-subtle);
    }

    .simulation-params-content::-webkit-scrollbar-thumb:hover {
      background: var(--color-border-muted);
    }

    /* 底部操作栏 */
    .config-bottom-bar {
      position: fixed;
      bottom: 0;
      display: flex;
      justify-content: flex-end; /* 改为flex-end，使按钮靠右对齐 */
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      background-color: #FFFFFF;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
      z-index: 10;
      box-sizing: border-box;
      height: 72px;
      transition: left 0.3s ease, width 0.3s ease;
      left: var(--sidebar-width);
      width: calc(100% - var(--sidebar-width));
    }

    .main-container.sidebar-collapsed .config-bottom-bar {
      left: var(--sidebar-collapsed-width);
      width: calc(100% - var(--sidebar-collapsed-width));
    }

    .config-bottom-bar .action-bar-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid #CED4DA;
      background: #FFFFFF;
      color: #495057;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .config-bottom-bar .action-bar-btn:hover {
      background: #F8F9FA;
      border-color: #ADB5BD;
    }

    .config-bottom-bar .action-bar-btn:active {
      background: #E9ECEF;
      transform: translateY(1px);
    }

    /* 响应式布局调整 */
    @media (max-width: 1100px) {
      .page-config {
        flex-direction: column;
        gap: 16px;
        min-width: 0;
        height: auto;
        padding-bottom: 100px;
      }

      .layout-left, .layout-right {
        width: 100%;
        min-width: 0;
      }

      #actual-table-display-area {
        max-height: min(50vh, 500px);
      }

      .simulation-params-content {
        max-height: min(50vh, 600px);
      }
      
      .config-bottom-bar {
        left: 0;
        width: 100%;
      }
    }
  `;
  document.head.appendChild(styleSheet);

  const tableContainer = container.querySelector("#group-config-table");
  const tableDisplayArea = container.querySelector(
    "#actual-table-display-area",
  );
  const actionsContainer = tableContainer.querySelector(".group-actions");
  const addNewWireBtn = actionsContainer.querySelector("#add-new-wire-btn-cfg");
  const saveBtn = actionsContainer.querySelector("#save-config-btn-cfg");
  const restoreDefaultsBtn = actionsContainer.querySelector(
    "#restore-defaults-btn-cfg",
  );

  // --- 核心渲染和状态管理函数 ---
  function renderTable() {
    updateDuplicateGaugeState();
    const tableBody = document.querySelector(
      "#actual-table-display-area table tbody",
    );
    if (!tableBody) return;
    tableBody.innerHTML = "";
    if (currentDisplayData.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.style.textAlign = "center";
      td.style.padding = "20px";
      td.textContent = i18n.getMessage("config_standard_wires_table_no_data");
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }
    // 获取所有线规（标准库+自定义合并）
    const allGauges = getEffectiveStandardWires().map((w) =>
      String(w.gauge).trim(),
    );
    currentDisplayData.forEach((wireData, index) => {
      const tr = document.createElement("tr");
      // 序号单元格
      const thIndex = tr.insertCell();
      thIndex.textContent = index + 1;
      // 线规单元格（仅输入框，自动匹配参数）
      const gaugeTd = tr.insertCell();
      const gaugeInput = document.createElement("input");
      gaugeInput.type = "text";
      gaugeInput.className = "config-input";
      gaugeInput.dataset.index = index;
      gaugeInput.dataset.field = "gauge";
      gaugeInput.placeholder = i18n.getMessage(
        "config_input_placeholder_gauge",
      );
      let displayValue = "";
      const gaugeModelValue = wireData.gauge;
      if (gaugeModelValue !== null && gaugeModelValue !== undefined) {
        displayValue = String(gaugeModelValue);
      }
      gaugeInput.value = displayValue;
      gaugeInput.classList.remove("input-error");
      if (
        displayValue.trim() !== "" &&
        duplicateGaugeValues.has(displayValue.trim())
      ) {
        gaugeInput.classList.add("input-error");
      }
      // 输入时自动匹配参数
      gaugeInput.addEventListener("input", (e) => {
        const value = e.target.value;
        currentDisplayData[index].gauge = value;
        updateDuplicateGaugeState();
      });
      gaugeInput.addEventListener("blur", (e) => {
        const value = e.target.value;
        // 匹配标准库或自定义库
        const match = getEffectiveStandardWires().find(
          (w) => String(w.gauge).trim() === value.trim(),
        );
        if (match) {
          currentDisplayData[index].thin = match.thin;
          currentDisplayData[index].thick = match.thick;
          currentDisplayData[index].ultraThin = match.ultraThin;
        }
        handleInputBlurFormatValidation(e);
      });
      gaugeInput.addEventListener(
        "keydown",
        handleInputKeydownFormatValidation,
      );
      gaugeTd.appendChild(gaugeInput);
      // OD 单元格
      ["thin", "thick", "ultraThin"].forEach((type) => {
        const td = tr.insertCell();
        const input = document.createElement("input");
        input.type = "number";
        input.step = "any";
        input.min = "0";
        input.dataset.index = index;
        input.dataset.field = type;
        input.className = "config-input";
        // 根据类型设置不同的placeholder
        if (type === "thin") {
          input.placeholder = i18n.getMessage("config_input_placeholder_thin");
        } else if (type === "thick") {
          input.placeholder = i18n.getMessage("config_input_placeholder_thick");
        } else if (type === "ultraThin") {
          input.placeholder = i18n.getMessage(
            "config_input_placeholder_ultrathin",
          );
        }
        const value = wireData[type];
        let odDisplayValue = "";
        if (value !== null && value !== undefined) {
          odDisplayValue = String(value);
          if (
            document.activeElement !== input &&
            !isNaN(parseFloat(odDisplayValue))
          ) {
            odDisplayValue = parseFloat(odDisplayValue).toFixed(2);
          }
        }
        input.value = odDisplayValue;
        input.addEventListener("input", handleInputChange);
        input.addEventListener("blur", handleInputBlurFormatValidation);
        input.addEventListener("keydown", handleInputKeydownFormatValidation);
        td.appendChild(input);
      });
      // 操作单元格
      const actionTd = tr.insertCell();
      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = "❌";
      deleteBtn.className = "calc-table-btn btn-danger btn-small";
      deleteBtn.dataset.index = index;
      deleteBtn.addEventListener("click", handleDeleteRow);
      deleteBtn.title = i18n.getMessage(
        "config_standard_wires_table_delete_row",
      );
      actionTd.appendChild(deleteBtn);
      tableBody.appendChild(tr);
    });
    // 滚动条宽度调整逻辑
    const bodyWrapper = document.querySelector("#actual-table-display-area");
    const headerWrapper = document.querySelector(
      "#config-table-header-wrapper",
    );
    if (bodyWrapper && headerWrapper) {
      const scrollbarWidth = bodyWrapper.offsetWidth - bodyWrapper.clientWidth;
      headerWrapper.style.paddingRight =
        scrollbarWidth > 0 ? `${scrollbarWidth}px` : "0px";
    }
    // 重新附加事件监听器
    attachEventListenersToTable();
  }

  // 处理输入框失焦和回车事件的函数
  function handleInputBlurFormatValidation(event) {
    const inputElement = event.target;
    const index = parseInt(inputElement.dataset.index);
    const field = inputElement.dataset.field;
    let valueStr = String(inputElement.value).trim();
    if (field === "gauge") {
      if (valueStr === "") {
        currentDisplayData[index][field] = null;
        inputElement.value = "";
      } else {
        currentDisplayData[index][field] = valueStr;
        inputElement.value = valueStr;
      }
    } else {
      if (valueStr === "") {
        currentDisplayData[index][field] = null;
        inputElement.value = "";
      } else if (!isNaN(parseFloat(valueStr))) {
        const numericValue = parseFloat(valueStr);
        if (numericValue < 0) {
          currentDisplayData[index][field] = numericValue;
        } else {
          currentDisplayData[index][field] = numericValue;
          inputElement.value = numericValue.toFixed(2);
        }
      } else {
        // 非数字字符串已由 handleInputChange 存入 currentDisplayData[index][field]
      }
    }
    updateDuplicateGaugeState();
    renderTable();
  }

  function handleInputKeydownFormatValidation(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleInputBlurFormatValidation(event);
    }
  }

  function handleInputChange(event) {
    const inputElement = event.target;
    const index = parseInt(inputElement.dataset.index);
    const field = inputElement.dataset.field;
    currentDisplayData[index][field] = inputElement.value; // 直接用输入框的原始值更新模型
    // 实时检查重复并在输入时高亮 (如果需要此行为，取消注释下一行，但可能导致性能问题或输入体验不佳)
    // updateDuplicateGaugeState(); renderTable();
  }

  function handleDeleteRow(event) {
    const index = parseInt(event.currentTarget.dataset.index);
    // 对于"恢复默认"前的删除，我们不需要确认，因为更改只有在保存后才持久化。
    // 如果希望保留确认，可以取消下面的注释
    // if (confirm(`您确定要删除第 ${index + 1} 行的导线配置吗？此操作在保存前可撤销（通过不保存或未来可能的重置）。`)) {
    currentDisplayData.splice(index, 1);
    updateDuplicateGaugeState(); // 删除后需要重新检查重复情况
    renderTable(); // 重新渲染表格以反映删除和更新索引
    // }
  }

  function loadInitialData() {
    // 配置界面只显示自定义内容
    const userCustom = loadUserCustomWires();
    currentDisplayData = deepClone(userCustom);
    initialDataSnapshot = deepClone(currentDisplayData);
    updateDuplicateGaugeState();
    renderTable();
  }

  // --- 按钮事件监听器 ---
  addNewWireBtn.addEventListener("click", () => {
    // 新增的参数放在最上方
    currentDisplayData.unshift({
      gauge: null,
      thin: null,
      thick: null,
      ultraThin: null,
    });
    updateDuplicateGaugeState(); // 新增行可能导致重复状态改变
    renderTable();
    const tableRows = tableContainer.querySelectorAll("table tbody tr");
    if (tableRows.length > 0) {
      const firstRow = tableRows[0]; // 聚焦到第一行
      // 优先聚焦到 select，如果是自定义则聚焦 input
      const firstSelect = firstRow.querySelector(
        'select.config-input[data-field="gauge"]',
      );
      if (firstSelect) {
        firstSelect.focus();
      } else {
        const firstInput = firstRow.querySelector(
          'input.config-input[data-field="gauge"]',
        );
        firstInput?.focus();
      }
      // firstRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // 新增在顶部，通常不需要滚动
    }
  });

  saveBtn.addEventListener("click", async () => {
    // 1. 初步格式化处理所有当前行的数据模型
    currentDisplayData.forEach((wire, index) => {
      // 线规格式化
      if (wire.gauge !== null && wire.gauge !== undefined) {
        const gaugeStr = String(wire.gauge).trim();
        if (gaugeStr === "") {
          currentDisplayData[index].gauge = null; // 空字符串存为 null
        } else {
          currentDisplayData[index].gauge = gaugeStr;
        }
      }
      // OD 值格式化
      ["thin", "thick", "ultraThin"].forEach((type) => {
        const odVal = wire[type];
        if (odVal !== null && odVal !== undefined) {
          const odStr = String(odVal).trim();
          if (odStr === "") {
            currentDisplayData[index][type] = null;
          } else if (!isNaN(parseFloat(odStr))) {
            currentDisplayData[index][type] = parseFloat(odStr);
          } else {
            currentDisplayData[index][type] = odStr; // 保留无效字符串
          }
        }
      });
    });

    // 保存过滤前的原始数据，用于后续"保存空列表?"的确认逻辑
    const originalDataBeforeFiltering = deepClone(currentDisplayData);

    // 2. 过滤掉线规为空白或无效的行
    currentDisplayData = currentDisplayData.filter((wire) => {
      const gaugeVal = wire.gauge;
      return !(gaugeVal === null || String(gaugeVal).trim() === "");
    });

    // 3. 更新重复状态并重新渲染表格
    updateDuplicateGaugeState();
    renderTable();

    // 4. 在过滤后检查重复的线规值
    if (duplicateGaugeValues.size > 0) {
      showToast(i18n.getMessage("config_standard_wires_message_duplicate_gauge_error"), "error");
      return; // 终止保存
    }

    // 5. 处理"保存空列表"的情况
    // 检查是否所有最初有线规输入的行（即使无效）都已被移除
    const hadPotentiallyValidGaugesInput = originalDataBeforeFiltering.some(
      (w) => w.gauge !== null && String(w.gauge).trim() !== "",
    );

    if (currentDisplayData.length === 0 && hadPotentiallyValidGaugesInput) {
      const ok = await showConfirm(
        i18n.getMessage("config_standard_wires_message_confirm_save_empty")
      );
      if (ok) {
        // 用户确认保存空列表，currentDisplayData 已为空，后续逻辑将保存空数组
      } else {
        showToast(i18n.getMessage("config_standard_wires_message_save_cancelled"), "info");
        // 恢复原始数据，以便用户可以编辑被过滤掉的行
        currentDisplayData = originalDataBeforeFiltering;
        updateDuplicateGaugeState(); // 基于原始数据重新检查重复状态
        renderTable(); // 重新渲染以显示原始行
        return; // 终止保存过程
      }
    }
    // 如果 currentDisplayData 为空，并且开始时就没有有效的线规输入（例如用户手动删除了所有行），
    // 则无需确认即可保存空数组。

    // 6. 准备数据进行最终校验和保存
    let dataToSave = deepClone(currentDisplayData); // currentDisplayData 此刻已是过滤后的数据
    let isValid = true;

    for (let i = 0; i < dataToSave.length; i++) {
      const wire = dataToSave[i];
      const displayIndex = i + 1; // 用于用户提示的序号，基于当前过滤后的表格

      // OD 值校验
      ["thin", "thick", "ultraThin"].forEach((type) => {
        const odVal = wire[type];
        if (odVal !== null && String(odVal).trim() !== "") {
          // 如果OD值不为空
          let odNum = parseFloat(String(odVal));
          if (isNaN(odNum) || odNum < 0) {
            showToast(
              i18n.getMessage(
                "config_standard_wires_message_invalid_od_error",
                { index: displayIndex, gauge: wire.gauge, type: type },
              ),
              "error"
            );
            isValid = false;
          } else {
            wire[type] = parseFloat(odNum.toFixed(2)); // 格式化有效的OD值
          }
        } else {
          wire[type] = null; // 如果为空或仅有空白，则设为null
        }
      });
      if (!isValid) break;
    }

    if (!isValid) {
      // 此时错误信息已通过alert提示用户
      // 由于当前的校验错误（正数、OD有效性）没有特定的UI高亮，
      // 无需再次调用 renderTable()。
      return; // 终止保存
    }

    // 7. 最终的重复项检查 (作为dataToSave的保障措施)
    const finalGaugeSet = new Set();
    for (const wire of dataToSave) {
      const gaugeKey = String(wire.gauge).trim();
      if (finalGaugeSet.has(gaugeKey)) {
        showToast(i18n.getMessage("config_standard_wires_message_internal_error", { gauge: wire.gauge }), "error");
        isValid = false;
        return; // 终止保存
      }
      finalGaugeSet.add(gaugeKey);
    }

    if (!isValid) {
      // 如果最终的保障性重复检查失败
      return;
    }

    // 8. 保存到存储层
    try {
      // 只保存与标准库不同或新增的自定义条目
      saveUserCustomWires(
        getUserCustomWires(),
      );
      currentDisplayData = deepClone(getUserCustomWires()); // 保存后只显示自定义内容
      initialDataSnapshot = deepClone(currentDisplayData);
      showToast(i18n.getMessage("config_standard_wires_message_saved"), "success");
      updateDuplicateGaugeState();
      renderTable();
    } catch (error) {
      console.error("保存配置到存储层失败:", error);
      showToast(i18n.getMessage("config_standard_wires_message_save_fail", { error: error.message }), "error");
    }
  });

  restoreDefaultsBtn.addEventListener("click", async () => {
    const ok = await showConfirm(i18n.getMessage("config_standard_wires_message_confirm_restore"));
    if (ok) {
      try {
        remove("userDefinedStandardWires");
        currentDisplayData = [];
        initialDataSnapshot = [];
        updateDuplicateGaugeState();
        renderTable();
      } catch (error) {
        console.error("恢复默认配置失败:", error);
        showToast(i18n.getMessage("config_standard_wires_message_restore_fail", { error: error.message }), "error");
      }
    }
  });

  // --- 初始加载 ---
  loadInitialData();

  // 加载初始数据
  loadSimulationParams();

  // 重新附加所有事件监听器
  attachEventListenersToTable();

  // 更新国际化文本
  i18n.updatePageTexts();

  // 添加导入导出功能
  const importConfigBtn = container.querySelector("#import-config-btn-cfg");
  const exportConfigBtn = container.querySelector("#export-config-btn-cfg");

  if (importConfigBtn) {
    importConfigBtn.addEventListener("click", handleImportConfig);
  }

  if (exportConfigBtn) {
    exportConfigBtn.addEventListener("click", handleExportConfig);
  }
}

// 导入配置功能
function handleImportConfig() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const configData = JSON.parse(event.target.result);

        // 验证配置数据格式
        if (!configData.customWires || !Array.isArray(configData.customWires)) {
          showToast(i18n.getMessage("config_import_invalid_format"), "error");
          return;
        }

        // 获取当前页面中的相关元素
        const tableContainer = document.querySelector("#group-config-table");
        const tableDisplayArea = document.querySelector(
          "#actual-table-display-area",
        );

        // 更新当前显示数据
        currentDisplayData = configData.customWires;
        initialDataSnapshot = deepClone(currentDisplayData);
        updateDuplicateGaugeState();
        renderTable();

        // 如果有模拟参数，也一并导入
        if (configData.simulationParameters) {
          saveSimulationParameters(configData.simulationParameters);
          loadSimulationParams();
        }

        showToast(i18n.getMessage("config_import_success"), "success");
      } catch (error) {
        console.error("导入配置失败:", error);
        showToast(i18n.getMessage("config_import_error", { error: error.message }), "error");
      }
    };
    reader.readAsText(file);
  };

  input.click();
}

// 导出配置功能
function handleExportConfig() {
  try {
    // 获取当前自定义导线数据
    const customWires = getUserCustomWires();

    // 获取当前模拟参数
    const simulationParams = getSimulationParameters();

    // 构建导出数据
    const exportData = {
      version: "1.0",
      exportTime: new Date().toISOString(),
      customWires: customWires,
      simulationParameters: simulationParams,
    };

    // 创建并下载文件
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `wire-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("导出配置失败:", error);
    showToast(i18n.getMessage("config_export_error", { error: error.message }), "error");
  }
}

// --- 模拟参数区逻辑 ---

// UI元素名到逻辑参数名的映射
const PARAM_MAPPING = {
  pi: "PI",
  r2r1: "SNG_R2_TO_R1",
  accel: "ACCELERATION",
  weight: "WEIGHT_FACTOR",
  conv: "STOP_THRESHOLD",
  "max-iter-run": "MAX_STEPS",
  "max-iter-step": "MAX_ITER_STEP",
  "container-adjust": "CONTAINER_ADJUST_FACTOR",
};

// 加载当前模拟参数并更新UI
function loadSimulationParams() {
  const params = getSimulationParameters();

  for (const [uiName, logicName] of Object.entries(PARAM_MAPPING)) {
    const rangeEl = document.getElementById(`${uiName}-range`);
    const inputEl = document.getElementById(`${uiName}-input`);
    const value = params[logicName];

    if (value !== undefined) {
      if (rangeEl) {
        rangeEl.value = value;
      }
      if (inputEl) {
        inputEl.value = value;
      }
    }
  }
}

// 保存当前模拟参数
function saveSimulationParams() {
  const paramsToSave = getSimulationParameters(); // 先获取现有所有参数，以保留那些不在UI上的参数

  for (const [uiName, logicName] of Object.entries(PARAM_MAPPING)) {
    const inputEl = document.getElementById(`${uiName}-input`);
    if (inputEl) {
      const value = parseFloat(inputEl.value);
      if (!isNaN(value)) {
        // MAX_STEPS 和 MAX_ITER_STEP 需要是整数
        if (logicName === "MAX_STEPS" || logicName === "MAX_ITER_STEP") {
          paramsToSave[logicName] = parseInt(value, 10);
        } else {
          paramsToSave[logicName] = value;
        }
      }
    }
  }
  saveSimulationParameters(paramsToSave);
  showToast(i18n.getMessage("config_simulation_params_message_saved"), "success");
}

// 恢复默认模拟参数
async function restoreDefaultParams() {
  const ok = await showConfirm(i18n.getMessage("config_simulation_params_message_confirm_restore"));
  if (ok) {
    restoreDefaultSimulationParameters();
    loadSimulationParams(); // 重新加载UI以显示默认值
    showToast(i18n.getMessage("config_simulation_params_message_restored"), "success");
  }
}

// 给单个参数重置按钮绑定事件
function attachResetButtonListener(button, paramKey) {
  button.addEventListener("click", () => {
    const defaultParams = getDefaultSimulationParameters();
    const defaultValue = defaultParams[paramKey];

    const rangeInput = button
      .closest(".param-group")
      .querySelector('input[type="range"]');
    const textInput = button
      .closest(".param-group")
      .querySelector('input[type="text"]');

    if (rangeInput) rangeInput.value = defaultValue;
    if (textInput) textInput.value = defaultValue;
  });
}

// 重新附加事件监听器
function attachEventListenersToTable() {
  const tableContainer = document.querySelector("#group-config-table");
  const tableDisplayArea = document.querySelector("#actual-table-display-area");
  const actionsContainer = tableContainer.querySelector(".group-actions");
  const addNewWireBtn = actionsContainer.querySelector("#add-new-wire-btn-cfg");
  const saveBtn = actionsContainer.querySelector("#save-config-btn-cfg");
  const restoreDefaultsBtn = actionsContainer.querySelector(
    "#restore-defaults-btn-cfg",
  );

  // 为所有滑块和输入框添加联动事件监听
  const simParamsConfig = [
    {
      name: "pi",
      title: "π (PI)",
      defaultValue: 3.1415926,
      min: 3.14,
      max: 3.15,
      step: 0.0001,
      precision: 7,
    },
    {
      name: "r2r1",
      title: "容器半径比 (R2/R1)",
      defaultValue: 1.01,
      min: 1,
      max: 1.1,
      step: 0.001,
      precision: 3,
    },
    {
      name: "accel",
      title: "加速系数",
      defaultValue: 1.7,
      min: 1,
      max: 3,
      step: 0.1,
      precision: 1,
    },
    {
      name: "weight",
      title: "质量因子",
      defaultValue: 2,
      min: 1,
      max: 5,
      step: 0.1,
      precision: 1,
    },
    {
      name: "conv",
      title: "收敛阈值",
      defaultValue: 0.001,
      min: 0.0001,
      max: 0.01,
      step: 0.0001,
      precision: 4,
    },
    {
      name: "max-iter-run",
      title: "主循环最大迭代次数",
      defaultValue: 500,
      min: 100,
      max: 1000,
      step: 10,
      precision: 0,
    },
    {
      name: "max-iter-step",
      title: "单步最大迭代次数",
      defaultValue: 15,
      min: 5,
      max: 30,
      step: 1,
      precision: 0,
    },
    {
      name: "container-adjust",
      title: "容器调整系数",
      defaultValue: 0.05,
      min: 0.01,
      max: 0.2,
      step: 0.01,
      precision: 2,
    },
  ];

  simParamsConfig.forEach((config) => {
    const range = document.getElementById(`${config.name}-range`);
    const input = document.getElementById(`${config.name}-input`);

    if (range && input) {
      // 滑块值变化时更新输入框
      range.addEventListener("input", () => {
        const value = parseFloat(range.value);
        input.value = value.toFixed(config.precision);
      });

      // 输入框值变化时更新滑块
      input.addEventListener("input", () => {
        let value = parseFloat(input.value);
        if (!isNaN(value)) {
          // 确保值在范围内
          value = Math.max(config.min, Math.min(config.max, value));
          range.value = value;
        }
      });

      // 输入框失焦时格式化数值
      input.addEventListener("blur", () => {
        let value = parseFloat(input.value);
        if (isNaN(value)) {
          value = config.defaultValue;
        }
        // 确保值在范围内
        value = Math.max(config.min, Math.min(config.max, value));
        range.value = value;
        input.value = value.toFixed(config.precision);
      });
    }
  });

  // 为每个参数的重置按钮添加事件监听
  const resetButtons = document.querySelectorAll(".param-reset-btn");
  resetButtons.forEach((btn) => {
    const paramName = btn.dataset.param;
    const config = simParamsConfig.find((c) => c.name === paramName);
    if (config) {
      btn.onclick = () => {
        const range = document.getElementById(`${paramName}-range`);
        const input = document.getElementById(`${paramName}-input`);
        if (range && input) {
          range.value = config.defaultValue;
          input.value = config.defaultValue.toFixed(config.precision);
        }
      };
    }
  });

  // 保存按钮事件监听
  const saveSimParamsBtn = document.querySelector("#save-sim-params-btn");
  if (saveSimParamsBtn) {
    saveSimParamsBtn.addEventListener("click", saveSimulationParams);
  }

  // 恢复默认按钮事件监听
  const restoreSimParamsBtn = document.querySelector("#restore-sim-params-btn");
  if (restoreSimParamsBtn) {
    restoreSimParamsBtn.addEventListener("click", restoreDefaultParams);
  }
}
