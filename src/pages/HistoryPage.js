import i18n from '../lib/i18n.js';

export function renderHistoryPage(container) {
  container.innerHTML = `
    <div class="page-history">
      <div class="layout-history">
        <div class="group-history-list">
          <div class="group-title">
            <div class="title-container"><span class="emoji">📄</span><span data-i18n="history_title">历史记录列表</span></div>
            <div class="group-actions">
              <button class="calc-table-btn" id="export-csv-btn"><span class="emoji">📤</span><span class="text" data-i18n="history_button_export">导出CSV</span></button>
              <button class="calc-table-btn btn-danger" id="clear-history-btn"><span class="emoji">🗑️</span><span class="text" data-i18n="history_button_clear">清除历史</span></button>
            </div>
          </div>
          <div class="calc-table-content" id="history-table-content">
            <div id="history-table-header-wrapper">
              <table id="main-data-table-history" class="main-data-table calc-table calc-table-fixed">
                <thead>
                  <tr>
                    <th data-i18n="history_table_header_index">序号</th>
                    <th data-i18n="history_table_header_time">计算时间</th>
                    <th data-i18n="history_table_header_standard_wires">标准导线</th>
                    <th data-i18n="history_table_header_special_wires">特殊导线</th>
                    <th data-i18n="history_table_header_wrapping">包覆物</th>
                    <th data-i18n="history_table_header_tolerance">制造公差</th>
                    <th data-i18n="history_table_header_max_theoretical">最大理论直径 (mm)</th>
                    <th data-i18n="history_table_header_min_theoretical">最小理论直径 (mm)</th>
                    <th data-i18n="history_table_header_avg_theoretical">平均理论直径 (mm)</th>
                    <th data-i18n="history_table_header_final_diameter">最终直径 (mm)</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div id="history-table-body-wrapper" style="max-height:800px;overflow-y:auto">
              <table id="main-data-table-history" class="main-data-table calc-table calc-table-fixed">
                <tbody>
                  <tr>
                    <td colspan="10" style="text-align:center;padding:20px;">暂无历史记录</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const clearHistoryBtn = container.querySelector('#clear-history-btn');
  const exportCsvBtn = container.querySelector('#export-csv-btn');
  const historyTableBody = container.querySelector('#main-data-table-history tbody');

  // 加载并渲染历史记录
  function loadAndRenderHistory() {
    if (historyTableBody) {
      try {
        const history = JSON.parse(localStorage.getItem('calculationHistory')) || [];
        if (history.length > 0) {
          historyTableBody.innerHTML = ''; // 清空现有行
          // 为了更好的可读性，后保存的记录显示在前面
          history.slice().reverse().forEach((entry, index) => {
            const tr = document.createElement('tr');
            // 将对象数组转换为更易读的字符串
            const formatWires = (wires) => wires.map(w => w.gauge ? `${w.gauge},${w.type},${w.qty}` : `${w.od},${w.qty}`).join('<br>') || '无';
            const formatWraps = (wraps) => wraps.map(w => `${w.thick}`).join('<br>') || '无';

            tr.innerHTML = `
              <td>${history.length - index}</td>
              <td>${entry.calculationTime}</td>
              <td>${formatWires(entry.standardWires)}</td>
              <td>${formatWires(entry.specialWires)}</td>
              <td>${formatWraps(entry.wraps)}</td>
              <td>${entry.tolerance}%</td>
              <td>${entry.maxTheoreticalDiameter.replace(' mm','')}</td>
              <td>${entry.minTheoreticalDiameter.replace(' mm','')}</td>
              <td>${entry.avgTheoreticalDiameter.replace(' mm','')}</td>
              <td>${entry.avgFinalDiameter.replace(' mm','')}</td>
            `;
            historyTableBody.appendChild(tr);
          });
        } else {
          historyTableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:20px;">${i18n.getMessage('history_message_no_records')}</td></tr>`;
        }
      } catch (e) {
        console.error('加载历史记录失败:', e);
        historyTableBody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:20px;">${i18n.getMessage('history_message_load_error')}</td></tr>`;
      }
    }

    // 调整表头以匹配可能出现的滚动条
    const bodyWrapper = container.querySelector('#history-table-body-wrapper');
    const headerWrapper = container.querySelector('#history-table-header-wrapper');
    if (bodyWrapper && headerWrapper) {
      const scrollbarWidth = bodyWrapper.offsetWidth - bodyWrapper.clientWidth;
      if (scrollbarWidth > 0) {
        headerWrapper.style.paddingRight = `${scrollbarWidth}px`;
      } else {
        headerWrapper.style.paddingRight = '0px';
      }
    }
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.onclick = () => {
      console.log('清除历史记录按钮被点击');
      if (confirm(i18n.getMessage('history_confirm_clear'))) {
        try {
          localStorage.removeItem('calculationHistory');
          loadAndRenderHistory(); // 重新加载并渲染，此时应显示"暂无历史记录"
          alert(i18n.getMessage('history_message_cleared'));
        } catch (e) {
          console.error('清除历史记录失败:', e);
          alert(i18n.getMessage('history_message_clear_error'));
        }
      }
    };
  }

  if (exportCsvBtn) {
    exportCsvBtn.onclick = () => {
      console.log('导出CSV按钮被点击');
      try {
        const history = JSON.parse(localStorage.getItem('calculationHistory')) || [];
        if (history.length === 0) {
          alert(i18n.getMessage('history_message_no_records_to_export'));
          return;
        }

        // CSV头部，与表格列对应
        const headers = [
          i18n.getMessage('history_csv_header_index'),
          i18n.getMessage('history_csv_header_time'),
          i18n.getMessage('history_csv_header_standard_wires'),
          i18n.getMessage('history_csv_header_special_wires'),
          i18n.getMessage('history_csv_header_wrapping'),
          i18n.getMessage('history_csv_header_tolerance'),
          i18n.getMessage('history_csv_header_max_theoretical'),
          i18n.getMessage('history_csv_header_min_theoretical'),
          i18n.getMessage('history_csv_header_avg_theoretical'),
          i18n.getMessage('history_csv_header_final_diameter')
        ];

        // 辅助函数，处理多条目数据，将其合并到单个CSV单元格，用分号分隔
        const formatWiresForCSV = (wires) => 
          wires.map(w => w.gauge ? `${w.gauge},${w.type},${w.qty}` : `${w.od},${w.qty}`).join('; ') || '无';
        const formatWrapsForCSV = (wraps) => 
          wraps.map(w => `厚度:${w.thick}`).join('; ') || '无';

        // 构建CSV内容
        let csvContent = headers.join(',') + '\r\n'; // 添加表头并换行

        history.slice().reverse().forEach((entry, index) => {
          const row = [
            history.length - index, // 序号
            entry.calculationTime,
            `"${formatWiresForCSV(entry.standardWires)}"`, // 加引号以处理可能的逗号或特殊字符
            `"${formatWiresForCSV(entry.specialWires)}"`, // 加引号
            `"${formatWrapsForCSV(entry.wraps)}"`, // 加引号
            entry.tolerance, // 公差通常是数字，但以防万一也加上处理
            entry.maxTheoreticalDiameter.replace(' mm',''),
            entry.minTheoreticalDiameter.replace(' mm',''),
            entry.avgTheoreticalDiameter.replace(' mm',''),
            entry.avgFinalDiameter.replace(' mm','')
          ];
          csvContent += row.map(field => String(field).includes(',') ? `"${field}"` : field).join(',') + '\r\n';
        });

        // 创建Blob对象
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        // 创建下载链接
        const link = document.createElement('a');
        if (link.download !== undefined) { // 检测是否支持download属性
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', 'calculation_history.csv');
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          alert(i18n.getMessage('history_message_download_not_supported'));
        }

      } catch (e) {
        console.error('导出CSV失败:', e);
        alert(i18n.getMessage('history_message_export_error'));
      }
    };
  }

  // 初始加载历史记录
  loadAndRenderHistory();
  
  // 更新国际化文本
  if (i18n && i18n.isInitialized()) {
    i18n.updatePageTexts();
  }
} 