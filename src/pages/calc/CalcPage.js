// 线束直径计算页面静态布局（每个列表区表头直接写入HTML，tbody留空）
// 导入新模块
import { runSingleSimulation } from "../../logic/simulationEngine.js";
import { drawCirclesOnCanvas } from "../../components/simulationRenderer.js";
import { renderSimulationHistoryChart } from "../../components/chartRenderer.js";
import {
  getEffectiveStandardWires,
  getSimulationParameters,
  buildGaugeOptionsWithCustomFirst,
} from "../../logic/wireManager.js";
import mspecService from "../../services/mspecService.js";
import i18n from "../../i18n/index.js";
import { showToast, showConfirm } from "../../components/feedback.js";
import { collectAndValidateInputs } from "./inputCollector.js";
import { getJSON, setJSON } from "../../services/storage.js";
import { recordMultiMatch } from "../../services/auditLogger.js";

// 统一使用 utils/wireTypes 提供的本地化接口

// 模拟参数采用显式传参，不再监听全局更新事件

// 预设的导线颜色列表
const WIRE_COLORS = [
  "#3A86FF", // 蓝色
  "#2ECC71", // 绿色
  "#E67E22", // 橙色
  "#9B59B6", // 紫色
  "#F1C40F", // 黄色
  "#1ABC9C", // 青色
  "#E74C3C", // 红色
  "#34495E", // 深蓝灰色
  "#8E44AD", // 深紫色
  "#C0392B", // 深红色
  "#27AE60", // 深绿色
  "#D35400", // 深橙色
];
const DEFAULT_WIRE_COLOR = "#BDC3C7"; // 默认银色

/**
 * 渲染“计算”页面并初始化状态、事件与绘图。
 * @param {HTMLElement} container - 页面容器根元素。
 */
export function renderCalcPage(container) {
  container.innerHTML = `
    <div class="page-calc">
      <div class="layout-calc">
        <!-- 左侧功能区 -->
        <div class="layout-left">
          <!-- 标准导线列表区 -->
          <div class="group-wire-standard">
            <div class="group-title">
              <div class="title-container"><span class="emoji">📏</span><span data-i18n="calc_group_standard_wire_title">标准导线</span></div>
              <div class="group-actions calc-table">
                <div class="actions-left">
                  <label>
                    <span data-i18n="calc_group_standard_wire_select_label">标准</span>
                    <select id="wire-standard-select"></select>
                  </label>
                  <span id="wire-standard-loading" class="u-hidden" data-i18n="common_loading">加载中...</span>
                </div>
                <div class="actions-right">
                  <button class="calc-table-btn" id="add-row-1" data-i18n-title="calc_group_standard_wire_button_add_tooltip" title="增加一行标准导线输入"><span class="emoji">✨</span><span class="text" data-i18n="common_add">增加</span></button>
                  <button class="calc-table-btn" id="reset-table-1" data-i18n-title="calc_group_standard_wire_button_reset_tooltip" title="重置标准导线表格内容为默认值"><span class="emoji">🔄</span><span class="text" data-i18n="common_reset">重置</span></button>
                </div>
              </div>
            </div>
            <div class="calc-table-content" id="table-content-1">
              <div id="table1-header-wrapper">
                <table id="main-data-table-standard" class="main-data-table calc-table calc-table-fixed">
                  <thead>
                    <tr>
                      <th data-i18n="common_index">序号</th>
                      <th data-i18n="common_gauge">线规</th>
                      <th data-i18n="common_type">类型</th>
                      <th data-i18n="common_diameter_mm">直径</th>
                      <th data-i18n="common_qty">数量</th>
                      <th data-i18n="common_delete">删除</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div id="table1-body-wrapper" class="u-scroll-y-auto u-max-h-220">
                <table id="main-data-table-standard-body" class="main-data-table calc-table calc-table-fixed">
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- 特殊导线列表区 -->
          <div class="group-wire-special">
            <div class="group-title">
              <div class="title-container"><span class="emoji">🔗</span><span data-i18n="calc_group_special_wire_title">特殊导线</span></div>
              <div class="group-actions">
                <button class="calc-table-btn" id="add-row-2" data-i18n-title="calc_group_special_wire_button_add_tooltip" title="增加一行特殊导线输入"><span class="emoji">✨</span><span class="text" data-i18n="common_add">增加</span></button>
                <button class="calc-table-btn" id="reset-table-2" data-i18n-title="calc_group_special_wire_button_reset_tooltip" title="重置特殊导线表格内容为默认值"><span class="emoji">🔄</span><span class="text" data-i18n="common_reset">重置</span></button>
              </div>
            </div>
            <div class="calc-table-content" id="table-content-2">
              <div id="table2-header-wrapper">
                <table id="main-data-table-special" class="main-data-table calc-table calc-table-fixed">
                  <thead>
                    <tr>
                      <th data-i18n="common_index">序号</th>
                      <th data-i18n="common_diameter_mm">直径(mm)</th>
                      <th data-i18n="common_qty">数量</th>
                      <th data-i18n="common_delete">删除</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div id="table2-body-wrapper" class="u-scroll-y-auto u-max-h-164">
                <table id="main-data-table-special-body" class="main-data-table calc-table calc-table-fixed">
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- 包裹物列表区 -->
          <div class="group-wrap">
            <div class="group-title">
              <div class="title-container"><span class="emoji">🛡️</span><span data-i18n="calc_group_wrap_title">包裹物</span></div>
              <div class="group-actions">
                <button class="calc-table-btn" id="add-row-3" data-i18n-title="calc_group_wrap_button_add_tooltip" title="增加一层包裹物"><span class="emoji">✨</span><span class="text" data-i18n="common_add">增加</span></button>
                <button class="calc-table-btn" id="reset-table-3" data-i18n-title="calc_group_wrap_button_reset_tooltip" title="重置包裹物表格内容为默认值"><span class="emoji">🔄</span><span class="text" data-i18n="common_reset">重置</span></button>
              </div>
            </div>
            <div class="calc-table-content" id="table-content-3">
              <div id="table3-header-wrapper">
                <table id="main-data-table-wrap" class="main-data-table calc-table calc-table-fixed">
                  <thead>
                    <tr>
                      <th data-i18n="calc_group_wrap_table_header_index">序号</th>
                      <th data-i18n="calc_group_wrap_table_header_thickness">厚度(mm)</th>
                      <th data-i18n="calc_group_wrap_table_header_delete">删除</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div id="table3-body-wrapper" class="u-scroll-y-auto u-max-h-164">
                <table id="main-data-table-wrap-body" class="main-data-table calc-table calc-table-fixed">
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- 制造公差区 -->
          <div class="group-tolerance">
            <div class="group-title">
              <div class="title-container"><span class="emoji">📐</span><span data-i18n="calc_group_tolerance_title">制造公差</span></div>
              <div class="group-actions">
                <button class="calc-table-btn" id="reset-tolerance" data-i18n-title="calc_group_tolerance_button_reset_tooltip" title="重置制造公差为默认值 (110%)"><span class="emoji">🔄</span><span class="text" data-i18n="calc_group_tolerance_button_reset">重置</span></button>
              </div>
            </div>
            <div class="drag-area-content">
              <input id="tolerance-range" type="range" min="100" max="200" value="110" class="drag-area-range" data-i18n-title="calc_input_tooltip_tolerance_range" title="拖动调整制造公差百分比 (100%-200%)">
              <div class="input-with-unit-wrapper">
                <input id="tolerance-input" type="text" value="110" class="drag-area-input" data-i18n-title="calc_input_tooltip_tolerance_input" title="输入制造公差百分比 (100-200)">
                <span class="drag-area-unit">%</span>
              </div>
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
              <div class="title-container"><span class="emoji">🖼️</span><span data-i18n="calc_group_simulation_title">截面模拟</span></div>
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
                  <span id="highlighted-avg-diameter" class="highlight-value" data-i18n-title="calc_result_highlight_tooltip" title="向上取整的最终平均直径，括号内为包含包裹物和公差的实际计算值 (保留两位小数)">--</span>
                </div>
                <!-- 输入统计区 -->
                <div class="group-stats input-summary-container detail-separator-top">
                  <!-- <div class="title-container"><span class="emoji">⚙️</span><span data-i18n="calc_group_stats_title">输入统计</span></div> -->
                  <div id="input-summary">
                    <div><span data-i18n="calc_group_stats_wire_count">总导线数量：</span><span id="total-wire-count" class="input-summary-value">0</span></div>
                    <div><span data-i18n="calc_group_stats_wrap_count">总包裹物层数：</span><span id="total-wrap-count" class="input-summary-value">0</span></div>
                    <div><span data-i18n="calc_group_stats_wrap_thickness">总包裹物厚度：</span><span id="total-wrap-thick" class="input-summary-value">0</span></div>
                  </div>
                </div>
                <!-- 直径计算详情区 -->
                <div class="group-result section-title detail-separator-top">
                <!-- <div class="title-container"><span class="emoji">📈</span><span data-i18n="calc_group_result_title">直径计算详情</span></div>-->
                </div>
                <table class="simulation-results-table">
                  <thead>
                    <tr>
                      <th data-i18n="calc_result_details_header_param">参数</th>
                      <th data-i18n="calc_result_details_header_bare">裸线值 (mm)</th>
                      <th data-i18n="calc_result_details_header_simulated">模拟值 (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td data-i18n="calc_result_details_label_min">最小线径</td>
                      <td><span id="min-wire-theoretical" data-i18n-title="calc_result_details_tooltip_theoretical" title="仅基于导线堆叠模拟计算的理论直径 (不含包裹物和公差)">--</span></td>
                      <td><span id="min-wire" data-i18n-title="calc_result_details_tooltip_final" title="包含包裹物厚度和制造公差的最终计算直径">--</span></td>
                    </tr>
                    <tr>
                      <td data-i18n="calc_result_details_label_max">最大线径</td>
                      <td><span id="max-wire-theoretical" data-i18n-title="calc_result_details_tooltip_theoretical" title="仅基于导线堆叠模拟计算的理论直径 (不含包裹物和公差)">--</span></td>
                      <td><span id="max-wire" data-i18n-title="calc_result_details_tooltip_final" title="包含包裹物厚度和制造公差的最终计算直径">--</span></td>
                    </tr>
                    <tr>
                      <td data-i18n="calc_result_details_label_avg">平均线径</td>
                      <td><span id="avg-wire-theoretical" data-i18n-title="calc_result_details_tooltip_theoretical" title="仅基于导线堆叠模拟计算的理论直径 (不含包裹物和公差)">--</span></td>
                      <td><span id="avg-wire" data-i18n-title="calc_result_details_tooltip_final" title="包含包裹物厚度和制造公差的最终计算直径">--</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- 计算结果区 -->
          <div class="group-result chart-container-wrapper">
            <div class="group-title chart-area-title"><div class="title-container"><span class="emoji">📊</span><span data-i18n="calc_results_chart_title">计算结果</span></div></div>
            <div class="results-chart-area" id="results-history-chart-container">
              <canvas id="results-history-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="calc-bottom-bar">
        <div class="history-save-option">
          <input type="checkbox" id="save-history-checkbox" data-i18n-title="calc_bottom_bar_save_history_tooltip" title="勾选后，每次计算结果将自动保存到历史记录中">
          <label for="save-history-checkbox" data-i18n="calc_bottom_bar_save_history" data-i18n-title="calc_bottom_bar_save_history_tooltip" title="勾选后，每次计算结果将自动保存到历史记录中">保存历史记录</label>
        </div>
        <button id="btn-export-image" class="action-bar-btn" data-i18n-title="calc_bottom_bar_export_image_tooltip" title="导出右侧结果为图片"><span class="emoji">🖼️</span><span class="text" data-i18n="calc_bottom_bar_export_image">导出结果</span></button>
        <button id="btn-page-reset-all" class="action-bar-btn btn-reset-action" data-i18n-title="calc_bottom_bar_reset_all_tooltip" title="重置页面所有输入项为默认值"><span class="emoji">🧹</span><span class="text" data-i18n="calc_bottom_bar_reset_all">全部重置</span></button>
        <button id="btn-page-calculate" class="action-bar-btn btn-calculate-action" data-i18n-title="calc_bottom_bar_calculate_tooltip" title="基于当前输入执行模拟计算并显示结果 (或按 Enter 键)"><span class="emoji">📏</span><span class="text" data-i18n="calc_bottom_bar_calculate">计算直径</span></button>
      </div>
    </div>
  `;

  // 使用 setTimeout 确保在操作 DOM 前，HTML 已被完全解析
  setTimeout(() => {
    // --- 状态变量 ---
    let lastSimulationCircles = null;
    let simulationHistoryChartInstance = null;
    let currentDiameterColorMap = []; // 存储当前的颜色映射

    // --- 状态管理函数 ---
    // 将状态管理函数移入 `setTimeout` 内部，以确保它们可以访问 `renderCalcPage` 的局部作用域变量
    function saveState() {
      const state = {
        standardRows: standardRows,
        specialRows: specialRows,
        wrapRows: wrapRows,
        tolerance: toleranceInput.value,
        saveHistory: document.getElementById("save-history-checkbox").checked,
      };
      setJSON("calcPageState", state);
    }

    function loadAndApplyState() {
      const state = getJSON("calcPageState");
      if (state) {
        standardRows = state.standardRows || standardRows;
        specialRows = state.specialRows || specialRows;
        wrapRows = state.wrapRows || wrapRows;
        toleranceInput.value = state.tolerance || "110";
        toleranceRange.value = state.tolerance || "110";
        document.getElementById("save-history-checkbox").checked =
          state.saveHistory || false;

        // 仅更新数据，不再从此函数中调用渲染
      }
    }

    // --- 输入框回车事件处理 ---
    function handleInputEnter(event) {
      if (event.key === "Enter") {
        event.target.blur(); // 触发 blur 以确保验证逻辑执行
        const calculateButton = document.getElementById("btn-page-calculate");
        if (calculateButton && !calculateButton.disabled) {
          calculateButton.click();
        }
        event.preventDefault();
      }
    }

    // --- 动态表格逻辑集成 ---
    const calcLayoutEl = container.querySelector(".layout-calc");
    if (!calcLayoutEl) {
      console.error(
        "renderCalcPage: .layout-calc element not found within the container.",
      );
      return;
    }

    // 导出按钮：默认不可见且不可用，待生成模拟后再启用
    const exportBtn = container.querySelector("#btn-export-image");
    if (exportBtn) {
      exportBtn.style.display = "none";
      exportBtn.disabled = true;
    }

    // --- 导出右侧为图片并预览（放置在作用域内以访问 calcLayoutEl/container） ---
    function openImagePreviewModal(dataUrl, blob) {
      const overlay = document.createElement("div");
      overlay.id = "image-export-modal";
      overlay.style.position = "fixed";
      overlay.style.left = "0";
      overlay.style.top = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.background = "rgba(0,0,0,0.6)";
      overlay.style.zIndex = "9999";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.padding = "24px";

      const modal = document.createElement("div");
      modal.style.background = "#fff";
      modal.style.borderRadius = "8px";
      modal.style.width = "70vw"; // 预览窗口更小
      modal.style.height = "70vh";
      modal.style.maxWidth = "900px";
      modal.style.maxHeight = "700px";
      modal.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
      modal.style.display = "flex";
      modal.style.flexDirection = "column";
      modal.style.overflow = "hidden";

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.justifyContent = "space-between";
      header.style.padding = "12px 16px";
      header.style.borderBottom = "1px solid #eee";
      const title = document.createElement("div");
      title.textContent = i18n.getMessage("export_preview_title");
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✖";
      closeBtn.title = "关闭预览";
      closeBtn.style.border = "none";
      closeBtn.style.background = "transparent";
      closeBtn.style.fontSize = "18px";
      closeBtn.style.cursor = "pointer";
      closeBtn.onclick = () => document.body.removeChild(overlay);
      header.appendChild(title);
      header.appendChild(closeBtn);

      const imgWrapper = document.createElement("div");
      imgWrapper.style.flex = "1";
      imgWrapper.style.overflow = "hidden"; // 适配窗口显示整图
      imgWrapper.style.background = "#f8f8f8";
      imgWrapper.style.display = "flex";
      imgWrapper.style.alignItems = "center";
      imgWrapper.style.justifyContent = "center";
      const imgEl = document.createElement("img");
      imgEl.src = dataUrl;
      imgEl.alt = "导出图片预览";
      imgEl.style.display = "block";
      imgEl.style.margin = "0";
      imgEl.style.maxWidth = "100%";
      imgEl.style.maxHeight = "100%"; // 最大高度约束，缩放以适配窗口
      imgEl.style.width = "auto";
      imgEl.style.height = "auto";
      imgWrapper.appendChild(imgEl);

      const footer = document.createElement("div");
      footer.style.display = "flex";
      footer.style.gap = "12px";
      footer.style.padding = "12px 16px";
      footer.style.borderTop = "1px solid #eee";
      footer.style.justifyContent = "flex-end";
      const copyBtn = document.createElement("button");
      copyBtn.textContent = i18n.getMessage("export_copy_image");
      copyBtn.className = "action-bar-btn";
      copyBtn.onclick = async () => {
        try {
          if (navigator.clipboard && window.ClipboardItem && blob) {
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            showToast(i18n.getMessage("export_copy_success"));
          } else {
            await navigator.clipboard.writeText(dataUrl);
            showToast(i18n.getMessage("export_copy_warning"), "warning");
          }
        } catch (err) {
          console.error("复制失败:", err);
          showToast(i18n.getMessage("export_copy_error"), "error");
        }
      };
      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = i18n.getMessage("export_download_image");
      downloadBtn.className = "action-bar-btn";
      downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `calc-right-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      footer.appendChild(copyBtn);
      footer.appendChild(downloadBtn);

      modal.appendChild(header);
      modal.appendChild(imgWrapper);
      modal.appendChild(footer);
      overlay.appendChild(modal);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          if (dataUrl && dataUrl.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(dataUrl);
            } catch (_) {}
          }
        }
      });

      document.body.appendChild(overlay);
    }

    async function exportRightAreaAsImage() {
      try {
        const rightEl = calcLayoutEl.querySelector(".layout-right");
        if (!rightEl) {
          showToast(i18n.getMessage("export_not_found_right"), "error");
          return;
        }
        if (!window.html2canvas) {
          showToast(i18n.getMessage("export_lib_not_loaded"), "error");
          return;
        }
        const scale = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
        const canvas = await window.html2canvas(rightEl, {
          backgroundColor: "#ffffff",
          scale,
          useCORS: true,
          scrollX: window.scrollX || 0,
          scrollY: window.scrollY || 0,
        });
        canvas.toBlob((blob) => {
          const url = blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/png");
          openImagePreviewModal(url, blob || null);
        }, "image/png");
      } catch (e) {
        console.error("导出图片失败:", e);
        showToast(i18n.getMessage("export_failed"), "error");
      }
    }

    // --- DOM元素引用 ---
    // 在顶层作用域获取对需要更新的元素的引用
    const totalWireCountEl = calcLayoutEl.querySelector("#total-wire-count");
    const totalWrapCountEl = calcLayoutEl.querySelector("#total-wrap-count");
    const totalWrapThickEl = calcLayoutEl.querySelector("#total-wrap-thick");

    const table1Body = calcLayoutEl.querySelector(
      "#main-data-table-standard-body tbody",
    );
    const addRowBtn1 = calcLayoutEl.querySelector("#add-row-1");
    const resetBtn1 = calcLayoutEl.querySelector("#reset-table-1");
    const standardSelectEl = calcLayoutEl.querySelector("#wire-standard-select");
    const standardLoadingEl = calcLayoutEl.querySelector("#wire-standard-loading");
    let standardRows = [
      { gauge: "0.35", type: "", od: "", qty: "0" },
      { gauge: "0.5", type: "", od: "", qty: "0" },
    ];
    // let standardWireList = standardWiresData; // 移除静态列表初始化

    // 在这里获取最新的导线数据（标准库+自定义合并）
    let currentStandardWires = [];
    let currentWireOdTable = {};
    let baseStandardData = [];
    const SESSION_KEY_SELECTED_STANDARD = "wireStandard:selected";

    async function listDatabaseStandards() {
      try {
        const readmeUrl =
          typeof chrome !== "undefined" &&
          chrome.runtime &&
          typeof chrome.runtime.getURL === "function"
            ? chrome.runtime.getURL("src/storage/Database/mspec.README.md")
            : "src/storage/Database/mspec.README.md";
        const resp = await fetch(readmeUrl);
        if (!resp.ok) throw new Error("readme not found");
        const text = await resp.text();
        const re = /([A-Za-z0-9_\\-]+)\\.indexed\\.json/g;
        const names = new Set();
        let m;
        while ((m = re.exec(text)) !== null) {
          names.add(m[1]);
        }
        const arr = Array.from(names);
        if (arr.length) return arr.sort();
        throw new Error("no names");
      } catch (_) {
        return [
          "Aptiv_M-Spec",
          "FCA_MS90034_36",
          "Fiat_91107",
          "Ford_WSK1A348A2",
          "GMW_15626",
          "ISO_6722-1",
          "ISO_6722-2",
          "Japanese_UTW",
          "LV_112",
          "LV_112_old_AL_gauges",
          "PSA_9641879499",
          "Renault_3605009L",
          "Renault_3605009P",
          "SouthWire_Alu",
        ];
      }
    }

    function updateWireDataSources() {
      currentStandardWires = getEffectiveStandardWires(baseStandardData);
      // 构建线规列表和OD表
      currentWireOdTable = {};
      currentStandardWires.forEach((item) => {
        const key = String(item.gauge);
        const odMap = {};
        // 优先使用原始类型字典
        if (item.rawTypes && typeof item.rawTypes === "object") {
          Object.keys(item.rawTypes).forEach((k) => {
            const v = item.rawTypes[k];
            const num = v == null ? null : Number(v);
            odMap[k] = Number.isFinite(num) ? num : null;
          });
        } else {
          // 兼容含 thin/thick/ultraThin 字段的结构
          if (item.ultraThin !== undefined) {
            const num = item.ultraThin == null ? null : Number(item.ultraThin);
            odMap["ultraThin"] = Number.isFinite(num) ? num : null;
          }
          if (item.thin !== undefined) {
            const num = item.thin == null ? null : Number(item.thin);
            odMap["thin"] = Number.isFinite(num) ? num : null;
          }
          if (item.thick !== undefined) {
            const num = item.thick == null ? null : Number(item.thick);
            odMap["thick"] = Number.isFinite(num) ? num : null;
          }
        }
        currentWireOdTable[key] = { od: odMap, _label: item.gaugeLabel || String(item.gauge) };
      });
    }

    async function initStandardDropdown() {
      try {
        if (standardLoadingEl) standardLoadingEl.style.display = "inline";
        const list = await listDatabaseStandards();
        if (standardSelectEl) {
          standardSelectEl.innerHTML = "";
          list.forEach((name, idx) => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            standardSelectEl.appendChild(opt);
          });
          // 选择默认或会话保存值
          let selected = sessionStorage.getItem(SESSION_KEY_SELECTED_STANDARD);
          if (!selected && list.length > 0) selected = list[0];
          if (selected) standardSelectEl.value = selected;
        }
        await applySelectedStandard();
      } catch (e) {
        console.error("初始化标准选择失败:", e);
        showToast(i18n.getMessage("wire_standard_load_failed") || "标准加载失败，已回退默认", "error");
        baseStandardData = [];
        updateWireDataSources();
      } finally {
        if (standardLoadingEl) standardLoadingEl.style.display = "none";
      }
      // 绑定切换事件
      if (standardSelectEl) {
        standardSelectEl.addEventListener("change", async () => {
          try {
            if (standardLoadingEl) standardLoadingEl.style.display = "inline";
            await applySelectedStandard();
          } catch (e) {
            console.error("切换标准失败:", e);
            showToast(i18n.getMessage("wire_standard_switch_failed") || "标准切换失败，已回退默认", "error");
            baseStandardData = [];
            updateWireDataSources();
            renderStandardTable(); // 重新渲染
          } finally {
            if (standardLoadingEl) standardLoadingEl.style.display = "none";
          }
        });
      }
    }

    async function applySelectedStandard() {
      const selectedName = standardSelectEl ? standardSelectEl.value : "";
      if (selectedName) {
        mspecService.setSource(selectedName);
        await mspecService.load();
        baseStandardData = [];
        sessionStorage.setItem(SESSION_KEY_SELECTED_STANDARD, selectedName);
      } else {
        baseStandardData = [];
      }
      const optsAll = mspecService.buildOptions();
      const wireSizes = Array.isArray(optsAll.wireSizes) ? optsAll.wireSizes : [];
      const mergedWireSizes = buildGaugeOptionsWithCustomFirst(wireSizes);
      const firstWire = mergedWireSizes[0] || "";
      standardRows = standardRows.map((row) => {
        const curGauge = String(row.gauge || "");
        const nextGauge = mergedWireSizes.includes(curGauge) ? curGauge : firstWire;
        const optsForGauge = nextGauge
          ? mspecService.buildOptions({ wireSize: [nextGauge] })
          : { wallThicknesses: [] };
        const types = Array.isArray(optsForGauge.wallThicknesses)
          ? optsForGauge.wallThicknesses.map((v) => String(v))
          : [];
        const curType = String(row.type || "");
        const nextType = types.includes(curType) ? curType : (types[0] || "");
        const nextRow = { ...row, gauge: nextGauge, type: nextType };
        updateOD(nextRow);
        return nextRow;
      });
      renderStandardRows();
    }

    updateWireDataSources();
    initStandardDropdown();

    // --- 特殊导线表格逻辑变量 ---
    const table2Body = calcLayoutEl.querySelector(
      "#main-data-table-special-body tbody",
    );
    const addRowBtn2 = calcLayoutEl.querySelector("#add-row-2");
    const resetBtn2 = calcLayoutEl.querySelector("#reset-table-2");
    let specialRows = [{ od: "2.5", qty: "0" }];

    // --- 包裹物表格逻辑变量 ---
    const table3Body = calcLayoutEl.querySelector(
      "#main-data-table-wrap-body tbody",
    );
    const addRowBtn3 = calcLayoutEl.querySelector("#add-row-3");
    const resetBtn3 = calcLayoutEl.querySelector("#reset-table-3");
    let wrapRows = [{ thick: "0.5" }];

    // 实时统计输入区内容
    function updateInputSummary() {
      // Calculations can be done synchronously
      let totalWire = 0;
      standardRows.forEach((row) => {
        const n = parseInt(row.qty, 10);
        if (!isNaN(n) && n > 0 && parseFloat(row.od) > 0) totalWire += n;
      });
      specialRows.forEach((row) => {
        const n = parseInt(row.qty, 10);
        if (!isNaN(n) && n > 0 && parseFloat(row.od) > 0) totalWire += n;
      });
      const totalWrapCount = wrapRows.filter(
        (r) => parseFloat(r.thick) > 0,
      ).length;
      let totalWrapThick = 0;
      wrapRows.forEach((row) => {
        const t = parseFloat(row.thick);
        if (!isNaN(t) && t > 0) totalWrapThick += t;
      });

      // 直接使用预先查询的DOM元素引用进行更新
      if (totalWireCountEl) {
        totalWireCountEl.textContent = totalWire;
      } else {
        console.warn(
          "updateInputSummary: #total-wire-count element not found on init.",
        );
      }

      if (totalWrapCountEl) {
        totalWrapCountEl.textContent = totalWrapCount;
      } else {
        console.warn(
          "updateInputSummary: #total-wrap-count element not found on init.",
        );
      }

      if (totalWrapThickEl) {
        totalWrapThickEl.textContent = totalWrapThick.toFixed(2);
      } else {
        console.warn(
          "updateInputSummary: #total-wrap-thick element not found on init.",
        );
      }
    }

    // 匹配直径 - 不再触发UI更新
    function updateOD(row) {
      const selectedGaugeStr = String(row.gauge || "");
      const selectedType = String(row.type || "");
      if (!selectedGaugeStr || !selectedType) {
        row.od = "";
        return;
      }
      const result = mspecService.resolveMaxOD({
        wireSize: [selectedGaugeStr],
        wallThickness: [selectedType],
      });
      if ((result.ids || []).length > 1) {
        console.debug(
          "Multiple matches, choose max Cable Outside Diameter",
          selectedGaugeStr,
          selectedType,
          result.ids.length,
          result.maxOd,
        );
        recordMultiMatch({
          wireSize: selectedGaugeStr,
          wallThickness: selectedType,
          count: result.ids.length,
          maxOd: result.maxOd,
          items: Array.isArray(result.items) ? result.items : [],
        });
      }
      if (result.maxOd != null) {
        row.od = result.maxOd;
        return;
      }
      const odEntry = currentWireOdTable[selectedGaugeStr];
      if (odEntry && odEntry.od) {
        const mapKey = (() => {
          const l = selectedType.toLowerCase().replace(/\s+/g, "");
          if (l === "thin") return "thin";
          if (l === "thick") return "thick";
          if (l === "ultrathin") return "ultraThin";
          return selectedType;
        })();
        const val = odEntry.od[mapKey];
        const num = val == null ? NaN : Number(val);
        row.od = Number.isFinite(num) && num > 0 ? num : "";
        return;
      }
      row.od = "";
    }

    // 渲染标准导线表格
    function renderStandardRows() {

      const table1BodyWrapper = calcLayoutEl.querySelector(
        "#table1-body-wrapper",
      );
      table1BodyWrapper.style.overflowY = "auto";
      if (standardRows.length >= 4) {
        table1BodyWrapper.style.maxHeight = "164px";
      } else {
        table1BodyWrapper.style.maxHeight = "";
      }
      table1Body.innerHTML = "";
      const optsAll = mspecService.buildOptions();
      const mergedWireSizes = buildGaugeOptionsWithCustomFirst(optsAll.wireSizes || []);
      const allGaugeOptions = mergedWireSizes.map((v) => ({
        value: String(v),
        label: String(v),
      }));
      standardRows.forEach((row, idx) => {
        const tr = document.createElement("tr");
        // 序号
        const tdIndex = document.createElement("td");
        tdIndex.textContent = idx + 1;
        tr.appendChild(tdIndex);
        // 线径
        const tdGauge = document.createElement("td");
        const selectGauge = document.createElement("select");
        const chooseLabel = i18n.getMessage("calc_select_placeholder_choose");
        selectGauge.innerHTML =
          `<option value="">${chooseLabel}</option>` +
          allGaugeOptions
            .map(
              (opt) =>
                `<option value="${opt.value}" ${String(row.gauge) === opt.value ? "selected" : ""}>${opt.label}</option>`,
            )
            .join("");
        selectGauge.value = row.gauge || "";
        selectGauge.onchange = (e) => {
          row.gauge = e.target.value;
          updateOD(row);
          renderStandardRows();
        };
        tdGauge.appendChild(selectGauge);
        tr.appendChild(tdGauge);
        // 类型
        const tdType = document.createElement("td");
        const selectType = document.createElement("select");
        let availableTypes = [];
        const selectedGaugeStr = String(row.gauge || "");
        const optsForGauge = selectedGaugeStr
          ? mspecService.buildOptions({ wireSize: [selectedGaugeStr] })
          : { wallThicknesses: [] };
        availableTypes = (optsForGauge.wallThicknesses || []).map((v) => String(v));
        const noTypesFromService = availableTypes.length === 0;
        if (noTypesFromService) {
          const odMap = (currentWireOdTable[selectedGaugeStr] || {}).od || {};
          const keys = Object.keys(odMap);
          const mapped = keys.map((k) => {
            const lower = String(k).toLowerCase();
            if (lower === "thin") return "Thin";
            if (lower === "thick") return "Thick";
            if (lower === "ultrathin") return "Ultra Thin";
            return String(k);
          });
          availableTypes = mapped.filter((v) => v != null && v !== "");
        }
        if (!availableTypes.includes(row.type)) {
          row.type = availableTypes[0] || "";
          updateOD(row);
        }
        const chooseTypeLabel = i18n.getMessage("calc_select_placeholder_choose");
        selectType.innerHTML = `<option value="">${chooseTypeLabel}</option>`;
        availableTypes.forEach((type) => {
          const opt = document.createElement("option");
          opt.value = type;
          opt.textContent = type;
          if (row.type === type) opt.selected = true;
          selectType.appendChild(opt);
        });
        selectType.value = row.type || availableTypes[0] || "";
        selectType.onchange = (e) => {
          row.type = e.target.value;
          updateOD(row);
          renderStandardRows();
        };
        tdType.appendChild(selectType);
        tr.appendChild(tdType);
        // 直径
        const tdOD = document.createElement("td");
        tdOD.textContent = row.od || "";
        tr.appendChild(tdOD);
        // 数量
        const tdQty = document.createElement("td");
        const inputQty = document.createElement("input");
        inputQty.type = "text";
        inputQty.value = row.qty || "";
        inputQty.placeholder = i18n.getMessage("calc_input_placeholder_qty");
        inputQty.maxLength = 4;
        inputQty.className = "input-qty";
        if (availableTypes.length === 0) {
          inputQty.disabled = true;
          tdOD.textContent = "";
        }
        inputQty.oninput = (e) => {
          row.qty = e.target.value;
          updateInputSummary();
        };
        inputQty.addEventListener("keydown", handleInputEnter);
        tdQty.appendChild(inputQty);
        tr.appendChild(tdQty);
        // 删除
        const tdDel = document.createElement("td");
        const btnDel = document.createElement("button");
        btnDel.textContent = "❌";
        btnDel.title = "删除此行";
        btnDel.onclick = () => {
          standardRows.splice(idx, 1);
          renderStandardRows();
        };
        tdDel.appendChild(btnDel);
        tr.appendChild(tdDel);
        if (idx === standardRows.length - 1 && renderStandardRows._focusNext) {
          setTimeout(() => {
            inputQty.focus();
            inputQty.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 0);
        }
        table1Body.appendChild(tr);
      });
      renderStandardRows._focusNext = false;
      updateInputSummary();
    }

    // 增加一行
    addRowBtn1.onclick = () => {
      standardRows.push({ gauge: "", type: "", od: "", qty: "1" }); // Add an empty row, or a different default if preferred
      // updateOD might not be necessary if gauge/type are empty
      renderStandardRows._focusNext = true;
      renderStandardRows();
    };
    // 重置
    resetBtn1.onclick = () => {
      standardRows = [
        { gauge: "0.35", type: "Thin", od: "", qty: "0" },
        { gauge: "0.5", type: "Thin", od: "", qty: "0" },
      ];
      standardRows.forEach((row) => updateOD(row)); // Ensure OD is updated on reset
      renderStandardRows();
    };

    // --- 特殊导线表格逻辑 ---
    function renderSpecialRows() {
      // 滚动条逻辑：始终显示滚动条轨道
      const table2BodyWrapper = calcLayoutEl.querySelector(
        "#table2-body-wrapper",
      );
      table2BodyWrapper.style.overflowY = "auto"; // Always show scrollbar track
      if (specialRows.length >= 4) {
        table2BodyWrapper.style.maxHeight = "164px";
      } else {
        table2BodyWrapper.style.maxHeight = "";
      }
      table2Body.innerHTML = "";
      specialRows.forEach((row, idx) => {
        const tr = document.createElement("tr");
        // 序号
        const tdIndex = document.createElement("td");
        tdIndex.textContent = idx + 1;
        tr.appendChild(tdIndex);
        // 直径
        const tdOD = document.createElement("td");
        const inputOD = document.createElement("input");
        inputOD.type = "text";
        inputOD.value = row.od || "";
        inputOD.placeholder = i18n.getMessage("calc_input_placeholder_od");
        inputOD.maxLength = 8;
        inputOD.className = "input-od";
        inputOD.oninput = (e) => {
          row.od = e.target.value;
          updateInputSummary();
        };
        inputOD.addEventListener("keydown", handleInputEnter);
        tdOD.appendChild(inputOD);
        tr.appendChild(tdOD);
        // 数量
        const tdQty = document.createElement("td");
        const inputQty = document.createElement("input");
        inputQty.type = "text";
        inputQty.value = row.qty || "";
        inputQty.placeholder = i18n.getMessage("calc_input_placeholder_qty");
        inputQty.maxLength = 4;
        inputQty.className = "input-qty";
        inputQty.oninput = (e) => {
          row.qty = e.target.value;
          updateInputSummary();
        };
        inputQty.addEventListener("keydown", handleInputEnter);
        tdQty.appendChild(inputQty);
        tr.appendChild(tdQty);
        // 删除
        const tdDel = document.createElement("td");
        const btnDel = document.createElement("button");
        btnDel.textContent = "❌";
        btnDel.title = "删除此行";
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
            inputQty.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 0);
        }
        table2Body.appendChild(tr);
      });
      renderSpecialRows._focusNext = false;
      updateInputSummary();
    }

    addRowBtn2.onclick = () => {
      specialRows.push({ od: "", qty: "1" }); // Add an empty row
      renderSpecialRows._focusNext = true;
      renderSpecialRows();
    };
    resetBtn2.onclick = () => {
      specialRows = [{ od: "2.5", qty: "0" }];
      renderSpecialRows();
    };
    renderSpecialRows();

    // --- 包裹物表格逻辑 ---
    function renderWrapRows() {
      // 滚动条逻辑：始终显示滚动条轨道
      const table3BodyWrapper = calcLayoutEl.querySelector(
        "#table3-body-wrapper",
      );
      table3BodyWrapper.style.overflowY = "auto"; // Always show scrollbar track
      if (wrapRows.length >= 4) {
        table3BodyWrapper.style.maxHeight = "164px";
      } else {
        table3BodyWrapper.style.maxHeight = "";
      }
      table3Body.innerHTML = "";
      wrapRows.forEach((row, idx) => {
        const tr = document.createElement("tr");
        // 序号
        const tdIndex = document.createElement("td");
        tdIndex.textContent = idx + 1;
        tr.appendChild(tdIndex);
        // 厚度
        const tdThick = document.createElement("td");
        const inputThick = document.createElement("input");
        inputThick.type = "text";
        inputThick.value = row.thick || "";
        inputThick.placeholder = i18n.getMessage(
          "calc_input_placeholder_thick",
        );
        inputThick.maxLength = 6;
        inputThick.className = "input-thick";
        inputThick.oninput = (e) => {
          row.thick = e.target.value;
          updateInputSummary();
        };
        inputThick.addEventListener("keydown", handleInputEnter);
        tdThick.appendChild(inputThick);
        tr.appendChild(tdThick);
        // 删除
        const tdDel = document.createElement("td");
        const btnDel = document.createElement("button");
        btnDel.textContent = "❌";
        btnDel.title = "删除此行";
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
            inputThick.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 0);
        }
        table3Body.appendChild(tr);
      });
      renderWrapRows._focusNext = false;
      updateInputSummary();
    }

    addRowBtn3.onclick = () => {
      wrapRows.push({ thick: "" }); // Add an empty row
      renderWrapRows._focusNext = true;
      renderWrapRows();
    };
    resetBtn3.onclick = () => {
      wrapRows = [{ thick: "0.5" }];
      renderWrapRows();
    };
    renderWrapRows();

    // 拖动条区域联动逻辑
    const toleranceRange = calcLayoutEl.querySelector("#tolerance-range");
    const toleranceInput = calcLayoutEl.querySelector("#tolerance-input");
    // 拖动滑块时实时刷新输入框
    toleranceRange.oninput = function () {
      toleranceInput.value = this.value;
    };
    // 只在输入框失去焦点时刷新滑块
    toleranceInput.onblur = function () {
      let val = parseInt(this.value, 10);
      if (isNaN(val)) val = 100;
      if (val < 100) val = 100;
      if (val > 200) val = 200;
      this.value = val;
      toleranceRange.value = val;
    };
    // 计算次数拖动条联动逻辑
    const scoreRange = calcLayoutEl.querySelector("#score-range");
    const scoreInput = calcLayoutEl.querySelector("#score-input");
    if (scoreRange) {
      scoreRange.oninput = function () {
        if (scoreInput) scoreInput.value = this.value;
      };
    }
    if (scoreInput) {
      scoreInput.onblur = function () {
        let val = parseInt(this.value, 10);
        if (isNaN(val)) val = 10;
        if (val < 1) val = 1;
        if (val > 100) val = 100;
        this.value = val;
        if (scoreRange) scoreRange.value = val;
      };
    }

    // 在每次渲染表格后调用
    const oldRenderStandardRows = renderStandardRows;
    renderStandardRows = function () {
      oldRenderStandardRows();
      updateInputSummary();
    };
    const oldRenderSpecialRows = renderSpecialRows;
    renderSpecialRows = function () {
      oldRenderSpecialRows();
      updateInputSummary();
    };
    const oldRenderWrapRows = renderWrapRows;
    renderWrapRows = function () {
      oldRenderWrapRows();
      updateInputSummary();
    };

    const resetToleranceBtn = calcLayoutEl.querySelector("#reset-tolerance");
    const resetScoreBtn = calcLayoutEl.querySelector("#reset-score");

    if (resetToleranceBtn && toleranceRange && toleranceInput) {
      resetToleranceBtn.onclick = () => {
        toleranceRange.value = "110";
        toleranceInput.value = "110";
      };
    }
    if (resetScoreBtn && scoreRange && scoreInput) {
      resetScoreBtn.onclick = () => {
        scoreRange.value = "10";
        scoreInput.value = "10";
      };
    }


    // 清除模拟结果和图表的函数
    function clearSimulationResults() {
      // 清除画布
      const canvasEl = calcLayoutEl.querySelector("#simulation-canvas");
      if (canvasEl) {
        const ctx = canvasEl.getContext("2d");
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      }
      // Clear final values in table
      calcLayoutEl.querySelector("#min-wire").textContent = "--";
      calcLayoutEl.querySelector("#max-wire").textContent = "--";
      calcLayoutEl.querySelector("#avg-wire").textContent = "--";
      // Clear theoretical values in table
      calcLayoutEl.querySelector("#min-wire-theoretical").textContent = "--";
      calcLayoutEl.querySelector("#max-wire-theoretical").textContent = "--";
      calcLayoutEl.querySelector("#avg-wire-theoretical").textContent = "--";
      // Clear highlighted value (reset innerHTML)
      const highlightedAvgEl = calcLayoutEl.querySelector(
        "#highlighted-avg-diameter",
      );
      if (highlightedAvgEl) highlightedAvgEl.innerHTML = "--";
      // 清除历史图表
      if (simulationHistoryChartInstance) {
        simulationHistoryChartInstance.destroy();
        simulationHistoryChartInstance = null;
      }
      lastSimulationCircles = null; // 重置最后一次模拟数据
      currentDiameterColorMap = []; // 清除颜色映射
      renderLegend([]); // 清空图例显示
      // 清理时禁用并隐藏导出按钮
      if (exportBtn) {
        exportBtn.style.display = "none";
        exportBtn.disabled = true;
      }
    }

    // 统一的输入收集与校验流程已抽离至 ./calc/inputCollector.js
    // 请使用从该模块导入的 collectAndValidateInputs(params)

    // Event listeners for the new bottom bar buttons
    const btnPageResetAll = container.querySelector("#btn-page-reset-all");
    if (btnPageResetAll) {
      btnPageResetAll.onclick = async () => {
        const ok = await showConfirm(i18n.getMessage("calc_confirm_reset_all"));
        if (ok) {
          if (resetBtn1) resetBtn1.click();
          if (resetBtn2) resetBtn2.click();
          if (resetBtn3) resetBtn3.click();
          if (resetToleranceBtn) resetToleranceBtn.click();
          if (resetScoreBtn) resetScoreBtn.click();
          document.getElementById("max-wire").textContent = "";
          document.getElementById("min-wire").textContent = "";
          document.getElementById("avg-wire").textContent = "";
        }
      };
    }

    const btnPageCalculate = container.querySelector("#btn-page-calculate");
    if (btnPageCalculate) {
      btnPageCalculate.onclick = () => {
        btnPageCalculate.disabled = true;
        btnPageCalculate.textContent = i18n.getMessage(
          "calc_bottom_bar_calculating",
        );

        // 统一收集并校验输入
        const params = getSimulationParameters();
        const state = collectAndValidateInputs({
          standardRows,
          specialRows,
          wrapRows,
          toleranceValue: toleranceInput.value,
          scoreValue: params.SIMULATION_COUNT,
        });
        if (!state.ok) {
           showToast(i18n.getMessage("calc_message_no_valid_wires"), "warning");
           btnPageCalculate.disabled = false;
           btnPageCalculate.textContent = i18n.getMessage(
             "calc_bottom_bar_calculate",
           );
           return;
         }
         if (state.warnings && state.warnings.length) {
           state.warnings.forEach((msg) => showToast(msg, "warning"));
         }
         const {
           wireRadii,
           totalWrappingThickness,
           numSimulations,
           toleranceFactor,
         } = state;
 
         // 清除旧结果和画布/图表
         clearSimulationResults();
        calcLayoutEl.querySelector("#min-wire").textContent = "计算中";
        calcLayoutEl.querySelector("#max-wire").textContent = "计算中";
        calcLayoutEl.querySelector("#avg-wire").textContent = "计算中";

        // 使用 setTimeout 异步执行，防止UI阻塞
        setTimeout(() => {
          const simulationDiameters = []; // 存储每次模拟的堆叠直径（不含包裹和公差）
          let tempLastCirclesData = null; // 临时存储最后一次模拟的圆形数据
          currentDiameterColorMap = []; // 重置颜色映射

          try {
            // 收集所有唯一导线直径用于颜色映射和图例
            const uniqueDiameters = new Set();
            const wireInfoForLegend = []; // 存储用于图例的导线信息 {diameter, type, originalValue}

            standardRows.forEach((row) => {
              const qty = parseInt(String(row.qty).trim(), 10);
              const od = parseFloat(String(row.od).replace(",", "."));
              if (!isNaN(qty) && qty > 0 && !isNaN(od) && od > 0) {
                uniqueDiameters.add(od);
                if (row.gauge) {
                  // 确保 gauge 存在
                  wireInfoForLegend.push({
                    diameter: od,
                    type: "standard",
                    originalValue: row.gauge,
                  });
                } else {
                  // 如果标准导线没有 gauge (理论上不应发生，但作为回退)
                  wireInfoForLegend.push({
                    diameter: od,
                    type: "standard_no_gauge",
                    originalValue: od,
                  });
                }
              }
            });
            specialRows.forEach((row) => {
              const qty = parseInt(String(row.qty).trim(), 10);
              const od = parseFloat(String(row.od).replace(",", "."));
              if (!isNaN(qty) && qty > 0 && !isNaN(od) && od > 0) {
                uniqueDiameters.add(od);
                wireInfoForLegend.push({
                  diameter: od,
                  type: "special",
                  originalValue: od,
                });
              }
            });

            const sortedUniqueDiameters = Array.from(uniqueDiameters).sort(
              (a, b) => a - b,
            );
            currentDiameterColorMap = []; // 重置

            sortedUniqueDiameters.forEach((diameter, index) => {
              // 从 wireInfoForLegend 中找到这个直径的代表性信息来决定 displayValue
              // 我们取第一个匹配该直径的导线信息
              const representativeWire = wireInfoForLegend.find(
                (w) => Math.abs(w.diameter - diameter) < 1e-6,
              );
              let displayValue = "";

              if (representativeWire) {
                if (representativeWire.type === "standard") {
                  displayValue = representativeWire.originalValue; // 这是 gauge
                } else if (representativeWire.type === "special") {
                  displayValue = `${representativeWire.originalValue.toFixed(3)} mm`;
                } else {
                  // standard_no_gauge or other unexpected
                  displayValue = `${diameter.toFixed(3)} mm`;
                }
              } else {
                // 理论上不应该到这里，因为 sortedUniqueDiameters 来自 wireInfoForLegend 的直径
                displayValue = `${diameter.toFixed(3)} mm`;
              }

              const color =
                index < WIRE_COLORS.length ? WIRE_COLORS[index] : DEFAULT_WIRE_COLOR;
              currentDiameterColorMap.push({
                diameter: diameter,
                displayValue: displayValue,
                color,
              });
            });
            // 如果唯一线径数量超过预定义颜色，可以考虑给超出的分配一个默认颜色，
            // 但当前逻辑是循环使用，对于非常多的唯一线径可能导致颜色重复。
            // 或者，可以修改上面的逻辑，当 index >= WIRE_COLORS.length 时，统一使用 DEFAULT_WIRE_COLOR。
            // 例如: color: index < WIRE_COLORS.length ? WIRE_COLORS[index] : DEFAULT_WIRE_COLOR

            const params = getSimulationParameters();
            let anyNotConverged = false;
            let notConvergedCount = 0;
            let tempLastSimResult = null;
            for (let i = 0; i < numSimulations; i++) {
              // 注意：runSingleSimulation 需要半径数组
              const result = runSingleSimulation([...wireRadii], params);
              if (
                result &&
                typeof result.containerRadius === "number" &&
                result.containerRadius > 1e-9
              ) {
                simulationDiameters.push(result.containerRadius * 2); // 存储的是直径
                if (i === numSimulations - 1) {
                  tempLastCirclesData = result.finalCircles;
                  tempLastSimResult = result;
                }
                if (result.converged === false) {
                  anyNotConverged = true;
                  notConvergedCount++;
                }
              } else {
                console.warn(`模拟 ${i + 1} 返回无效或零半径结果:`, result);
              }
            }
            if (anyNotConverged) {
              showToast(
                i18n.getMessage("calc_message_simulation_not_converged") ||
                  "部分模拟未收敛，建议提高次数或调整参数",
                "warning",
              );
            }

            if (simulationDiameters.length > 0) {
              lastSimulationCircles = tempLastCirclesData; // 更新页面级别的状态

              const minSimOD = Math.min(...simulationDiameters);
              const maxSimOD = Math.max(...simulationDiameters);
              const sumSimOD = simulationDiameters.reduce((a, b) => a + b, 0);
              const avgSimOD = sumSimOD / simulationDiameters.length;

              const addedDiameterFromWrapping = 2 * totalWrappingThickness;

              // Calculate final average diameter precisely
              const finalAvgODValue =
                (avgSimOD + addedDiameterFromWrapping) * toleranceFactor;

              const panelId = "convergence-panel";
              const oldPanel = document.getElementById(panelId);
              if (oldPanel) oldPanel.remove();
              const panel = document.createElement("div");
              panel.id = panelId;
              panel.style.marginTop = "8px";
              panel.style.padding = "8px";
              panel.style.border = "1px solid #ddd";
              panel.style.borderRadius = "6px";
              panel.style.background = "#fff";
              const successRate = Math.round(((numSimulations - notConvergedCount) / numSimulations) * 100);
              let series = [];
              let threshold = params.CONVERGENCE_THRESHOLD;
              let iters = 0;
              let convergedFlag = true;
              let finalResid = 0;
              if (tempLastSimResult && Array.isArray(tempLastSimResult.convergenceSeries)) {
                series = tempLastSimResult.convergenceSeries.slice();
                threshold = params.CONVERGENCE_THRESHOLD;
                iters = tempLastSimResult.iterations || 0;
                convergedFlag = !!tempLastSimResult.converged;
                finalResid = tempLastSimResult.finalAvgPenetration || 0;
              }
              const width = 240;
              const height = 48;
              const maxY = Math.max(threshold * 1.2, ...series, 0.001);
              const pts = series.map((v, idx) => {
                const x = (idx / Math.max(series.length - 1, 1)) * (width - 8) + 4;
                const y = height - (v / maxY) * (height - 8) - 4;
                return `${x},${y}`;
              }).join(" ");
              const thresholdY = height - (threshold / maxY) * (height - 8) - 4;
              const svg = `<svg width="${width}" height="${height}">
                <polyline points="${pts}" fill="none" stroke="#2f7" stroke-width="2"/>
                <line x1="4" y1="${thresholdY}" x2="${width-4}" y2="${thresholdY}" stroke="#f55" stroke-dasharray="4,3" stroke-width="1"/>
              </svg>`;
              const html = `
                <div class="u-flex-center" style="gap:12px;">
                  <div>${svg}</div>
                  <div style="font-size:12px;line-height:18px;">
                    <div>最终残差：${finalResid.toFixed(6)}</div>
                    <div>是否收敛：${convergedFlag ? "是" : "否"}</div>
                    <div>主循环迭代：${iters}</div>
                    <div>批量成功率：${successRate}%</div>
                  </div>
                </div>
              `;
              panel.innerHTML = html;
              const target = document.querySelector(".calc-right") || document.body;
              target.appendChild(panel);
              const accelSet = [1.2, 1.4];
              const thrSet = [0.0012, 0.001];
              const stepSet = [12, 15];
              const combos = [];
              for (let a of accelSet) {
                for (let t of thrSet) {
                  for (let s of stepSet) {
                    combos.push({ a, t, s });
                  }
                }
              }
              let best = null;
              for (let c of combos) {
                let ok = 0;
                let iterSum = 0;
                for (let k = 0; k < 3; k++) {
                  const p = { ...params, ACCELERATION: c.a, CONVERGENCE_THRESHOLD: c.t, MAX_ITERATIONS_PACKSTEP: c.s };
                  const r = runSingleSimulation([...wireRadii], p);
                  if (r && r.converged) ok++;
                  iterSum += (r && typeof r.iterations === "number") ? r.iterations : 0;
                }
                const rate = ok / 3;
                const avgIter = iterSum / 3;
                if (!best || rate > best.rate || (rate === best.rate && avgIter < best.avgIter)) {
                  best = { rate, avgIter, a: c.a, t: c.t, s: c.s };
                }
              }
              if (best) {
                const line = document.createElement("div");
                line.style.marginTop = "6px";
                line.style.fontSize = "12px";
                line.textContent = `建议参数：ACCEL=${best.a.toFixed(2)} 阈值=${best.t.toFixed(4)} 步迭代=${best.s}，预计成功率=${Math.round(best.rate*100)}% 平均主迭代=${Math.round(best.avgIter)}`;
                panel.appendChild(line);
              }

              // Calculate display values
              const finalAvgODTextTable = !isNaN(finalAvgODValue)
                ? finalAvgODValue.toFixed(3) + " mm"
                : i18n.getMessage("calc_result_error");
              const finalAvgODCeilInt = !isNaN(finalAvgODValue)
                ? Math.ceil(finalAvgODValue)
                : "-";
              const finalAvgODPrecise = !isNaN(finalAvgODValue)
                ? finalAvgODValue.toFixed(2)
                : "-";
              const finalAvgODHighlightHTML = !isNaN(finalAvgODValue)
                ? `${finalAvgODCeilInt} mm <span class="precise-value">(${finalAvgODPrecise})</span>`
                : i18n.getMessage("calc_result_error");

              // Theoretical values
              calcLayoutEl.querySelector("#min-wire-theoretical").textContent =
                minSimOD.toFixed(3) + " mm";
              calcLayoutEl.querySelector("#max-wire-theoretical").textContent =
                maxSimOD.toFixed(3) + " mm";
              calcLayoutEl.querySelector("#avg-wire-theoretical").textContent =
                avgSimOD.toFixed(3) + " mm";

              // Final values (with wrapping and tolerance)
              const finalAvgODText = !isNaN(finalAvgODValue)
                ? finalAvgODValue.toFixed(3) + " mm"
                : i18n.getMessage("calc_result_error");

              calcLayoutEl.querySelector("#min-wire").textContent =
                (
                  (minSimOD + addedDiameterFromWrapping) *
                  toleranceFactor
                ).toFixed(3) + " mm";
              calcLayoutEl.querySelector("#max-wire").textContent =
                (
                  (maxSimOD + addedDiameterFromWrapping) *
                  toleranceFactor
                ).toFixed(3) + " mm";
              calcLayoutEl.querySelector("#avg-wire").textContent =
                finalAvgODText;

              // Update Highlighted final average value using innerHTML
              const highlightedAvgEl = calcLayoutEl.querySelector(
                "#highlighted-avg-diameter",
              );
              if (highlightedAvgEl) {
                highlightedAvgEl.innerHTML = finalAvgODHighlightHTML;
                highlightedAvgEl.setAttribute(
                  "data-i18n-title",
                  "calc_result_highlight_tooltip",
                );
                i18n.updateElement(highlightedAvgEl);
              } else {
                console.error(
                  "Element with ID #highlighted-avg-diameter not found!",
                );
              }

              // 绘制模拟截面图
              const canvasEl = calcLayoutEl.querySelector("#simulation-canvas");
              const ctx = canvasEl ? canvasEl.getContext("2d") : null;
              if (ctx && canvasEl && lastSimulationCircles) {
                drawCirclesOnCanvas(ctx, canvasEl, lastSimulationCircles, {
                  diameterColorMap: currentDiameterColorMap,
                });
              }

              // 渲染历史结果图表
              simulationHistoryChartInstance = renderSimulationHistoryChart(
                "results-history-chart",
                simulationDiameters, // 传递原始模拟直径用于图表
                simulationHistoryChartInstance,
              );

              renderLegend(currentDiameterColorMap); // 渲染图例
              // 生成有效结果后，显示并启用导出按钮
              if (exportBtn) {
                exportBtn.style.display = ""; // 恢复默认显示
                exportBtn.disabled = false;
              }
              // 保存历史记录（成功结果时）
              const saveHistoryCheckbox = document.getElementById(
                "save-history-checkbox",
              );
              if (saveHistoryCheckbox && saveHistoryCheckbox.checked) {
                try {
                  const historyEntry = {
                    timestamp: Date.now(),
                    standardWires: standardRows
                      .filter((row) => {
                        const qty = parseInt(String(row.qty).trim(), 10);
                        const od = parseFloat(String(row.od).replace(",", "."));
                        return !isNaN(qty) && qty > 0 && !isNaN(od) && od > 0;
                      })
                      .map((row) => ({
                        gauge: row.gauge,
                        type: row.type,
                        od: parseFloat(String(row.od).replace(",", ".")),
                        qty: parseInt(String(row.qty).trim(), 10),
                      })),
                    specialWires: specialRows
                      .filter((row) => {
                        const qty = parseInt(String(row.qty).trim(), 10);
                        const od = parseFloat(String(row.od).replace(",", "."));
                        return !isNaN(qty) && qty > 0 && !isNaN(od) && od > 0;
                      })
                      .map((row) => ({
                        od: parseFloat(String(row.od).replace(",", ".")),
                        qty: parseInt(String(row.qty).trim(), 10),
                      })),
                    wraps: wrapRows
                      .filter((row) => {
                        const thick = parseFloat(String(row.thick).replace(",", "."));
                        return !isNaN(thick) && thick > 0;
                      })
                      .map((row) => ({
                        thick: parseFloat(String(row.thick).replace(",", ".")),
                      })),
                    tolerance: parseInt(String(toleranceInput.value).trim(), 10),
                    theoretical: { min: minSimOD, max: maxSimOD, avg: avgSimOD },
                    final: {
                      min: (minSimOD + 2 * totalWrappingThickness) * toleranceFactor,
                      max: (maxSimOD + 2 * totalWrappingThickness) * toleranceFactor,
                      avg: finalAvgODValue,
                    },
                  };
                  let history = getJSON("calculationHistory", []);
                  history.push(historyEntry);
                  const MAX_HISTORY = 200;
                  if (history.length > MAX_HISTORY) {
                    history = history.slice(history.length - MAX_HISTORY);
                  }
                  setJSON("calculationHistory", history);
                } catch (e) {
                  console.error("保存历史记录失败:", e);
                  showToast(
                    i18n.getMessage("calc_message_save_history_error"),
                    "error",
                  );
                }
              }
            } else {
              showToast(i18n.getMessage("calc_message_no_valid_results"));
              // 移除重复的 Toast，仅保留错误级别提示
              showToast(i18n.getMessage("calc_message_no_valid_results"), "error");
              clearSimulationResults(); // 清理结果显示, including new details panel
            }
            } catch (e) {
              console.error("计算过程中发生错误:", e);
              showToast(i18n.getMessage("calc_message_calculation_error"), "error");
              clearSimulationResults(); // 出错时也清理结果, including new details panel
            } finally {
              btnPageCalculate.disabled = false;
              btnPageCalculate.textContent = i18n.getMessage(
                "calc_bottom_bar_calculate",
              );
            }
          }, 50); // 50ms延迟，给UI渲染留出时间
        };
      }

      // --- 初始化执行 ---
      // 1. 加载状态到内存
      loadAndApplyState();

      // 2. 根据加载的数据更新OD值
      standardRows.forEach((row) => updateOD(row));

      // 3. 执行首次渲染
      renderStandardRows();
      renderSpecialRows();
      renderWrapRows();

      // 4. 绑定事件监听
      [
        "#add-row-1",
        "#reset-table-1",
        "#add-row-2",
        "#reset-table-2",
        "#add-row-3",
        "#reset-table-3",
        "#reset-tolerance",
        "#reset-score",
        "#tolerance-input",
        "#score-input",
        "#save-history-checkbox",
      ].forEach((selector) => {
        const el = document.querySelector(selector);
        if (el) {
          const eventType =
            el.type === "checkbox" || el.type === "range" || el.type === "text"
              ? "change"
              : "click";
          let timer;
          el.addEventListener(eventType, () => {
            clearTimeout(timer);
            timer = setTimeout(saveState, 150);
          });
        }
      });

      // 导出图片按钮绑定
      if (exportBtn) {
        exportBtn.addEventListener("click", exportRightAreaAsImage);
      }

      // 5. 更新i18n文本
      i18n.updatePageTexts();
    }, 0);
}

// 新增：渲染图例函数
function renderLegend(diameterColorMap) {
  const legendList = document.getElementById("legend-items-list");
  const legendWrapper = document.getElementById("simulation-legend-wrapper");

  if (!legendList || !legendWrapper) {
    console.warn("图例元素未找到。");
    return;
  }

  legendList.innerHTML = ""; // 清空现有图例项

  if (!diameterColorMap || diameterColorMap.length === 0) {
    legendWrapper.style.display = "none"; // 如果没有图例项则隐藏整个区域
    return;
  }

  legendWrapper.style.display = "block"; // 显示图例区域

  diameterColorMap.forEach((item) => {
    const listItem = document.createElement("li");

    const colorBox = document.createElement("span");
    colorBox.className = "legend-color-box";
    colorBox.style.backgroundColor = item.color;

    const textNode = document.createTextNode(` ${item.displayValue}`);

    listItem.appendChild(colorBox);
    listItem.appendChild(textNode);
    legendList.appendChild(listItem);
  });
}
