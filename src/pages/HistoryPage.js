import i18n from "../i18n/index.js";
import { showToast, showConfirm } from "../components/feedback.js";
import { getJSON, remove } from "../services/storage.js";
import { getWireTypeLabel } from "../utils/wireTypes.js";

// 使用统一的 wireTypes 工具集中化本地化逻辑

/**
 * 渲染“历史”页面并填充历史记录表与交互。
 * @param {HTMLElement} container - 页面容器根元素。
 */
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
                    <th data-i18n="history_table_header_time">时间</th>
                    <th data-i18n="history_table_header_standard_wires">标准导线</th>
                    <th data-i18n="history_table_header_special_wires">特殊导线</th>
                    <th data-i18n="history_table_header_wrapping">包裹</th>
                    <th data-i18n="history_table_header_tolerance">公差</th>
                    <th data-i18n="history_table_header_max_theoretical">理论最大直径</th>
                    <th data-i18n="history_table_header_min_theoretical">理论最小直径</th>
                    <th data-i18n="history_table_header_avg_theoretical">理论平均直径</th>
                    <th data-i18n="history_table_header_final_diameter">最终平均直径</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div id="history-table-body-wrapper" style="max-height:800px;overflow-y:auto">
              <table id="main-data-table-history-body" class="main-data-table calc-table calc-table-fixed">
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const clearHistoryBtn = container.querySelector("#clear-history-btn");
  const exportCsvBtn = container.querySelector("#export-csv-btn");
  const historyTableBody = container.querySelector(
    "#main-data-table-history-body tbody",
  );

  // 加载并渲染历史记录
  function loadAndRenderHistory() {
    if (historyTableBody) {
      try {
        const history = getJSON("calculationHistory", []);
        if (history.length > 0) {
          historyTableBody.innerHTML = ""; // 清空现有行
          // 为了更好的可读性，后保存的记录显示在前面
          history
            .slice()
            .reverse()
            .forEach((entry, index) => {
              const tr = document.createElement("tr");
              // 将对象数组转换为更易读的字符串
              const formatWiresLines = (wires) =>
                wires.map((w) =>
                  w.gauge
                    ? `${w.gauge},${getWireTypeLabel(w.type)},${w.qty}`
                    : `${w.od},${w.qty}`,
                );
              const formatWrapsLines = (wraps) => wraps.map((w) => `${w.thick}`);

              // 安全构造每个单元格，避免在 innerHTML 中插入未转义的用户数据
              const cells = [
                String(history.length - index),
                entry.calculationTime,
                "__STANDARD_WIRES__",
                "__SPECIAL_WIRES__",
                "__WRAPS__",
                `${entry.tolerance}%`,
                entry.maxTheoreticalDiameter.replace(" mm", ""),
                entry.minTheoreticalDiameter.replace(" mm", ""),
                entry.avgTheoreticalDiameter.replace(" mm", ""),
                entry.avgFinalDiameter.replace(" mm", ""),
              ];

              cells.forEach((value, cellIdx) => {
                const td = document.createElement("td");
                if (cellIdx === 2) {
                  const lines = formatWiresLines(entry.standardWires);
                  if (lines.length === 0) {
                    td.textContent = i18n.getMessage("history_text_none") || "无";
                  } else {
                    lines.forEach((line, i) => {
                      td.appendChild(document.createTextNode(line));
                      if (i !== lines.length - 1) td.appendChild(document.createElement("br"));
                    });
                  }
                } else if (cellIdx === 3) {
                  const lines = formatWiresLines(entry.specialWires);
                  if (lines.length === 0) {
                    td.textContent = i18n.getMessage("history_text_none") || "无";
                  } else {
                    lines.forEach((line, i) => {
                      td.appendChild(document.createTextNode(line));
                      if (i !== lines.length - 1) td.appendChild(document.createElement("br"));
                    });
                  }
                } else if (cellIdx === 4) {
                  const lines = formatWrapsLines(entry.wraps);
                  if (lines.length === 0) {
                    td.textContent = i18n.getMessage("history_text_none") || "无";
                  } else {
                    lines.forEach((line, i) => {
                      td.appendChild(document.createTextNode(line));
                      if (i !== lines.length - 1) td.appendChild(document.createElement("br"));
                    });
                  }
                } else {
                  td.textContent = value;
                }
                tr.appendChild(td);
              });

              historyTableBody.appendChild(tr);
            });
        } else {
          const trEmpty = document.createElement("tr");
          const tdEmpty = document.createElement("td");
          tdEmpty.colSpan = 10;
          tdEmpty.style.textAlign = "center";
          tdEmpty.style.padding = "20px";
          tdEmpty.textContent = i18n.getMessage("history_message_no_records");
          trEmpty.appendChild(tdEmpty);
          historyTableBody.innerHTML = "";
          historyTableBody.appendChild(trEmpty);
        }
      } catch (e) {
        console.error("加载历史记录失败:", e);
        historyTableBody.innerHTML = "";
        const trErr = document.createElement("tr");
        const tdErr = document.createElement("td");
        tdErr.colSpan = 10;
        tdErr.style.textAlign = "center";
        tdErr.style.padding = "20px";
        tdErr.textContent = i18n.getMessage("history_message_load_error");
        trErr.appendChild(tdErr);
        historyTableBody.appendChild(trErr);
      }
    }

    // 调整表头以匹配可能出现的滚动条
    const bodyWrapper = container.querySelector("#history-table-body-wrapper");
    const headerWrapper = container.querySelector(
      "#history-table-header-wrapper",
    );
    if (bodyWrapper && headerWrapper) {
      const scrollbarWidth = bodyWrapper.offsetWidth - bodyWrapper.clientWidth;
      if (scrollbarWidth > 0) {
        headerWrapper.style.paddingRight = `${scrollbarWidth}px`;
      } else {
        headerWrapper.style.paddingRight = "0px";
      }
    }
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.onclick = async () => {
      console.log("清除历史记录按钮被点击");
      const ok = await showConfirm(i18n.getMessage("history_confirm_clear"));
      if (ok) {
        try {
          remove("calculationHistory");
          loadAndRenderHistory();
          showToast(i18n.getMessage("history_message_cleared"), "success");
        } catch (e) {
          console.error("清除历史记录失败:", e);
          showToast(i18n.getMessage("history_message_clear_error"), "error");
        }
      }
    };
  }

  if (exportCsvBtn) {
    exportCsvBtn.onclick = () => {
      console.log("导出CSV按钮被点击");
      try {
        const history = getJSON("calculationHistory", []);
        if (history.length === 0) {
          showToast(i18n.getMessage("history_message_no_records_to_export"), "warning");
          return;
        }

        // CSV头部，与表格列对应
        const headers = [
          i18n.getMessage("history_csv_header_index"),
          i18n.getMessage("history_csv_header_time"),
          i18n.getMessage("history_csv_header_standard_wires"),
          i18n.getMessage("history_csv_header_special_wires"),
          i18n.getMessage("history_csv_header_wrapping"),
          i18n.getMessage("history_csv_header_tolerance"),
          i18n.getMessage("history_csv_header_max_theoretical"),
          i18n.getMessage("history_csv_header_min_theoretical"),
          i18n.getMessage("history_csv_header_avg_theoretical"),
          i18n.getMessage("history_csv_header_final_diameter"),
        ];

        // 辅助函数，处理多条目数据，将其合并到单个CSV单元格，用分号分隔
        const formatWiresForCSV = (wires) =>
          wires
            .map((w) =>
              w.gauge
                ? `${w.gauge},${getWireTypeLabel(w.type)},${w.qty}`
                : `${w.od},${w.qty}`,
            )
            .join("; ") || "无";
        const formatWrapsForCSV = (wraps) =>
          wraps.map((w) => `厚度:${w.thick}`).join("; ") || "无";

        // 构建CSV内容
        let csvContent = headers.join(",") + "\r\n"; // 添加表头并换行

        history
          .slice()
          .reverse()
          .forEach((entry, index) => {
            const row = [
              history.length - index, // 序号
              entry.calculationTime,
              formatWiresForCSV(entry.standardWires),
              formatWiresForCSV(entry.specialWires),
              formatWrapsForCSV(entry.wraps),
              `${entry.tolerance}%`,
              entry.maxTheoreticalDiameter.replace(" mm", ""),
              entry.minTheoreticalDiameter.replace(" mm", ""),
              entry.avgTheoreticalDiameter.replace(" mm", ""),
              entry.avgFinalDiameter.replace(" mm", ""),
            ];
            // 规范CSV字段转义：若包含逗号、分号、换行或引号，则用双引号包裹并将内部引号翻倍
            const escapeCsvField = (v) => {
              const s = String(v);
              if (/[",\n;]/.test(s)) {
                return `"${s.replace(/"/g, '""')}"`;
              }
              return s;
            };
            csvContent += row.map(escapeCsvField).join(",") + "\r\n";
          });

        // 创建Blob对象
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });

        // 创建下载链接
        const link = document.createElement("a");
        if (link.download !== undefined) {
          // 检测是否支持download属性
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", "calculation_history.csv");
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          showToast(i18n.getMessage("history_message_download_not_supported"), "warning");
        }
      } catch (e) {
        console.error("导出CSV失败:", e);
        showToast(i18n.getMessage("history_message_export_error"), "error");
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
