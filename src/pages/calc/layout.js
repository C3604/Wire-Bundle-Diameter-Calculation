export function renderCalcLayout(container) {
    container.innerHTML = `
    <div class="page-calc">
      <div class="layout-calc">
        <div class="layout-left">
          <div class="group-wire-standard">
            <div class="group-title">
              <div class="title-container"><span class="emoji">📏</span><span data-i18n="calc_group_standard_wire_title">标准导线</span></div>
              <div class="group-actions">
                <button class="calc-table-btn" id="add-row-1" data-i18n-title="calc_group_standard_wire_button_add_tooltip" title="增加一行标准导线输入"><span class="emoji">➕</span><span class="text" data-i18n="calc_group_standard_wire_button_add">增加</span></button>
                <button class="calc-table-btn" id="reset-table-1" data-i18n-title="calc_group_standard_wire_button_reset_tooltip" title="重置标准导线表格内容为默认值"><span class="emoji">🔄</span><span class="text" data-i18n="calc_group_standard_wire_button_reset">重置</span></button>
              </div>
            </div>
            <div class="calc-table-content" id="table-content-1">
              <div id="table1-header-wrapper">
                <table id="main-data-table-standard" class="main-data-table calc-table calc-table-fixed">
                  <thead>
                    <tr>
                      <th data-i18n="calc_group_standard_wire_table_header_index">序号</th>
                      <th data-i18n="calc_group_standard_wire_table_header_gauge">线规</th>
                      <th data-i18n="calc_group_standard_wire_table_header_type">类型</th>
                      <th data-i18n="calc_group_standard_wire_table_header_diameter">直径</th>
                      <th data-i18n="calc_group_standard_wire_table_header_count">数量</th>
                      <th data-i18n="calc_group_standard_wire_table_header_delete">删除</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div id="table1-body-wrapper" style="max-height:220px;overflow-y:auto">
                <table id="main-data-table-standard-body" class="main-data-table calc-table calc-table-fixed">
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="group-wire-special">
            <div class="group-title">
              <div class="title-container"><span class="emoji">🔗</span><span data-i18n="calc_group_special_wire_title">特殊导线</span></div>
              <div class="group-actions">
                <button class="calc-table-btn" id="add-row-2" data-i18n-title="calc_group_special_wire_button_add_tooltip" title="增加一行特殊导线输入"><span class="emoji">➕</span><span class="text" data-i18n="calc_group_special_wire_button_add">增加</span></button>
                <button class="calc-table-btn" id="reset-table-2" data-i18n-title="calc_group_special_wire_button_reset_tooltip" title="重置特殊导线表格内容为默认值"><span class="emoji">🔄</span><span class="text" data-i18n="calc_group_special_wire_button_reset">重置</span></button>
              </div>
            </div>
            <div class="calc-table-content" id="table-content-2">
              <div id="table2-header-wrapper">
                <table id="main-data-table-special" class="main-data-table calc-table calc-table-fixed">
                  <thead>
                    <tr>
                      <th data-i18n="calc_group_special_wire_table_header_index">序号</th>
                      <th data-i18n="calc_group_special_wire_table_header_diameter">直径(mm)</th>
                      <th data-i18n="calc_group_special_wire_table_header_count">数量</th>
                      <th data-i18n="calc_group_special_wire_table_header_delete">删除</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div id="table2-body-wrapper" style="max-height:220px;overflow-y:auto">
                <table id="main-data-table-special-body" class="main-data-table calc-table calc-table-fixed">
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="group-wire-wrap">
            <div class="group-title">
              <div class="title-container"><span class="emoji">🧵</span><span data-i18n="calc_group_wrap_title">包裹层</span></div>
              <div class="group-actions">
                <button class="calc-table-btn" id="add-row-3" data-i18n-title="calc_group_wrap_button_add_tooltip" title="增加一层包裹层输入"><span class="emoji">➕</span><span class="text" data-i18n="calc_group_wrap_button_add">增加</span></button>
                <button class="calc-table-btn" id="reset-table-3" data-i18n-title="calc_group_wrap_button_reset_tooltip" title="重置包裹层表格内容为默认值"><span class="emoji">🔄</span><span class="text" data-i18n="calc_group_wrap_button_reset">重置</span></button>
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
              <div id="table3-body-wrapper" style="max-height:164px;overflow-y:auto">
                <table id="main-data-table-wrap-body" class="main-data-table calc-table calc-table-fixed">
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="group-tolerance">
            <div class="group-title">
              <div class="title-container"><span class="emoji">📐</span><span data-i18n="calc_group_tolerance_title">制造公差</span></div>
              <div class="group-actions">
                <button class="calc-table-btn" id="reset-tolerance" data-i18n-title="calc_group_tolerance_button_reset_tooltip" title="重置制造公差为默认值(110%)"><span class="emoji">🔄</span><span class="text" data-i18n="calc_group_tolerance_button_reset">重置</span></button>
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
          <div class="group-score">
            <div class="group-title">
              <div class="title-container"><span class="emoji">🧮</span><span data-i18n="calc_group_score_title">计算次数</span></div>
              <div class="group-actions">
                <button class="calc-table-btn" id="reset-score" data-i18n-title="calc_group_score_button_reset_tooltip" title="重置计算次数为默认值(10)"><span class="emoji">🔄</span><span class="text" data-i18n="calc_group_score_button_reset">重置</span></button>
              </div>
            </div>
            <div class="drag-area-content">
              <input id="score-range" type="range" min="1" max="100" value="10" class="drag-area-range" data-i18n-title="calc_input_tooltip_score_range" title="拖动调整模拟计算次数 (1-100)">
              <input id="score-input" type="text" value="10" class="drag-area-input" data-i18n-title="calc_input_tooltip_score_input" title="输入模拟计算次数 (1-100)">
            </div>
          </div>
        </div>
        <div class="calc-divider"></div>
        <div class="layout-right">
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
                <div class="highlighted-result-area">
                  <span id="highlighted-avg-diameter" class="highlight-value" data-i18n-title="calc_result_highlight_tooltip" title="向上取整的最终平均直径，括号内为包含包裹物和公差的实际计算值(保留两位小数)">--</span>
                </div>
                <div class="group-stats input-summary-container detail-separator-top">
                  <div id="input-summary">
                    <div><span data-i18n="calc_group_stats_wire_count">总导线数量：</span><span id="total-wire-count" class="input-summary-value">0</span></div>
                    <div><span data-i18n="calc_group_stats_wrap_count">总包裹物层数：</span><span id="total-wrap-count" class="input-summary-value">0</span></div>
                    <div><span data-i18n="calc_group_stats_wrap_thickness">总包裹物厚度：</span><span id="total-wrap-thick" class="input-summary-value">0</span></div>
                  </div>
                </div>
                <div class="group-result section-title detail-separator-top"><div class="title-container"><span class="emoji">📈</span><span data-i18n="calc_group_result_title">直径计算详情</span></div></div>
                <table class="simulation-results-table">
                  <thead>
                    <tr>
                      <th data-i18n="calc_result_details_header_param">参数</th>
                      <th data-i18n="calc_result_details_header_bare">裸线径(mm)</th>
                      <th data-i18n="calc_result_details_header_simulated">模拟值(mm)</th>
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
        <button id="btn-page-reset-all" class="action-bar-btn btn-reset-action" data-i18n-title="calc_bottom_bar_reset_all_tooltip" title="重置页面所有输入项为默认值"><span class="emoji">🧹</span><span class="text" data-i18n="calc_bottom_bar_reset_all">全部重置</span></button>
        <button id="btn-page-calculate" class="action-bar-btn btn-calculate-action" data-i18n-title="calc_bottom_bar_calculate_tooltip" title="基于当前输入执行模拟计算并显示结果(或按 Enter 键)"><span class="emoji">📏</span><span class="text" data-i18n="calc_bottom_bar_calculate">计算直径</span></button>
      </div>
    </div>
  `;

    const layoutRoot = container.querySelector(".layout-calc");
    if (!layoutRoot) {
        throw new Error("renderCalcLayout: failed to locate .layout-calc root");
    }

    return {
        root: layoutRoot,
        standard: {
            tbody: layoutRoot.querySelector("#main-data-table-standard-body tbody"),
            bodyWrapper: layoutRoot.querySelector("#table1-body-wrapper"),
            addButton: layoutRoot.querySelector("#add-row-1"),
            resetButton: layoutRoot.querySelector("#reset-table-1"),
        },
        special: {
            tbody: layoutRoot.querySelector("#main-data-table-special-body tbody"),
            bodyWrapper: layoutRoot.querySelector("#table2-body-wrapper"),
            addButton: layoutRoot.querySelector("#add-row-2"),
            resetButton: layoutRoot.querySelector("#reset-table-2"),
        },
        wrap: {
            tbody: layoutRoot.querySelector("#main-data-table-wrap-body tbody"),
            bodyWrapper: layoutRoot.querySelector("#table3-body-wrapper"),
            addButton: layoutRoot.querySelector("#add-row-3"),
            resetButton: layoutRoot.querySelector("#reset-table-3"),
        },
        tolerance: {
            rangeInput: layoutRoot.querySelector("#tolerance-range"),
            textInput: layoutRoot.querySelector("#tolerance-input"),
            resetButton: layoutRoot.querySelector("#reset-tolerance"),
        },
        simulationCount: {
            rangeInput: layoutRoot.querySelector("#score-range"),
            textInput: layoutRoot.querySelector("#score-input"),
            resetButton: layoutRoot.querySelector("#reset-score"),
        },
        summary: {
            wireCount: layoutRoot.querySelector("#total-wire-count"),
            wrapCount: layoutRoot.querySelector("#total-wrap-count"),
            wrapThickness: layoutRoot.querySelector("#total-wrap-thick"),
        },
        results: {
            minTheoretical: layoutRoot.querySelector("#min-wire-theoretical"),
            maxTheoretical: layoutRoot.querySelector("#max-wire-theoretical"),
            avgTheoretical: layoutRoot.querySelector("#avg-wire-theoretical"),
            minFinal: layoutRoot.querySelector("#min-wire"),
            maxFinal: layoutRoot.querySelector("#max-wire"),
            avgFinal: layoutRoot.querySelector("#avg-wire"),
            highlightAvg: layoutRoot.querySelector("#highlighted-avg-diameter"),
            chartCanvasId: "results-history-chart",
            chartContainer: layoutRoot.querySelector("#results-history-chart-container"),
        },
        canvas: {
            element: layoutRoot.querySelector("#simulation-canvas"),
            legendList: layoutRoot.querySelector("#legend-items-list"),
            legendWrapper: layoutRoot.querySelector("#simulation-legend-wrapper"),
        },
        historyToggle: layoutRoot.querySelector("#save-history-checkbox"),
        calculateButton: layoutRoot.querySelector("#btn-page-calculate"),
        resetAllButton: layoutRoot.querySelector("#btn-page-reset-all"),
    };
}
