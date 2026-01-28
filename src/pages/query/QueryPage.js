import i18n from "../../i18n/index.js";
import { showToast } from "../../components/feedback.js";
import mspecService from "../../services/mspecService.js";

export function renderQueryPage(container) {
  container.innerHTML = `
    <div class="page-query">
      <div class="layout-history">
        <div class="group-title">
          <div class="title-container"><span class="emoji">🔍</span><span data-i18n="query_page_title">导线查询</span></div>
          <div class="standard-selector">
            <label>
              <span data-i18n="query_label_standard">导线标准</span>
              <div id="ms-standard" class="multi-select"></div>
            </label>
          </div>
          <div class="group-actions">
            <button class="calc-table-btn" id="btn-query-reset"><span class="emoji">🧹</span><span class="text" data-i18n="query_button_reset">重置条件</span></button>
          </div>
        </div>
        <div class="calc-table-content" id="query-filter-content">
          <div class="calc-table">
            <div class="query-filters-row">
              <div class="filter-item">
                <label><span data-i18n="query_label_wiresize">WireSize</span>
                  <div id="ms-wiresize" class="multi-select"></div>
                </label>
              </div>
              <div class="filter-item">
                <label><span data-i18n="query_label_wallthickness">WallThickness</span>
                  <div id="ms-wallthickness" class="multi-select"></div>
                </label>
              </div>
              <div class="filter-item">
                <label><span data-i18n="query_label_wiretype">WireType</span>
                  <div id="ms-wiretype" class="multi-select"></div>
                </label>
              </div>
              <div class="filter-item">
                <label><span data-i18n="query_label_conductordesign">ConductorDesign</span>
                  <div id="ms-conductordesign" class="multi-select"></div>
                </label>
              </div>
            </div>
            <div id="query-loading" class="u-hidden" style="margin-top:6px;" data-i18n="common_loading">加载中...</div>
          </div>
        </div>
        <div class="calc-divider"></div>
        <div class="calc-table-content" id="query-table-content">
          <div id="query-table-header-wrapper">
            <table id="main-data-table-query" class="main-data-table calc-table calc-table-fixed">
              <thead>
                <tr>
                  <th data-i18n="query_th_wiresize">WireSize</th>
                  <th data-i18n="query_th_wallthickness">WallThickness</th>
                  <th data-i18n="query_th_wiretype">WireType</th>
                  <th data-i18n="query_th_conductordesign">ConductorDesign</th>
                  <th data-i18n="query_th_conductor_diameter">Conductor Diameter</th>
                  <th data-i18n="query_th_strand_diameter">Strand Diameter</th>
                  <th data-i18n="query_th_insulation_thickness">Insulation Thickness</th>
                  <th data-i18n="query_th_cable_od">Cable Outside Diameter</th>
                  <th data-i18n="query_th_mass_per_length">Mass/Length</th>
                  <th data-i18n="query_th_resistance_per_length">Resistance/Length</th>
                </tr>
              </thead>
            </table>
          </div>
          <div id="query-table-body-wrapper" class="u-scroll-y-auto u-max-h-600">
            <table id="main-data-table-query-body" class="main-data-table calc-table calc-table-fixed">
              <tbody></tbody>
            </table>
          </div>
          <div id="query-empty" class="u-hidden" style="margin-top:8px;color:#888;" data-i18n="query_empty_hint">没有匹配的记录，请调整筛选条件。</div>
        </div>
      </div>
    </div>
  `;

  setTimeout(async () => {
    const elLoading = container.querySelector("#query-loading");
    const selWireSizeEl = container.querySelector("#ms-wiresize");
    const selWallThicknessEl = container.querySelector("#ms-wallthickness");
    const selWireTypeEl = container.querySelector("#ms-wiretype");
    const selConductorDesignEl = container.querySelector("#ms-conductordesign");
    const dbStandardEl = container.querySelector("#ms-standard");
    const btnReset = container.querySelector("#btn-query-reset");
    const hintEmpty = container.querySelector("#query-empty");
    const tableBody = container.querySelector("#main-data-table-query-body tbody");
    const bodyWrapper = container.querySelector("#query-table-body-wrapper");
    const headerWrapper = container.querySelector("#query-table-header-wrapper");

    let selWireSizes = new Set();
    let selWallThicknesses = new Set();
    let selWireTypes = new Set();
    let selConductorDesigns = new Set();

    function closeAllMultiSelectsExcept(exceptEl) {
      const opens = container.querySelectorAll(".multi-select.open");
      opens.forEach((el) => {
        if (!exceptEl || el !== exceptEl) el.classList.remove("open");
      });
    }

    function renderMultiSelect(rootEl, values, selectedSet) {
      const chooseLabel = i18n.getMessage("calc_select_placeholder_choose");
      const selectedArr = Array.from(selectedSet);
      const summary =
        selectedArr.length === 0
          ? chooseLabel
          : selectedArr.length <= 3
          ? selectedArr.join(", ")
          : i18n.getMessage("version_display", { version: selectedArr.length }) || `${selectedArr.length}`;
      rootEl.innerHTML = `
        <button type="button" class="multi-select-toggle">${summary}</button>
        <div class="multi-select-panel">
          ${values
            .map(
              (v) => `
            <label class="multi-option">
              <input type="checkbox" value="${v}" ${selectedSet.has(String(v)) ? "checked" : ""}/>
              <span class="text">${v}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      `;
      const toggle = rootEl.querySelector(".multi-select-toggle");
      const panel = rootEl.querySelector(".multi-select-panel");
      toggle.onclick = (e) => {
        e.stopPropagation();
        const willOpen = !rootEl.classList.contains("open");
        closeAllMultiSelectsExcept(null);
        if (willOpen) rootEl.classList.add("open");
      };
      panel.addEventListener("click", (e) => e.stopPropagation());
      const inputs = panel.querySelectorAll("input[type=checkbox]");
      inputs.forEach((inp) => {
        inp.onchange = () => {
          const val = String(inp.value);
          if (inp.checked) selectedSet.add(val);
          else selectedSet.delete(val);
          updateAll();
        };
      });
    }

    function getSelections() {
      return {
        wireSize: Array.from(selWireSizes),
        wallThickness: Array.from(selWallThicknesses),
        wireType: Array.from(selWireTypes),
        conductorDesign: Array.from(selConductorDesigns),
      };
    }

    function adjustHeaderPadding() {
      if (bodyWrapper && headerWrapper) {
        const scrollbarWidth = bodyWrapper.offsetWidth - bodyWrapper.clientWidth;
        headerWrapper.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "0px";
      }
    }

    function renderTableRows(ids) {
      if (!tableBody) return;
      tableBody.style.opacity = "0";
      tableBody.style.transition = "opacity .15s ease";
      tableBody.innerHTML = "";
      const vmap = mspecService._db?.variantsMap || {};
      ids.forEach((id) => {
        const v = vmap[id];
        if (!v) return;
        const tr = document.createElement("tr");
        const specs = v.Specs || {};
        const cells = [
          mspecService.getWireSizeKeyForId(id),
          v.WallThickness || "",
          v.WireType || "",
          v.ConductorDesign || "",
          specs["Conductor Diameter"] != null ? String(specs["Conductor Diameter"]) : "—",
          specs["Strand Diameter"] != null ? String(specs["Strand Diameter"]) : "—",
          specs["Insulation Thickness"] != null ? String(specs["Insulation Thickness"]) : "—",
          specs["Cable Outside Diameter"] != null ? String(specs["Cable Outside Diameter"]) : "—",
          specs["Mass Length"] != null ? String(specs["Mass Length"]) : "—",
          specs["Resistance Length"] != null ? String(specs["Resistance Length"]) : "—",
        ];
        cells.forEach((text) => {
          const td = document.createElement("td");
          td.textContent = text;
          tr.appendChild(td);
        });
        tableBody.appendChild(tr);
      });
      hintEmpty.style.display = ids.length === 0 ? "" : "none";
      requestAnimationFrame(() => {
        tableBody.style.opacity = "1";
        adjustHeaderPadding();
      });
    }

    function updateOptions() {
      const selections = getSelections();
      const opts = mspecService.buildOptions(selections);
      selWireSizes = new Set(Array.from(selWireSizes).filter((x) => opts.wireSizes.includes(String(x))));
      selWallThicknesses = new Set(Array.from(selWallThicknesses).filter((x) => opts.wallThicknesses.includes(String(x))));
      selWireTypes = new Set(Array.from(selWireTypes).filter((x) => opts.wireTypes.includes(String(x))));
      selConductorDesigns = new Set(Array.from(selConductorDesigns).filter((x) => opts.conductorDesigns.includes(String(x))));
      renderMultiSelect(selWireSizeEl, opts.wireSizes, selWireSizes);
      renderMultiSelect(selWallThicknessEl, opts.wallThicknesses, selWallThicknesses);
      renderMultiSelect(selWireTypeEl, opts.wireTypes, selWireTypes);
      renderMultiSelect(selConductorDesignEl, opts.conductorDesigns, selConductorDesigns);
    }

    function updateAll() {
      updateOptions();
      const selections = getSelections();
      const ids = mspecService.resolveIds(selections);
      renderTableRows(ids);
      i18n.updatePageTexts(container);
    }

    async function listDatabaseStandards() {
      try {
        const readmeUrl = typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.getURL === "function"
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

    async function initDbSelector() {
      const names = await listDatabaseStandards();
      let selectedStandards = new Set([names[0] || "Aptiv_M-Spec"]);
      function renderStandardMulti() {
        const arr = Array.from(selectedStandards);
        const summary =
          arr.length === 0
            ? names[0] || ""
            : arr.length <= 3
            ? arr.join(", ")
            : `${arr.length}`;
        dbStandardEl.innerHTML = `
          <button type="button" class="multi-select-toggle">${summary}</button>
          <div class="multi-select-panel">
            ${names
              .map(
                (n) => `
              <label class="multi-option">
                <input type="checkbox" value="${n}" ${selectedStandards.has(n) ? "checked" : ""}/>
                <span class="text">${n}</span>
              </label>
            `,
              )
              .join("")}
          </div>
        `;
        const toggle = dbStandardEl.querySelector(".multi-select-toggle");
        const panel = dbStandardEl.querySelector(".multi-select-panel");
        toggle.onclick = (e) => {
          e.stopPropagation();
          const willOpen = !dbStandardEl.classList.contains("open");
          closeAllMultiSelectsExcept(null);
          if (willOpen) dbStandardEl.classList.add("open");
        };
        panel.addEventListener("click", (e) => e.stopPropagation());
        const inputs = panel.querySelectorAll("input[type=checkbox]");
        inputs.forEach((inp) => {
          inp.onchange = async () => {
            const val = String(inp.value);
            if (inp.checked) selectedStandards.add(val);
            else selectedStandards.delete(val);
            if (selectedStandards.size === 0) selectedStandards.add(names[0] || "Aptiv_M-Spec");
            renderStandardMulti();
            elLoading.style.display = "inline";
            try {
              mspecService.setSources(Array.from(selectedStandards));
              await mspecService.load();
              selWireSizes = new Set();
              selWallThicknesses = new Set();
              selWireTypes = new Set();
              selConductorDesigns = new Set();
              updateAll();
            } catch (e) {
              showToast(i18n.getMessage("query_load_error") || "查询数据加载失败", "error");
            } finally {
              elLoading.style.display = "none";
            }
          };
        });
      }
      // 初始加载
      renderStandardMulti();
      mspecService.setSources(Array.from(selectedStandards));
      await mspecService.load();
      updateAll();
    }

    try {
      elLoading.style.display = "inline";
      await initDbSelector();
    } catch (e) {
      showToast(i18n.getMessage("query_load_error") || "查询数据加载失败", "error");
    } finally {
      elLoading.style.display = "none";
    }

    document.addEventListener("click", () => {
      closeAllMultiSelectsExcept(null);
    });

    window.addEventListener("resize", adjustHeaderPadding);

    btnReset.addEventListener("click", () => {
      selWireSizes = new Set();
      selWallThicknesses = new Set();
      selWireTypes = new Set();
      selConductorDesigns = new Set();
      updateAll();
    });
  }, 0);
}

export default renderQueryPage;
