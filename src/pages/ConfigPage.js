import { getDefaultStandardWires } from '../logic/simulationConstants.js';
import { standardWiresData } from '../storage/standardWires.js';

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
  const stdMap = {};
  standardWiresData.forEach(item => {
    const key = String(item.gauge).trim();
    if (key) stdMap[key] = { ...item };
  });
  const userWires = getStoredUserWires() || [];
  userWires.forEach(item => {
    const key = String(item.gauge).trim();
    if (key) stdMap[key] = { ...item };
  });
  return Object.values(stdMap).sort((a, b) => String(a.gauge).localeCompare(String(b.gauge), 'zh-CN', {numeric: true}));
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
    const std = stdMap[key];
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

// 获取"标准库"用于业务/计算（标准库+自定义合并，外部可直接调用）
export function getEffectiveStandardWires() {
  const stdMap = {};
  standardWiresData.forEach(item => {
    const key = String(item.gauge).trim();
    if (key) stdMap[key] = { ...item };
  });
  const userWires = getUserCustomWiresFromStorage();
  userWires.forEach(item => {
    const key = String(item.gauge).trim();
    if (key) stdMap[key] = { ...item };
  });
  return Object.values(stdMap).sort((a, b) => String(a.gauge).localeCompare(String(b.gauge), 'zh-CN', {numeric: true}));
}

export function renderConfigPage(container) {
  container.innerHTML = `
    <div class="page-config">
      <div class="layout-config">
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
    </div>
  `;

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
} 