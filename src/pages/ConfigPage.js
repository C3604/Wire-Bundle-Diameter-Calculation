import { standardWiresData } from '../storage/standardWires.js';
import { 
    getEffectiveStandardWires, 
    saveCustomWireLibraries,
    getSimulationParameters,
    saveSimulationParameters,
    restoreDefaultSimulationParameters,
    getDefaultSimulationParameters
} from '../logic/wireManager.js';

// 全局变量，用于存储当前表格显示的数据和初始快照
let currentDisplayData = [];
let initialDataSnapshot = [];

// 用于存储当前重复的线规值 (存储的是 gauge 字符串)
let duplicateGaugeValues = new Set();

// 初始化标准线规映射和datalist
const standardGaugeMap = {};
standardWiresData.forEach(item => {
  standardGaugeMap[parseFloat(item.gauge).toFixed(2)] = item;
});
const standardGaugeList = standardWiresData.map(item => parseFloat(item.gauge).toFixed(2));
if (!document.getElementById('gauge-list')) {
  let datalist = document.createElement('datalist');
  datalist.id = 'gauge-list';
  standardGaugeList.forEach(g => {
    let opt = document.createElement('option');
    opt.value = g;
    datalist.appendChild(opt);
  });
  document.body.appendChild(datalist);
}

// 由于 simulationConstants.js 中的 getCurrentWireData 已经被内部使用，
// 这里我们直接使用导出的 getDefaultStandardWires 和 localStorage 来获取数据
// 或者可以重命名 simulationConstants.js 中的 getCurrentWireData 为 getActiveWireData 并导出。
// 为简单起见，我们在这里重新实现一个轻量级的 localStorage 读取，或者依赖于ConfigPage自身状态管理

function getStoredUserWires() {
    const userWiresString = localStorage.getItem('userDefinedStandardWires');
    if (userWiresString) {
        try {
            const userWires = JSON.parse(userWiresString);
            if (Array.isArray(userWires) && userWires.every(wire => wire.hasOwnProperty('gauge'))) {
                return userWires;
            }
        } catch (error) {
            console.error('从localStorage解析userDefinedStandardWires失败 (ConfigPage):', error);
            return null;
        }
    }
    return null;
}

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
        if (gaugeStr !== '') {
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
function getMergedWireList() {
    return getEffectiveStandardWires();
}

// 只保存与标准库不同或新增的自定义条目
function getUserCustomWires() {
  const stdMap = {};
  standardWiresData.forEach(item => {
    const key = String(item.gauge).trim();
    if (key) stdMap[key] = { ...item };
  });

  return currentDisplayData.filter(item => {
    const key = String(item.gauge).trim();
    if (!key) return false; // 忽略空的 gauge
    const std = stdMap[key];
    // 如果标准库中不存在，或者任一外径值不同，则视为自定义
    return !std ||
      std.thin !== item.thin ||
      std.thick !== item.thick ||
      std.ultraThin !== item.ultraThin;
  });
}

// 获取自定义内容
function getUserCustomWiresFromStorage() {
  const userWiresString = localStorage.getItem('userDefinedStandardWires');
  if (userWiresString) {
    try {
      const userWires = JSON.parse(userWiresString);
      if (Array.isArray(userWires) && userWires.every(wire => wire.hasOwnProperty('gauge'))) {
        return userWires;
      }
    } catch (error) {
      console.error('从localStorage解析userDefinedStandardWires失败:', error);
      return [];
    }
  }
  return [];
}

export function renderConfigPage(container) {
  container.innerHTML = `
    <div class="page-config">
      <div class="layout-left">
        <!-- 左侧：自定义标准导线配置区 -->
        <div class="group-config-table" id="group-config-table">
          <div class="group-title">
            <span>⚙️ 自定义标准导线</span>
            <div class="group-actions">
              <button class="calc-table-btn" id="add-new-wire-btn-cfg">✨ 新增</button>
              <button class="calc-table-btn" id="save-config-btn-cfg">💾 保存</button>
              <button class="calc-table-btn btn-danger" id="restore-defaults-btn-cfg">🔄 恢复默认</button>
            </div>
          </div>
          <div class="calc-table-content" id="config-table-content">
            <div id="config-table-header-wrapper">
              <table id="main-data-table-config" class="main-data-table calc-table calc-table-fixed">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>线规 (mm²)</th>
                    <th>Thin</th>
                    <th>Thick</th>
                    <th>UltraThin</th>
                    <th>操作</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div id="actual-table-display-area">
              <table id="main-data-table-config" class="main-data-table calc-table calc-table-fixed">
                <tbody>
                  <tr>
                    <td colspan="6" style="text-align:center;padding:20px;">正在加载配置...</td>
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
            <span>🎮 模拟参数配置</span>
            <div class="group-actions">
              <button class="calc-table-btn" id="save-sim-params-btn">💾 保存</button>
              <button class="calc-table-btn btn-danger" id="restore-sim-params-btn">🔄 恢复默认</button>
            </div>
          </div>
          <div class="simulation-params-content">
            <!-- PI 参数配置 -->
            <div class="param-group">
              <div class="param-header">
                <div class="param-title">π (PI)</div>
                <button class="param-reset-btn" data-param="pi" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description">
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
                <div class="param-title">容器半径比 (R2/R1)</div>
                <button class="param-reset-btn" data-param="r2r1" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description">
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
                <div class="param-title">加速系数</div>
                <button class="param-reset-btn" data-param="accel" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description">
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
                <div class="param-title">质量因子</div>
                <button class="param-reset-btn" data-param="weight" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description">
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
                <div class="param-title">收敛阈值</div>
                <button class="param-reset-btn" data-param="conv" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description">
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
                <div class="param-title">主循环最大迭代次数</div>
                <button class="param-reset-btn" data-param="max-iter-run" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description">
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
                <div class="param-title">单步最大迭代次数</div>
                <button class="param-reset-btn" data-param="max-iter-step" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description">
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
                <div class="param-title">容器调整系数</div>
                <button class="param-reset-btn" data-param="container-adjust" title="恢复此参数为默认值">🔄</button>
              </div>
              <div class="param-description">
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
  `;

  // 更新样式
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .page-config {
      display: flex;
      gap: 24px;
      padding: 0;
      min-width: 0;
      background: transparent;
      border-radius: 0;
      box-shadow: none;
      height: calc(100vh - 40px);
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
      flex: 6;
      min-width: 600px;
    }

    .layout-right {
      flex: 4;
      min-width: 380px;
    }

    .group-config-table, .group-simulation-params {
      margin-bottom: 0;
      padding: 16px 18px;
      border-bottom: none;
      background: #F8F9FA;
      border-radius: 8px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .calc-table-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      margin-top: 16px;
    }

    #actual-table-display-area {
      flex: 1;
      overflow-y: auto;
      margin-top: -1px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }

    .simulation-params-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      overflow-y: auto;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
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

    /* 响应式布局调整 */
    @media (max-width: 1100px) {
      .page-config {
        flex-direction: column;
        gap: 16px;
        min-width: 0;
        height: auto;
        padding-bottom: 20px;
      }

      .layout-left, .layout-right {
        width: 100%;
        min-width: 0;
      }

      #actual-table-display-area {
        max-height: 500px;
      }

      .simulation-params-content {
        max-height: 600px;
      }
    }
  `;
  document.head.appendChild(styleSheet);

  const tableContainer = container.querySelector('#group-config-table');
  const tableDisplayArea = container.querySelector('#actual-table-display-area');
  const actionsContainer = tableContainer.querySelector('.group-actions');
  const addNewWireBtn = actionsContainer.querySelector('#add-new-wire-btn-cfg');
  const saveBtn = actionsContainer.querySelector('#save-config-btn-cfg');
  const restoreDefaultsBtn = actionsContainer.querySelector('#restore-defaults-btn-cfg');

  // --- 核心渲染和状态管理函数 ---
  function renderTable() {
    updateDuplicateGaugeState();
    const tableBody = document.querySelector('#actual-table-display-area table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (currentDisplayData.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.style.textAlign = 'center';
      td.style.padding = '20px';
      td.textContent = '暂无配置数据';
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }
    // 获取所有线规（标准库+自定义合并）
    const allGauges = getEffectiveStandardWires().map(w => String(w.gauge).trim());
    currentDisplayData.forEach((wireData, index) => {
      const tr = document.createElement('tr');
      // 序号单元格
      const thIndex = tr.insertCell();
      thIndex.textContent = index + 1;
      // 线规单元格（仅输入框，自动匹配参数）
      const gaugeTd = tr.insertCell();
      const gaugeInput = document.createElement('input');
      gaugeInput.type = 'text';
      gaugeInput.className = 'config-input';
      gaugeInput.dataset.index = index;
      gaugeInput.dataset.field = 'gauge';
      gaugeInput.placeholder = '';
      let displayValue = '';
      const gaugeModelValue = wireData.gauge;
      if (gaugeModelValue !== null && gaugeModelValue !== undefined) {
          displayValue = String(gaugeModelValue);
      }
      gaugeInput.value = displayValue;
      gaugeInput.classList.remove('input-error');
      if (displayValue.trim() !== '' && duplicateGaugeValues.has(displayValue.trim())) {
          gaugeInput.classList.add('input-error');
      }
      // 输入时自动匹配参数
      gaugeInput.addEventListener('input', e => {
        const value = e.target.value;
        currentDisplayData[index].gauge = value;
        updateDuplicateGaugeState();
      });
      gaugeInput.addEventListener('blur', e => {
        const value = e.target.value;
        // 匹配标准库或自定义库
        const match = getEffectiveStandardWires().find(w => String(w.gauge).trim() === value.trim());
        if (match) {
          currentDisplayData[index].thin = match.thin;
          currentDisplayData[index].thick = match.thick;
          currentDisplayData[index].ultraThin = match.ultraThin;
        }
        handleInputBlurFormatValidation(e);
      });
      gaugeInput.addEventListener('keydown', handleInputKeydownFormatValidation);
      gaugeTd.appendChild(gaugeInput);
      // OD 单元格
      ['thin', 'thick', 'ultraThin'].forEach(type => {
        const td = tr.insertCell();
        const input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.min = '0';
        input.dataset.index = index;
        input.dataset.field = type;
        input.className = 'config-input';
        const value = wireData[type];
        let odDisplayValue = '';
        if (value !== null && value !== undefined) {
            odDisplayValue = String(value);
            if (document.activeElement !== input && !isNaN(parseFloat(odDisplayValue))) {
                 odDisplayValue = parseFloat(odDisplayValue).toFixed(2);
            }
        }
        input.value = odDisplayValue;
        input.addEventListener('input', handleInputChange);
        input.addEventListener('blur', handleInputBlurFormatValidation);
        input.addEventListener('keydown', handleInputKeydownFormatValidation);
        td.appendChild(input);
      });
      // 操作单元格
      const actionTd = tr.insertCell();
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '❌'; 
      deleteBtn.className = 'calc-table-btn btn-danger btn-small'; 
      deleteBtn.dataset.index = index;
      deleteBtn.addEventListener('click', handleDeleteRow);
      deleteBtn.title = "删除此行"; 
      actionTd.appendChild(deleteBtn);
      tableBody.appendChild(tr);
    });
    // 滚动条宽度调整逻辑
    const bodyWrapper = document.querySelector('#actual-table-display-area');
    const headerWrapper = document.querySelector('#config-table-header-wrapper');
    if (bodyWrapper && headerWrapper) {
      const scrollbarWidth = bodyWrapper.offsetWidth - bodyWrapper.clientWidth;
      headerWrapper.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '0px';
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
    if (field === 'gauge') {
        if (valueStr === '') {
            currentDisplayData[index][field] = null;
            inputElement.value = '';
        } else {
            currentDisplayData[index][field] = valueStr;
            inputElement.value = valueStr;
        }
    } else {
        if (valueStr === '') {
            currentDisplayData[index][field] = null;
            inputElement.value = '';
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
    if (event.key === 'Enter') {
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
    const userCustom = getUserCustomWiresFromStorage();
    currentDisplayData = deepClone(userCustom);
    initialDataSnapshot = deepClone(currentDisplayData);
    updateDuplicateGaugeState();
    renderTable();
  }

  // --- 按钮事件监听器 ---
  addNewWireBtn.addEventListener('click', () => {
    // 新增的参数放在最上方
    currentDisplayData.unshift({ gauge: null, thin: null, thick: null, ultraThin: null });
    updateDuplicateGaugeState(); // 新增行可能导致重复状态改变
    renderTable(); 
    const tableRows = tableContainer.querySelectorAll('table tbody tr');
    if (tableRows.length > 0) {
        const firstRow = tableRows[0]; // 聚焦到第一行
        // 优先聚焦到 select，如果是自定义则聚焦 input
        const firstSelect = firstRow.querySelector('select.config-input[data-field="gauge"]');
        if (firstSelect) {
          firstSelect.focus();
        } else {
          const firstInput = firstRow.querySelector('input.config-input[data-field="gauge"]');
          firstInput?.focus();
        }
        // firstRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // 新增在顶部，通常不需要滚动
    }
  });

  saveBtn.addEventListener('click', () => {
    // 1. 初步格式化处理所有当前行的数据模型
    currentDisplayData.forEach((wire, index) => {
        // 线规格式化
        if (wire.gauge !== null && wire.gauge !== undefined) {
            const gaugeStr = String(wire.gauge).trim();
            if (gaugeStr === '') {
                currentDisplayData[index].gauge = null; // 空字符串存为 null
            } else {
                currentDisplayData[index].gauge = gaugeStr;
            }
        }
        // OD 值格式化
        ['thin', 'thick', 'ultraThin'].forEach(type => {
            const odVal = wire[type];
            if (odVal !== null && odVal !== undefined) {
                const odStr = String(odVal).trim();
                if (odStr === '') {
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
    currentDisplayData = currentDisplayData.filter(wire => {
        const gaugeVal = wire.gauge;
        return !(gaugeVal === null || String(gaugeVal).trim() === '');
    });

    // 3. 更新重复状态并重新渲染表格
    updateDuplicateGaugeState();
    renderTable();

    // 4. 在过滤后检查重复的线规值
    if (duplicateGaugeValues.size > 0) {
         alert('错误：检测到重复的线规值。请修正高亮的输入框后再保存。');
         return; // 终止保存
    }

    // 5. 处理"保存空列表"的情况
    // 检查是否所有最初有线规输入的行（即使无效）都已被移除
    const hadPotentiallyValidGaugesInput = originalDataBeforeFiltering.some(
        w => w.gauge !== null && String(w.gauge).trim() !== ''
    );

    if (currentDisplayData.length === 0 && hadPotentiallyValidGaugesInput) {
        if (confirm("所有之前输入的线规均为空或无效，已被移除。保存后列表将为空。是否继续？")) {
            // 用户确认保存空列表，currentDisplayData 已为空，后续逻辑将保存空数组
        } else {
            alert("保存操作已取消。您的输入(包括无效行)已被保留供编辑。");
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
        ['thin', 'thick', 'ultraThin'].forEach(type => {
            const odVal = wire[type];
            if (odVal !== null && String(odVal).trim() !== '') { // 如果OD值不为空
                let odNum = parseFloat(String(odVal));
                if (isNaN(odNum) || odNum < 0) {
                    alert(`错误：序号 ${displayIndex} (线规 ${wire.gauge}) 的 ${type} 外径值无效或为负数。`);
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
             alert(`内部错误或并发修改：线规 ${wire.gauge} 在最终准备保存的数据中仍存在重复。请刷新页面或重试。`);
             isValid = false;
             return; // 终止保存
        }
        finalGaugeSet.add(gaugeKey);
    }
    
    if (!isValid) { // 如果最终的保障性重复检查失败
        return;
    }

    // 8. 保存到 localStorage
    try {
        // 只保存与标准库不同或新增的自定义条目
        localStorage.setItem('userDefinedStandardWires', JSON.stringify(getUserCustomWires()));
        currentDisplayData = deepClone(getUserCustomWires()); // 保存后只显示自定义内容
        initialDataSnapshot = deepClone(currentDisplayData);
        alert('配置已成功保存！');
        updateDuplicateGaugeState();
        renderTable();
    } catch (error) {
        console.error('保存配置到localStorage失败:', error);
        alert('保存配置失败，请检查浏览器控制台。\n' + error.message);
    }
  });

  restoreDefaultsBtn.addEventListener('click', () => {
    if (confirm('您确定要恢复所有标准导线参数到出厂默认设置吗？所有自定义导线参数（包括已保存的）都将丢失。')) {
        try {
            localStorage.removeItem('userDefinedStandardWires');
            currentDisplayData = [];
            initialDataSnapshot = [];
            updateDuplicateGaugeState();
            renderTable();
        } catch (error) {
            console.error('恢复默认配置失败:', error);
            alert('恢复默认配置失败，请检查浏览器控制台。\n' + error.message);
        }
    }
  });

  // --- 初始加载 ---
  loadInitialData();

  // 加载初始数据
  loadSimulationParams();
}

// 渲染表格
function renderTable() {
  updateDuplicateGaugeState();
  const tableBody = document.querySelector('#actual-table-display-area table tbody');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  if (currentDisplayData.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.style.textAlign = 'center';
    td.style.padding = '20px';
    td.textContent = '暂无配置数据';
    tr.appendChild(td);
    tableBody.appendChild(tr);
    return;
  }
  // 获取所有线规（标准库+自定义合并）
  const allGauges = getEffectiveStandardWires().map(w => String(w.gauge).trim());
  currentDisplayData.forEach((wireData, index) => {
    const tr = document.createElement('tr');
    // 序号单元格
    const thIndex = tr.insertCell();
    thIndex.textContent = index + 1;
    // 线规单元格（仅输入框，自动匹配参数）
    const gaugeTd = tr.insertCell();
    const gaugeInput = document.createElement('input');
    gaugeInput.type = 'text';
    gaugeInput.className = 'config-input';
    gaugeInput.dataset.index = index;
    gaugeInput.dataset.field = 'gauge';
    gaugeInput.placeholder = '';
    let displayValue = '';
    const gaugeModelValue = wireData.gauge;
    if (gaugeModelValue !== null && gaugeModelValue !== undefined) {
        displayValue = String(gaugeModelValue);
    }
    gaugeInput.value = displayValue;
    gaugeInput.classList.remove('input-error');
    if (displayValue.trim() !== '' && duplicateGaugeValues.has(displayValue.trim())) {
        gaugeInput.classList.add('input-error');
    }
    // 输入时自动匹配参数
    gaugeInput.addEventListener('input', e => {
      const value = e.target.value;
      currentDisplayData[index].gauge = value;
      updateDuplicateGaugeState();
    });
    gaugeInput.addEventListener('blur', e => {
      const value = e.target.value;
      // 匹配标准库或自定义库
      const match = getEffectiveStandardWires().find(w => String(w.gauge).trim() === value.trim());
      if (match) {
        currentDisplayData[index].thin = match.thin;
        currentDisplayData[index].thick = match.thick;
        currentDisplayData[index].ultraThin = match.ultraThin;
      }
      handleInputBlurFormatValidation(e);
    });
    gaugeInput.addEventListener('keydown', handleInputKeydownFormatValidation);
    gaugeTd.appendChild(gaugeInput);
    // OD 单元格
    ['thin', 'thick', 'ultraThin'].forEach(type => {
      const td = tr.insertCell();
      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.min = '0';
      input.dataset.index = index;
      input.dataset.field = type;
      input.className = 'config-input';
      const value = wireData[type];
      let odDisplayValue = '';
      if (value !== null && value !== undefined) {
          odDisplayValue = String(value);
          if (document.activeElement !== input && !isNaN(parseFloat(odDisplayValue))) {
               odDisplayValue = parseFloat(odDisplayValue).toFixed(2);
          }
      }
      input.value = odDisplayValue;
      input.addEventListener('input', handleInputChange);
      input.addEventListener('blur', handleInputBlurFormatValidation);
      input.addEventListener('keydown', handleInputKeydownFormatValidation);
      td.appendChild(input);
    });
    // 操作单元格
    const actionTd = tr.insertCell();
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '❌'; 
    deleteBtn.className = 'calc-table-btn btn-danger btn-small'; 
    deleteBtn.dataset.index = index;
    deleteBtn.addEventListener('click', handleDeleteRow);
    deleteBtn.title = "删除此行"; 
    actionTd.appendChild(deleteBtn);
    tableBody.appendChild(tr);
  });
  // 滚动条宽度调整逻辑
  const bodyWrapper = document.querySelector('#actual-table-display-area');
  const headerWrapper = document.querySelector('#config-table-header-wrapper');
  if (bodyWrapper && headerWrapper) {
    const scrollbarWidth = bodyWrapper.offsetWidth - bodyWrapper.clientWidth;
    headerWrapper.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '0px';
  }
  // 重新附加事件监听器
  attachEventListenersToTable();
}

// --- 模拟参数区逻辑 ---

// 加载当前模拟参数并更新UI
function loadSimulationParams() {
    const params = getSimulationParameters();
    
    // PI
    document.getElementById('pi-range').value = params.PI;
    document.getElementById('pi-input').value = params.PI;

    // SNG_R2_TO_R1
    document.getElementById('r2r1-range').value = params.SNG_R2_TO_R1;
    document.getElementById('r2r1-input').value = params.SNG_R2_TO_R1;

    // ACCELERATION
    document.getElementById('accel-range').value = params.ACCELERATION;
    document.getElementById('accel-input').value = params.ACCELERATION;

    // WEIGHT_FACTOR
    document.getElementById('weight-range').value = params.WEIGHT_FACTOR;
    document.getElementById('weight-input').value = params.WEIGHT_FACTOR;

    // DAMPING
    document.getElementById('damping-range').value = params.DAMPING;
    document.getElementById('damping-input').value = params.DAMPING;

    // TIME_STEP
    document.getElementById('timestep-range').value = params.TIME_STEP;
    document.getElementById('timestep-input').value = params.TIME_STEP;

    // MAX_STEPS
    document.getElementById('maxsteps-range').value = params.MAX_STEPS;
    document.getElementById('maxsteps-input').value = params.MAX_STEPS;

    // STOP_THRESHOLD
    document.getElementById('stopthresh-range').value = params.STOP_THRESHOLD;
    document.getElementById('stopthresh-input').value = params.STOP_THRESHOLD;
}


// 保存当前模拟参数
function saveSimulationParams() {
    const paramsToSave = {
        PI: parseFloat(document.getElementById('pi-input').value),
        SNG_R2_TO_R1: parseFloat(document.getElementById('r2r1-input').value),
        ACCELERATION: parseFloat(document.getElementById('accel-input').value),
        WEIGHT_FACTOR: parseFloat(document.getElementById('weight-input').value),
        DAMPING: parseFloat(document.getElementById('damping-input').value),
        TIME_STEP: parseFloat(document.getElementById('timestep-input').value),
        MAX_STEPS: parseInt(document.getElementById('maxsteps-input').value, 10),
        STOP_THRESHOLD: parseFloat(document.getElementById('stopthresh-input').value)
    };
    saveSimulationParameters(paramsToSave);
    alert('模拟参数已保存！');
}

// 恢复默认模拟参数
function restoreDefaultParams() {
    if (confirm('确定要将所有模拟参数恢复为默认设置吗？此操作不可撤销。')) {
        restoreDefaultSimulationParameters();
        loadSimulationParams(); // 重新加载UI以显示默认值
        alert('模拟参数已恢复为默认值！');
    }
}

// 给单个参数重置按钮绑定事件
function attachResetButtonListener(button, paramKey) {
    button.addEventListener('click', () => {
        const defaultParams = getDefaultSimulationParameters();
        const defaultValue = defaultParams[paramKey];
        
        const rangeInput = button.closest('.param-group').querySelector('input[type="range"]');
        const textInput = button.closest('.param-group').querySelector('input[type="text"]');
        
        if (rangeInput) rangeInput.value = defaultValue;
        if (textInput) textInput.value = defaultValue;
    });
}

// 重新附加事件监听器
function attachEventListenersToTable() {
  const tableContainer = document.querySelector('#group-config-table');
  const tableDisplayArea = document.querySelector('#actual-table-display-area');
  const actionsContainer = tableContainer.querySelector('.group-actions');
  const addNewWireBtn = actionsContainer.querySelector('#add-new-wire-btn-cfg');
  const saveBtn = actionsContainer.querySelector('#save-config-btn-cfg');
  const restoreDefaultsBtn = actionsContainer.querySelector('#restore-defaults-btn-cfg');

  // 为所有滑块和输入框添加联动事件监听
  const simParamsConfig = [
    {
      name: 'pi',
      title: 'π (PI)',
      defaultValue: 3.1415926,
      min: 3.14,
      max: 3.15,
      step: 0.0001,
      precision: 7
    },
    {
      name: 'r2r1',
      title: '容器半径比 (R2/R1)',
      defaultValue: 1.01,
      min: 1,
      max: 1.1,
      step: 0.001,
      precision: 3
    },
    {
      name: 'accel',
      title: '加速系数',
      defaultValue: 1.7,
      min: 1,
      max: 3,
      step: 0.1,
      precision: 1
    },
    {
      name: 'weight',
      title: '质量因子',
      defaultValue: 2,
      min: 1,
      max: 5,
      step: 0.1,
      precision: 1
    },
    {
      name: 'conv',
      title: '收敛阈值',
      defaultValue: 0.001,
      min: 0.0001,
      max: 0.01,
      step: 0.0001,
      precision: 4
    },
    {
      name: 'max-iter-run',
      title: '主循环最大迭代次数',
      defaultValue: 500,
      min: 100,
      max: 1000,
      step: 10,
      precision: 0
    },
    {
      name: 'max-iter-step',
      title: '单步最大迭代次数',
      defaultValue: 15,
      min: 5,
      max: 30,
      step: 1,
      precision: 0
    },
    {
      name: 'container-adjust',
      title: '容器调整系数',
      defaultValue: 0.05,
      min: 0.01,
      max: 0.2,
      step: 0.01,
      precision: 2
    }
  ];

  simParamsConfig.forEach(config => {
    const range = document.getElementById(`${config.name}-range`);
    const input = document.getElementById(`${config.name}-input`);
    
    if (range && input) {
      // 滑块值变化时更新输入框
      range.addEventListener('input', () => {
        const value = parseFloat(range.value);
        input.value = value.toFixed(config.precision);
      });

      // 输入框值变化时更新滑块
      input.addEventListener('input', () => {
        let value = parseFloat(input.value);
        if (!isNaN(value)) {
          // 确保值在范围内
          value = Math.max(config.min, Math.min(config.max, value));
          range.value = value;
        }
      });

      // 输入框失焦时格式化数值
      input.addEventListener('blur', () => {
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
  const resetButtons = document.querySelectorAll('.param-reset-btn');
  resetButtons.forEach(btn => {
    const paramName = btn.dataset.param;
    const config = simParamsConfig.find(c => c.name === paramName);
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
  const saveSimParamsBtn = document.querySelector('#save-sim-params-btn');
  if (saveSimParamsBtn) {
    saveSimParamsBtn.addEventListener('click', saveSimulationParams);
  }

  // 恢复默认按钮事件监听
  const restoreSimParamsBtn = document.querySelector('#restore-sim-params-btn');
  if (restoreSimParamsBtn) {
    restoreSimParamsBtn.addEventListener('click', restoreDefaultParams);
  }
} 