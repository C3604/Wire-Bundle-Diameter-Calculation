// 线束直径计算页面静态布局（每个列表区表头直接写入HTML，tbody留空）
// import { fetchJson } from '../utils/helpers.js'; // 这个导入可能不再需要，除非 fetchJson 被其他地方使用
// import '../styles/CalcPage.css'; // 再次移除CSS导入，应在HTML中通过<link>引入
// 导入新模块
import { runSingleSimulation } from '../logic/simulationEngine.js';
import { drawCirclesOnCanvas } from '../components/simulationRenderer.js';
import { renderSimulationHistoryChart } from '../components/chartRenderer.js';
// import { standardWiresData } from '../storage/standardWires.js'; // 移除静态导入
import { getStandardGauges, getWireOdTable, WIRE_TYPES } from '../logic/simulationConstants.js'; // 导入动态数据获取函数和WIRE_TYPES
import { getEffectiveStandardWires } from './ConfigPage.js'; // 路径按实际项目结构调整

// 预设的导线颜色列表
const WIRE_COLORS = [
  '#3A86FF', // 蓝色
  '#2ECC71', // 绿色
  '#E67E22', // 橙色
  '#9B59B6', // 紫色
  '#F1C40F', // 黄色
  '#1ABC9C', // 青色
  '#E74C3C', // 红色
  '#34495E', // 深蓝灰色
  '#8E44AD', // 深紫色
  '#C0392B', // 深红色
  '#27AE60', // 深绿色
  '#D35400'  // 深橙色
];
const DEFAULT_WIRE_COLOR = '#BDC3C7'; // 默认银色

export function renderCalcPage(container) {
  container.innerHTML = `
    <div class="page-calc">
      <div class="layout-calc">
        <!-- 左侧功能区 -->
        <div class="layout-left">
          <!-- 标准导线列表区 -->
          <div class="group-wire-standard">
            <div class="group-title">
              <span>📏 标准导线</span>
              <div class="group-actions">
                <button class="calc-table-btn" id="add-row-1" title="增加一行标准导线输入">✨ 增加</button>
                <button class="calc-table-btn" id="reset-table-1" title="重置标准导线表格内容为默认值">🔄 重置</button>
              </div>
            </div>
            <div class="calc-table-content" id="table-content-1">
              <div id="table1-header-wrapper">
                <table id="main-data-table-standard" class="main-data-table calc-table calc-table-fixed">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>线规</th>
                      <th>类型</th>
                      <th>直径</th>
                      <th>数量</th>
                      <th>删除</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div id="table1-body-wrapper" style="max-height:220px;overflow-y:auto">
                <table id="main-data-table-standard" class="main-data-table calc-table calc-table-fixed">
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- 特殊导线列表区 -->
          <div class="group-wire-special">
            <div class="group-title">
              <span>🔗 特殊导线</span>
              <div class="group-actions">
                <button class="calc-table-btn" id="add-row-2" title="增加一行特殊导线输入">✨ 增加</button>
                <button class="calc-table-btn" id="reset-table-2" title="重置特殊导线表格内容为默认值">🔄 重置</button>
              </div>
            </div>
            <div class="calc-table-content" id="table-content-2">
              <div id="table2-header-wrapper">
                <table id="main-data-table-special" class="main-data-table calc-table calc-table-fixed">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>直径(mm)</th>
                      <th>数量</th>
                      <th>删除</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div id="table2-body-wrapper" style="max-height:164px;overflow-y:auto">
                <table id="main-data-table-special" class="main-data-table calc-table calc-table-fixed">
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- 包裹物列表区 -->
          <div class="group-wrap">
            <div class="group-title">
              <span>🛡️ 包裹物</span>
              <div class="group-actions">
                <button class="calc-table-btn" id="add-row-3" title="增加一层包裹物">✨ 增加</button>
                <button class="calc-table-btn" id="reset-table-3" title="重置包裹物表格内容为默认值">🔄 重置</button>
              </div>
            </div>
            <div class="calc-table-content" id="table-content-3">
              <div id="table3-header-wrapper">
                <table id="main-data-table-wrap" class="main-data-table calc-table calc-table-fixed">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>厚度(mm)</th>
                      <th>删除</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div id="table3-body-wrapper" style="max-height:164px;overflow-y:auto">
                <table id="main-data-table-wrap" class="main-data-table calc-table calc-table-fixed">
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- 制造公差区 -->
          <div class="group-tolerance">
            <div class="group-title">
              <span>📐 制造公差</span>
              <div class="group-actions">
                <button class="calc-table-btn" id="reset-tolerance" title="重置制造公差为默认值 (110%)">🔄 重置</button>
              </div>
            </div>
            <div class="drag-area-content">
              <input id="tolerance-range" type="range" min="100" max="200" value="110" class="drag-area-range" title="拖动调整制造公差百分比 (100%-200%)">
              <div class="input-with-unit-wrapper">
                <input id="tolerance-input" type="text" value="110" class="drag-area-input" title="输入制造公差百分比 (100-200)">
                <span class="drag-area-unit">%</span>
              </div>
            </div>
          </div>
          <!-- 计算次数区 -->
          <div class="group-score">
            <div class="group-title">
              <span>🧮 计算次数</span>
              <div class="group-actions">
                <button class="calc-table-btn" id="reset-score" title="重置计算次数为默认值 (10)">🔄 重置</button>
              </div>
            </div>
            <div class="drag-area-content">
              <input id="score-range" type="range" min="1" max="100" value="10" class="drag-area-range" title="拖动调整模拟计算次数 (1-100)">
              <input id="score-input" type="text" value="10" class="drag-area-input" title="输入模拟计算次数 (1-100)">
            </div>
          </div>
        </div>
        <!-- 分割线 -->
        <div class="calc-divider"></div>
        <!-- 右侧结果与图表区 -->
        <div class="layout-right">
          <!-- 截面模拟区 -->
          <div class="group-simulation chart-container-wrapper">
            <div class="group-title chart-area-title">
              <span>🖼️ 截面模拟</span>
            </div>
            <div class="simulation-content-wrapper">
              <div class="simulation-area">
                <canvas id="simulation-canvas" width="300" height="300"></canvas>
                <div class="simulation-legend-wrapper" id="simulation-legend-wrapper">
                  <ul id="legend-items-list"></ul>
                </div>
              </div>
              <div class="simulation-details">
                <!-- 高亮平均直径 -->
                <div class="highlighted-result-area">
                  <span id="highlighted-avg-diameter" class="highlight-value" title="向上取整的最终平均直径，括号内为包含包裹物和公差的实际计算值 (保留两位小数)">--</span>
                </div>
                <!-- 输入统计区 -->
                <div class="group-stats input-summary-container detail-separator-top">
                  <div class="group-title"><span>⚙️ 输入统计</span></div>
                  <div id="input-summary">
                    <div>总导线数量：<span id="total-wire-count">0</span></div>
                    <div>总包裹物层数：<span id="total-wrap-count">0</span></div>
                    <div>总包裹物厚度：<span id="total-wrap-thick">0</span></div>
                  </div>
                </div>
                <!-- 直径计算详情区 -->
                <div class="group-result section-title detail-separator-top"><span>📈 直径计算详情</span></div>
                <table class="simulation-results-table">
                  <thead>
                    <tr>
                      <th>参数</th>
                      <th>裸线值 (mm)</th>
                      <th>模拟值 (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>最小线径</td>
                      <td><span id="min-wire-theoretical" title="仅基于导线堆叠模拟计算的理论直径 (不含包裹物和公差)">--</span></td>
                      <td><span id="min-wire" title="包含包裹物厚度和制造公差的最终计算直径">--</span></td>
                    </tr>
                    <tr>
                      <td>最大线径</td>
                      <td><span id="max-wire-theoretical" title="仅基于导线堆叠模拟计算的理论直径 (不含包裹物和公差)">--</span></td>
                      <td><span id="max-wire" title="包含包裹物厚度和制造公差的最终计算直径">--</span></td>
                    </tr>
                    <tr>
                      <td>平均线径</td>
                      <td><span id="avg-wire-theoretical" title="仅基于导线堆叠模拟计算的理论直径 (不含包裹物和公差)">--</span></td>
                      <td><span id="avg-wire" title="包含包裹物厚度和制造公差的最终计算直径">--</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- 计算结果区 -->
          <div class="group-result chart-container-wrapper">
            <div class="group-title chart-area-title"><span>📊 计算结果</span></div>
            <div class="results-chart-area" id="results-history-chart-container">
              <canvas id="results-history-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="calc-bottom-bar">
        <div class="history-save-option">
          <input type="checkbox" id="save-history-checkbox" checked title="勾选后，每次计算结果将自动保存到历史记录中">
          <label for="save-history-checkbox" title="勾选后，每次计算结果将自动保存到历史记录中">保存历史记录</label>
        </div>
        <button id="btn-page-reset-all" class="action-bar-btn btn-reset-action" title="重置页面所有输入项为默认值">🧹 全部重置</button>
        <button id="btn-page-calculate" class="action-bar-btn btn-calculate-action" title="基于当前输入执行模拟计算并显示结果 (或按 Enter 键)">📏 计算直径</button>
      </div>
    </div>
  `;

  // --- 状态变量 ---
  let lastSimulationCircles = null;
  let simulationHistoryChartInstance = null;
  let currentDiameterColorMap = []; // 存储当前的颜色映射

  // --- 动态表格逻辑集成 ---
  const calcLayoutEl = container.querySelector('.layout-calc');
  if (!calcLayoutEl) {
    console.error('renderCalcPage: .layout-calc 未找到，container:', container);
    return;
  }

  const table1Body = calcLayoutEl.querySelector('#main-data-table-standard tbody');
  const addRowBtn1 = calcLayoutEl.querySelector('#add-row-1');
  const resetBtn1 = calcLayoutEl.querySelector('#reset-table-1');
  let standardRows = [
    { gauge: '0.35', type: 'Thin', od: '', qty: '0' },
    { gauge: '0.5', type: 'Thin', od: '', qty: '0' }
  ];
  // let standardWireList = standardWiresData; // 移除静态列表初始化

  // 在这里获取最新的导线数据（标准库+自定义合并）
  let currentStandardWires = [];
  let currentWireOdTable = {};

  function updateWireDataSources() {
    currentStandardWires = getEffectiveStandardWires();
    // 构建线规列表和OD表
    currentWireOdTable = {};
    currentStandardWires.forEach(item => {
      currentWireOdTable[String(item.gauge)] = {
        Thin: item.thin,
        Thick: item.thick,
        'Ultra Thin': item.ultraThin
      };
    });
  }
  
  updateWireDataSources(); // 页面首次加载时获取

  // --- 特殊导线表格逻辑变量 ---
  const table2Body = calcLayoutEl.querySelector('#main-data-table-special tbody');
  const addRowBtn2 = calcLayoutEl.querySelector('#add-row-2');
  const resetBtn2 = calcLayoutEl.querySelector('#reset-table-2');
  let specialRows = [{ od: '2.5', qty: '0' }];

  // --- 包裹物表格逻辑变量 ---
  const table3Body = calcLayoutEl.querySelector('#main-data-table-wrap tbody');
  const addRowBtn3 = calcLayoutEl.querySelector('#add-row-3');
  const resetBtn3 = calcLayoutEl.querySelector('#reset-table-3');
  let wrapRows = [{ thick: '0.5' }];

  // 实时统计输入区内容
  function updateInputSummary() {
    // Calculations can be done synchronously
    let totalWire = 0;
    standardRows.forEach(row => {
      const n = parseInt(row.qty, 10);
      if (!isNaN(n) && n > 0 && parseFloat(row.od) > 0) totalWire += n;
    });
    specialRows.forEach(row => {
      const n = parseInt(row.qty, 10);
      if (!isNaN(n) && n > 0 && parseFloat(row.od) > 0) totalWire += n;
    });
    const totalWrapCount = wrapRows.filter(r => parseFloat(r.thick) > 0).length;
    let totalWrapThick = 0;
    wrapRows.forEach(row => {
      const t = parseFloat(row.thick);
      if (!isNaN(t) && t > 0) totalWrapThick += t;
    });

    // Defer DOM manipulation to the next event loop cycle
    setTimeout(() => {
      const currentCalcLayoutEl = container.querySelector('.layout-calc');
      if (!currentCalcLayoutEl) {
        console.error("updateInputSummary (deferred): .layout-calc element not found within the container.");
        return;
      }

      const totalWireCountEl = currentCalcLayoutEl.querySelector('#total-wire-count');
      if (totalWireCountEl) {
        totalWireCountEl.textContent = totalWire;
      } else {
        console.warn('updateInputSummary (deferred): #total-wire-count element not found.');
      }

      const totalWrapCountEl = currentCalcLayoutEl.querySelector('#total-wrap-count');
      if (totalWrapCountEl) {
        totalWrapCountEl.textContent = totalWrapCount;
      } else {
        console.warn('updateInputSummary (deferred): #total-wrap-count element not found.');
      }

      const totalWrapThickEl = currentCalcLayoutEl.querySelector('#total-wrap-thick');
      if (totalWrapThickEl) {
        totalWrapThickEl.textContent = totalWrapThick.toFixed(2);
      } else {
        console.warn('updateInputSummary (deferred): #total-wrap-thick element not found.');
      }
    }, 0);
  }

  // 初始化标准导线的 OD 值并渲染表格
  standardRows.forEach(row => updateOD(row)); 
  renderStandardRows();

  // 渲染标准导线表格
  function renderStandardRows() {
    updateWireDataSources(); // 每次渲染标准行时，都获取最新的导线数据

    const table1BodyWrapper = calcLayoutEl.querySelector('#table1-body-wrapper');
    table1BodyWrapper.style.overflowY = 'scroll';
    if (standardRows.length >= 4) {
      table1BodyWrapper.style.maxHeight = '164px';
    } else {
      table1BodyWrapper.style.maxHeight = '';
    }
    table1Body.innerHTML = '';
    // 获取所有线规（标准库+自定义）
    const allGauges = currentStandardWires.map(w => w.gauge);
    standardRows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      // 序号
      const tdIndex = document.createElement('td');
      tdIndex.textContent = idx + 1;
      tr.appendChild(tdIndex);
      // 线径
      const tdGauge = document.createElement('td');
      const selectGauge = document.createElement('select');
      selectGauge.innerHTML = '<option value="">请选择</option>' +
        allGauges.map(gaugeValue => `<option value="${gaugeValue}" ${String(row.gauge) === String(gaugeValue) ? 'selected' : ''}>${gaugeValue}</option>`).join('');
      selectGauge.value = row.gauge || '';
      selectGauge.onchange = e => {
        row.gauge = e.target.value;
        updateOD(row);
        renderStandardRows();
      };
      tdGauge.appendChild(selectGauge);
      tr.appendChild(tdGauge);
      // 类型
      const tdType = document.createElement('td');
      const selectType = document.createElement('select');
      let availableTypes = [...WIRE_TYPES];
      const selectedGaugeStr = String(row.gauge);
      const wireDataForGauge = currentWireOdTable[selectedGaugeStr];
      if (wireDataForGauge) {
        availableTypes = availableTypes.filter(typeKey => {
          if (typeKey === 'Thin' && wireDataForGauge.Thin !== undefined && wireDataForGauge.Thin !== null) return true;
          if (typeKey === 'Thick' && wireDataForGauge.Thick !== undefined && wireDataForGauge.Thick !== null) return true;
          if (typeKey === 'Ultra Thin' && wireDataForGauge['Ultra Thin'] !== undefined && wireDataForGauge['Ultra Thin'] !== null) return true;
          return false;
        });
      } else {
        availableTypes = [];
      }
      if (!availableTypes.includes(row.type)) {
        row.type = availableTypes[0] || '';
        updateOD(row);
      }
      availableTypes.forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        if(row.type===type) opt.selected = true;
        selectType.appendChild(opt);
      });
      selectType.value = row.type || availableTypes[0] || '';
      selectType.onchange = e => {
        row.type = e.target.value;
        updateOD(row);
        renderStandardRows();
      };
      tdType.appendChild(selectType);
      tr.appendChild(tdType);
      // 直径
      const tdOD = document.createElement('td');
      tdOD.textContent = row.od || '';
      tr.appendChild(tdOD);
      // 数量
      const tdQty = document.createElement('td');
      const inputQty = document.createElement('input');
      inputQty.type = 'text';
      inputQty.value = row.qty || '';
      inputQty.placeholder = '请输入数量';
      inputQty.maxLength = 4;
      inputQty.className = 'input-qty';
      inputQty.oninput = e => {
        row.qty = e.target.value;
        updateInputSummary();
      };
      tdQty.appendChild(inputQty);
      tr.appendChild(tdQty);
      // 删除
      const tdDel = document.createElement('td');
      const btnDel = document.createElement('button');
      btnDel.textContent = '❌';
      btnDel.title = '删除此行';
      btnDel.onclick = () => {
        standardRows.splice(idx, 1);
        renderStandardRows();
      };
      tdDel.appendChild(btnDel);
      tr.appendChild(tdDel);
      if (idx === standardRows.length - 1 && renderStandardRows._focusNext) {
        setTimeout(() => {
          inputQty.focus();
          inputQty.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
      }
      table1Body.appendChild(tr);
    });
    renderStandardRows._focusNext = false;
    updateInputSummary();
  }

  // 匹配直径
  function updateOD(row) {
    const selectedGaugeStr = String(row.gauge);
    const wireData = currentWireOdTable[selectedGaugeStr]; // 使用新的OD表

    if (wireData) {
      if (row.type === 'Thin') row.od = wireData.Thin;
      else if (row.type === 'Thick') row.od = wireData.Thick;
      else if (row.type === 'Ultra Thin') row.od = wireData['Ultra Thin'];
      else row.od = '';
      if(row.od==null) row.od = '';
    } else {
      row.od = '';
    }
    updateInputSummary();
  }

  // 增加一行
  addRowBtn1.onclick = () => {
    standardRows.push({ gauge: '', type: '', od: '', qty: '1' }); // Add an empty row, or a different default if preferred
    // updateOD might not be necessary if gauge/type are empty
    renderStandardRows._focusNext = true;
    renderStandardRows();
  };
  // 重置
  resetBtn1.onclick = () => {
    standardRows = [
      { gauge: '0.35', type: 'Thin', od: '', qty: '0' },
      { gauge: '0.5', type: 'Thin', od: '', qty: '0' }
    ];
    standardRows.forEach(row => updateOD(row)); // Ensure OD is updated on reset
    renderStandardRows();
  };

  // --- 特殊导线表格逻辑 ---
  function renderSpecialRows() {
    // 滚动条逻辑：始终显示滚动条轨道
    const table2BodyWrapper = calcLayoutEl.querySelector('#table2-body-wrapper');
    table2BodyWrapper.style.overflowY = 'scroll'; // Always show scrollbar track
    if (specialRows.length >= 4) {
      table2BodyWrapper.style.maxHeight = '164px';
    } else {
      table2BodyWrapper.style.maxHeight = '';
    }
    table2Body.innerHTML = '';
    specialRows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      // 序号
      const tdIndex = document.createElement('td');
      tdIndex.textContent = idx + 1;
      tr.appendChild(tdIndex);
      // 直径
      const tdOD = document.createElement('td');
      const inputOD = document.createElement('input');
      inputOD.type = 'text';
      inputOD.value = row.od || '';
      inputOD.placeholder = '请输入直径';
      inputOD.maxLength = 8;
      inputOD.className = 'input-od';
      inputOD.oninput = e => {
        row.od = e.target.value;
        updateInputSummary();
      };
      tdOD.appendChild(inputOD);
      tr.appendChild(tdOD);
      // 数量
      const tdQty = document.createElement('td');
      const inputQty = document.createElement('input');
      inputQty.type = 'text';
      inputQty.value = row.qty || '';
      inputQty.placeholder = '数量';
      inputQty.maxLength = 4;
      inputQty.className = 'input-qty';
      inputQty.oninput = e => {
        row.qty = e.target.value;
        updateInputSummary();
      };
      tdQty.appendChild(inputQty);
      tr.appendChild(tdQty);
      // 删除
      const tdDel = document.createElement('td');
      const btnDel = document.createElement('button');
      btnDel.textContent = '❌';
      btnDel.title = '删除此行';
      btnDel.onclick = () => {
        specialRows.splice(idx, 1);
        renderSpecialRows();
      };
      tdDel.appendChild(btnDel);
      tr.appendChild(tdDel);
      // 新增行时聚焦到数量输入框
      if (idx === specialRows.length - 1 && renderSpecialRows._focusNext) {
        setTimeout(() => {
          inputQty.focus();
          inputQty.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
      }
      table2Body.appendChild(tr);
    });
    renderSpecialRows._focusNext = false;
    updateInputSummary();
  }

  addRowBtn2.onclick = () => {
    specialRows.push({ od: '', qty: '1' }); // Add an empty row
    renderSpecialRows._focusNext = true;
    renderSpecialRows();
  };
  resetBtn2.onclick = () => {
    specialRows = [{ od: '2.5', qty: '0' }];
    renderSpecialRows();
  };
  renderSpecialRows();

  // --- 包裹物表格逻辑 ---
  function renderWrapRows() {
    // 滚动条逻辑：始终显示滚动条轨道
    const table3BodyWrapper = calcLayoutEl.querySelector('#table3-body-wrapper');
    table3BodyWrapper.style.overflowY = 'scroll'; // Always show scrollbar track
    if (wrapRows.length >= 4) {
      table3BodyWrapper.style.maxHeight = '164px';
    } else {
      table3BodyWrapper.style.maxHeight = '';
    }
    table3Body.innerHTML = '';
    wrapRows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      // 序号
      const tdIndex = document.createElement('td');
      tdIndex.textContent = idx + 1;
      tr.appendChild(tdIndex);
      // 厚度
      const tdThick = document.createElement('td');
      const inputThick = document.createElement('input');
      inputThick.type = 'text';
      inputThick.value = row.thick || '';
      inputThick.placeholder = '厚度';
      inputThick.maxLength = 6;
      inputThick.className = 'input-thick';
      inputThick.oninput = e => {
        row.thick = e.target.value;
        updateInputSummary();
      };
      tdThick.appendChild(inputThick);
      tr.appendChild(tdThick);
      // 删除
      const tdDel = document.createElement('td');
      const btnDel = document.createElement('button');
      btnDel.textContent = '❌';
      btnDel.title = '删除此行';
      btnDel.onclick = () => {
        wrapRows.splice(idx, 1);
        renderWrapRows();
      };
      tdDel.appendChild(btnDel);
      tr.appendChild(tdDel);
      // 新增行时聚焦到厚度输入框
      if (idx === wrapRows.length - 1 && renderWrapRows._focusNext) {
        setTimeout(() => {
          inputThick.focus();
          inputThick.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
      }
      table3Body.appendChild(tr);
    });
    renderWrapRows._focusNext = false;
    updateInputSummary();
  }

  addRowBtn3.onclick = () => {
    wrapRows.push({ thick: '' }); // Add an empty row
    renderWrapRows._focusNext = true;
    renderWrapRows();
  };
  resetBtn3.onclick = () => {
    wrapRows = [{ thick: '0.5' }];
    renderWrapRows();
  };
  renderWrapRows();

  // 拖动条区域联动逻辑
  const toleranceRange = calcLayoutEl.querySelector('#tolerance-range');
  const toleranceInput = calcLayoutEl.querySelector('#tolerance-input');
  // 拖动滑块时实时刷新输入框
  toleranceRange.oninput = function() {
    toleranceInput.value = this.value;
  };
  // 只在输入框失去焦点时刷新滑块
  toleranceInput.onblur = function() {
    let val = parseInt(this.value, 10);
    if (isNaN(val)) val = 100;
    if (val < 100) val = 100;
    if (val > 200) val = 200;
    this.value = val;
    toleranceRange.value = val;
  };
  // 计算次数拖动条联动逻辑
  const scoreRange = calcLayoutEl.querySelector('#score-range');
  const scoreInput = calcLayoutEl.querySelector('#score-input');
  scoreRange.oninput = function() {
    scoreInput.value = this.value;
  };
  scoreInput.onblur = function() {
    let val = parseInt(this.value, 10);
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 100) val = 100;
    this.value = val;
    scoreRange.value = val;
  };

  // 在每次渲染表格后调用
  const oldRenderStandardRows = renderStandardRows;
  renderStandardRows = function() {
    oldRenderStandardRows();
    updateInputSummary();
  };
  const oldRenderSpecialRows = renderSpecialRows;
  renderSpecialRows = function() {
    oldRenderSpecialRows();
    updateInputSummary();
  };
  const oldRenderWrapRows = renderWrapRows;
  renderWrapRows = function() {
    oldRenderWrapRows();
    updateInputSummary();
  };

  const resetToleranceBtn = calcLayoutEl.querySelector('#reset-tolerance');
  const resetScoreBtn = calcLayoutEl.querySelector('#reset-score');

  if (resetToleranceBtn && toleranceRange && toleranceInput) {
    resetToleranceBtn.onclick = () => {
      toleranceRange.value = '110';
      toleranceInput.value = '110';
    };
  }

  if (resetScoreBtn && scoreRange && scoreInput) {
    resetScoreBtn.onclick = () => {
      scoreRange.value = '10';
      scoreInput.value = '10';
    };
  }

  // 清除模拟结果和图表的函数
  function clearSimulationResults() {
    // 清除画布
    const canvasEl = calcLayoutEl.querySelector('#simulation-canvas');
    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }
    // Clear final values in table
    calcLayoutEl.querySelector('#min-wire').textContent = '--';
    calcLayoutEl.querySelector('#max-wire').textContent = '--';
    calcLayoutEl.querySelector('#avg-wire').textContent = '--';
    // Clear theoretical values in table
    calcLayoutEl.querySelector('#min-wire-theoretical').textContent = '--';
    calcLayoutEl.querySelector('#max-wire-theoretical').textContent = '--';
    calcLayoutEl.querySelector('#avg-wire-theoretical').textContent = '--';
    // Clear highlighted value (reset innerHTML)
    const highlightedAvgEl = calcLayoutEl.querySelector('#highlighted-avg-diameter');
    if (highlightedAvgEl) highlightedAvgEl.innerHTML = '--';
    // 清除历史图表
    if (simulationHistoryChartInstance) {
      simulationHistoryChartInstance.destroy();
      simulationHistoryChartInstance = null;
    }
    lastSimulationCircles = null; // 重置最后一次模拟数据
    currentDiameterColorMap = []; // 清除颜色映射
    renderLegend([]); // 清空图例显示
  }

  // Event listeners for the new bottom bar buttons
  const btnPageResetAll = container.querySelector('#btn-page-reset-all');
  if (btnPageResetAll) {
    btnPageResetAll.onclick = () => {
      console.log('全部重置 button on page bottom bar clicked');
      if(confirm('确定要重置所有输入吗？')) {
        if (resetBtn1) resetBtn1.click();
        if (resetBtn2) resetBtn2.click();
        if (resetBtn3) resetBtn3.click();
        if (resetToleranceBtn) resetToleranceBtn.click();
        if (resetScoreBtn) resetScoreBtn.click();
        document.getElementById('max-wire').textContent = '';
        document.getElementById('min-wire').textContent = '';
        document.getElementById('avg-wire').textContent = '';
      }
    };
  }

  const btnPageCalculate = container.querySelector('#btn-page-calculate');
  if (btnPageCalculate) {
    btnPageCalculate.onclick = () => {
      // 确保移除旧的 alert 提示
      // console.log('计算直径 button on page bottom bar clicked');
      // alert('计算功能待实现！'); // <--- 这行将被移除并替换为下面的完整逻辑

      console.log('计算直径按钮点击');
      btnPageCalculate.disabled = true;
      btnPageCalculate.textContent = '计算中...';

      const wireRadii = [];
      // 从 standardRows 收集有效的导线半径
      standardRows.forEach(row => {
        const qty = parseInt(row.qty, 10);
        const od = parseFloat(row.od);
        // 确保数量和OD都是有效的正数
        if (!isNaN(qty) && qty > 0 && !isNaN(od) && od > 0) {
          const radius = od / 2;
          for (let i = 0; i < qty; i++) wireRadii.push(radius);
        }
      });
      // 从 specialRows 收集有效的导线半径
      specialRows.forEach(row => {
        const qty = parseInt(row.qty, 10);
        const od = parseFloat(row.od);
        // 确保数量和OD都是有效的正数
        if (!isNaN(qty) && qty > 0 && !isNaN(od) && od > 0) {
          const radius = od / 2;
          for (let i = 0; i < qty; i++) wireRadii.push(radius);
        }
      });

      if (wireRadii.length === 0) {
        alert('请输入至少一个有效数量和直径的导线进行计算。');
        btnPageCalculate.disabled = false;
        btnPageCalculate.textContent = '📏 计算直径';
        return;
      }

      let totalWrappingThickness = 0;
      wrapRows.forEach(row => {
        const thick = parseFloat(row.thick);
        if (!isNaN(thick) && thick > 0) totalWrappingThickness += thick; // 只累加有效的正数厚度
      });

      const numSimulations = parseInt(scoreInput.value, 10) || 10;
      const toleranceFactor = (parseInt(toleranceInput.value, 10) || 110) / 100;

      // 清除旧结果和画布/图表
      clearSimulationResults();
      calcLayoutEl.querySelector('#min-wire').textContent = '计算中';
      calcLayoutEl.querySelector('#max-wire').textContent = '计算中';
      calcLayoutEl.querySelector('#avg-wire').textContent = '计算中';

      // 使用 setTimeout 异步执行，防止UI阻塞
      setTimeout(() => {
        const simulationDiameters = []; // 存储每次模拟的堆叠直径（不含包裹和公差）
        let tempLastCirclesData = null; // 临时存储最后一次模拟的圆形数据
        currentDiameterColorMap = []; // 重置颜色映射

        try {
          console.log(`开始 ${numSimulations} 次模拟, 总导线数: ${wireRadii.length}`);

          // 收集所有唯一导线直径用于颜色映射和图例
          const uniqueDiameters = new Set();
          const wireInfoForLegend = []; // 存储用于图例的导线信息 {diameter, type, originalValue}

          standardRows.forEach(row => {
            const qty = parseInt(row.qty, 10);
            const od = parseFloat(row.od);
            if (!isNaN(qty) && qty > 0 && !isNaN(od) && od > 0) {
              uniqueDiameters.add(od);
              if (row.gauge) { // 确保 gauge 存在
                wireInfoForLegend.push({ diameter: od, type: 'standard', originalValue: row.gauge });
              } else { // 如果标准导线没有 gauge (理论上不应发生，但作为回退)
                wireInfoForLegend.push({ diameter: od, type: 'standard_no_gauge', originalValue: od });
              }
            }
          });
          specialRows.forEach(row => {
            const qty = parseInt(row.qty, 10);
            const od = parseFloat(row.od);
            if (!isNaN(qty) && qty > 0 && !isNaN(od) && od > 0) {
              uniqueDiameters.add(od);
              wireInfoForLegend.push({ diameter: od, type: 'special', originalValue: od });
            }
          });

          const sortedUniqueDiameters = Array.from(uniqueDiameters).sort((a, b) => a - b);
          currentDiameterColorMap = []; // 重置

          sortedUniqueDiameters.forEach((diameter, index) => {
            // 从 wireInfoForLegend 中找到这个直径的代表性信息来决定 displayValue
            // 我们取第一个匹配该直径的导线信息
            const representativeWire = wireInfoForLegend.find(w => Math.abs(w.diameter - diameter) < 1e-6);
            let displayValue = '';

            if (representativeWire) {
              if (representativeWire.type === 'standard') {
                displayValue = representativeWire.originalValue; // 这是 gauge
              } else if (representativeWire.type === 'special') {
                displayValue = `${representativeWire.originalValue.toFixed(3)} mm`;
              } else { // standard_no_gauge or other unexpected
                displayValue = `${diameter.toFixed(3)} mm`;
              }
            } else {
              // 理论上不应该到这里，因为 sortedUniqueDiameters 来自 wireInfoForLegend 的直径
              displayValue = `${diameter.toFixed(3)} mm`;
            }

            currentDiameterColorMap.push({
              diameter: diameter, // 用于颜色查找和绘图匹配
              displayValue: displayValue, // 用于图例显示
              color: WIRE_COLORS[index % WIRE_COLORS.length] // 循环使用颜色
            });
          });
          // 如果唯一线径数量超过预定义颜色，可以考虑给超出的分配一个默认颜色，
          // 但当前逻辑是循环使用，对于非常多的唯一线径可能导致颜色重复。
          // 或者，可以修改上面的逻辑，当 index >= WIRE_COLORS.length 时，统一使用 DEFAULT_WIRE_COLOR。
          // 例如: color: index < WIRE_COLORS.length ? WIRE_COLORS[index] : DEFAULT_WIRE_COLOR

          console.log('生成的颜色映射:', currentDiameterColorMap);

          for (let i = 0; i < numSimulations; i++) {
            // 注意：runSingleSimulation 需要半径数组
            const result = runSingleSimulation([...wireRadii]); 
            if (result && typeof result.containerRadius === 'number' && result.containerRadius > 1e-9) {
              simulationDiameters.push(result.containerRadius * 2); // 存储的是直径
              if (i === numSimulations - 1) {
                tempLastCirclesData = result.finalCircles; // 保存最后一次模拟的完整数据
              }
            } else {
              console.warn(`模拟 ${i + 1} 返回无效或零半径结果:`, result);
            }
          }

          if (simulationDiameters.length > 0) {
            lastSimulationCircles = tempLastCirclesData; // 更新页面级别的状态

            const minSimOD = Math.min(...simulationDiameters);
            const maxSimOD = Math.max(...simulationDiameters);
            const sumSimOD = simulationDiameters.reduce((a, b) => a + b, 0);
            const avgSimOD = sumSimOD / simulationDiameters.length;

            const addedDiameterFromWrapping = 2 * totalWrappingThickness;
            
            // Calculate final average diameter precisely
            const finalAvgODValue = (avgSimOD + addedDiameterFromWrapping) * toleranceFactor;
            
            // Calculate display values
            const finalAvgODTextTable = !isNaN(finalAvgODValue) ? finalAvgODValue.toFixed(3) + ' mm' : '计算错误';
            const finalAvgODCeilInt = !isNaN(finalAvgODValue) ? Math.ceil(finalAvgODValue) : '-';
            const finalAvgODPrecise = !isNaN(finalAvgODValue) ? finalAvgODValue.toFixed(2) : '-';
            const finalAvgODHighlightHTML = !isNaN(finalAvgODValue) 
              ? `${finalAvgODCeilInt} mm <span class="precise-value">(${finalAvgODPrecise})</span>`
              : '计算错误';

            // Theoretical values
            calcLayoutEl.querySelector('#min-wire-theoretical').textContent = minSimOD.toFixed(3) + ' mm';
            calcLayoutEl.querySelector('#max-wire-theoretical').textContent = maxSimOD.toFixed(3) + ' mm';
            calcLayoutEl.querySelector('#avg-wire-theoretical').textContent = avgSimOD.toFixed(3) + ' mm';
            
            // Final values (with wrapping and tolerance)
            const finalAvgODText = !isNaN(finalAvgODValue) ? finalAvgODValue.toFixed(3) + ' mm' : '计算错误';

            calcLayoutEl.querySelector('#min-wire').textContent = ((minSimOD + addedDiameterFromWrapping) * toleranceFactor).toFixed(3) + ' mm';
            calcLayoutEl.querySelector('#max-wire').textContent = ((maxSimOD + addedDiameterFromWrapping) * toleranceFactor).toFixed(3) + ' mm';
            calcLayoutEl.querySelector('#avg-wire').textContent = finalAvgODText;
            
            // Update Highlighted final average value using innerHTML
            const highlightedAvgEl = calcLayoutEl.querySelector('#highlighted-avg-diameter');
            if (highlightedAvgEl) {
                highlightedAvgEl.innerHTML = finalAvgODHighlightHTML;
            } else {
                console.error('Element with ID #highlighted-avg-diameter not found!');
            }

            // 绘制模拟截面图
            const canvasEl = calcLayoutEl.querySelector('#simulation-canvas');
            const ctx = canvasEl ? canvasEl.getContext('2d') : null;
            if (ctx && canvasEl && lastSimulationCircles) {
              drawCirclesOnCanvas(ctx, canvasEl, lastSimulationCircles, { diameterColorMap: currentDiameterColorMap });
            }
            
            // 渲染历史结果图表
            simulationHistoryChartInstance = renderSimulationHistoryChart(
              'results-history-chart', 
              simulationDiameters, // 传递原始模拟直径用于图表
              simulationHistoryChartInstance
            );

            renderLegend(currentDiameterColorMap); // 渲染图例

          } else {
            alert('所有模拟均未产生有效结果。请检查输入或参数。');
            clearSimulationResults(); // 清理结果显示, including new details panel
          }
        } catch (error) {
          console.error("计算过程中发生错误:", error);
          alert("计算过程中发生错误，请检查控制台获取更多信息。");
          clearSimulationResults(); // 出错时也清理结果, including new details panel
        } finally {
          // 保存历史记录逻辑
          const saveHistoryCheckbox = document.getElementById('save-history-checkbox');
          if (saveHistoryCheckbox && saveHistoryCheckbox.checked && simulationDiameters.length > 0) {
            try {
              const historyEntry = {
                timestamp: Date.now(),
                calculationTime: new Date().toLocaleString(),
                standardWires: standardRows.filter(row => {
                  const qty = parseInt(row.qty, 10);
                  const od = parseFloat(row.od);
                  return !isNaN(qty) && qty > 0 && !isNaN(od) && od > 0;
                }).map(row => ({ gauge: row.gauge, type: row.type, od: row.od, qty: row.qty })),
                specialWires: specialRows.filter(row => {
                  const qty = parseInt(row.qty, 10);
                  const od = parseFloat(row.od);
                  return !isNaN(qty) && qty > 0 && !isNaN(od) && od > 0;
                }).map(row => ({ od: row.od, qty: row.qty })),
                wraps: wrapRows.filter(row => {
                  const thick = parseFloat(row.thick);
                  return !isNaN(thick) && thick > 0;
                }).map(row => ({ thick: row.thick })),
                tolerance: toleranceInput.value,
                minTheoreticalDiameter: calcLayoutEl.querySelector('#min-wire-theoretical').textContent,
                maxTheoreticalDiameter: calcLayoutEl.querySelector('#max-wire-theoretical').textContent,
                avgTheoreticalDiameter: calcLayoutEl.querySelector('#avg-wire-theoretical').textContent,
                minFinalDiameter: calcLayoutEl.querySelector('#min-wire').textContent,
                maxFinalDiameter: calcLayoutEl.querySelector('#max-wire').textContent,
                avgFinalDiameter: calcLayoutEl.querySelector('#avg-wire').textContent,
              };

              let history = JSON.parse(localStorage.getItem('calculationHistory')) || [];
              history.push(historyEntry);
              // 为了防止历史记录过大，可以考虑限制长度，例如只保留最近N条
              // if (history.length > 50) { // 示例：最多保留50条
              //   history = history.slice(history.length - 50);
              // }
              localStorage.setItem('calculationHistory', JSON.stringify(history));
              console.log('历史记录已保存:', historyEntry);
            } catch (e) {
              console.error('保存历史记录失败:', e);
              alert('保存历史记录时发生错误，可能是本地存储已满或被禁用。');
            }
          }

          btnPageCalculate.disabled = false;
          btnPageCalculate.textContent = '📏 计算直径';
        }
      }, 50); // 50ms延迟，给UI渲染留出时间
    };
  }

  // Initial renders
  // renderStandardRows(); // Moved to fetchJson callback
  renderSpecialRows();
  renderWrapRows();
  updateInputSummary(); // Initial summary update
  renderLegend([]); // 初始时清空图例
}

// 新增：渲染图例函数
function renderLegend(diameterColorMap) {
  const legendList = document.getElementById('legend-items-list');
  const legendWrapper = document.getElementById('simulation-legend-wrapper');

  if (!legendList || !legendWrapper) {
    console.warn('图例元素未找到。');
    return;
  }

  legendList.innerHTML = ''; // 清空现有图例项

  if (!diameterColorMap || diameterColorMap.length === 0) {
    legendWrapper.style.display = 'none'; // 如果没有图例项则隐藏整个区域
    return;
  }

  legendWrapper.style.display = 'block'; // 显示图例区域

  diameterColorMap.forEach(item => {
    const listItem = document.createElement('li');
    
    const colorBox = document.createElement('span');
    colorBox.className = 'legend-color-box';
    colorBox.style.backgroundColor = item.color;
    
    const textNode = document.createTextNode(` ${item.displayValue}`); 
    
    listItem.appendChild(colorBox);
    listItem.appendChild(textNode);
    legendList.appendChild(listItem);
  });
} 