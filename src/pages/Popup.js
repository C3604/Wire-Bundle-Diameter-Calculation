// 主界面页面（侧边栏收缩/展开逻辑及调试输出）

import { renderCalcPage } from "./calc/CalcPage.js";
import { renderHistoryPage } from "./history/HistoryPage.js";
import { renderConfigPage } from "./config/ConfigPage.js";
import { renderQueryPage } from "./query/QueryPage.js";
import i18n from "../i18n/index.js";
import { bindOverlayClose } from "../utils/domUtils.js";
import { showToast } from "../components/feedback.js";
import globalKeyManager from "./common/globalKeyManager.js";

// 侧边栏收缩/展开逻辑

document.addEventListener("DOMContentLoaded", async function () {
  // 初始化i18n
  try {
    await i18n.init();
  } catch (error) {
    console.error("Failed to initialize i18n:", error);
  }

  const mainContainer = document.querySelector(".main-container");
  const sidebar = document.getElementById("sidebar");
  const collapseBtn = document.getElementById("collapseBtn");
  const mainContent = document.getElementById("main-content");
  if (!mainContent) {
    console.error("mainContent 容器未找到，请检查 HTML 结构！");
  }
  const btnCalc = document.getElementById("btn-calc");
  const btnHistory = document.getElementById("btn-history");
  const btnConfig = document.getElementById("btn-config");
  const btnHelp = document.getElementById("btn-help");
  const btnLanguage = document.getElementById("btn-language");
  const btnQuery = document.getElementById("btn-query");

  let currentPageId = null; // 用于追踪当前活动页面

  // 初始化全局键盘管理器并注册 calc 页 Enter 行为
  globalKeyManager.init();
  globalKeyManager.register("calc", () => {
    // 返回 true 表示需要阻止默认行为
    performCalculation();
    return true;
  });

  // Function to load and set SVG icon for a button, returns the button element
  async function loadSvgIcon(button, iconName, titleKey = null) {
    if (!button) return null;
    try {
      const svgUrl =
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        typeof chrome.runtime.getURL === "function"
          ? chrome.runtime.getURL(`icons/${iconName}.svg`)
          : `icons/${iconName}.svg`;
      const response = await fetch(svgUrl);
      if (!response.ok) {
        throw new Error(`SVG fetch error: ${response.statusText}`);
      }
      let svgText = await response.text();
      svgText = svgText
        .replace(/<\?xml[^>]*\?>/i, "")
        .replace(/<!DOCTYPE[^>]*>/i, "");
      // Remove any existing fill attributes from paths and then add fill="currentColor" to all paths.
      // This ensures all paths are controlled by CSS color.
      svgText = svgText.replace(/fill="[^"]*"/g, "");
      svgText = svgText.replace(/<path/g, '<path fill="currentColor"');
      svgText = svgText.replace(/p-id="\d+"/g, "");
      button.innerHTML = svgText;
      if (titleKey) {
        button.setAttribute("title", i18n.getMessage(titleKey));
      }
    } catch (error) {
      console.error(`Failed to load SVG icon ${iconName}:`, error);
      // Fallback text will be handled by other parts of the code
    }
    return button;
  }

  // New function to update language button icon and tooltip
  async function updateLanguageButton() {
    if (!btnLanguage) return;
    const currentLang = i18n.getCurrentLanguage();
    const label = currentLang === "zh_CN" ? "EN" : "简中";
    btnLanguage.textContent = label;
    btnLanguage.setAttribute("title", i18n.getMessage("language_switch"));
  }

  // Load and set SVG icon for collapseBtn
  loadSvgIcon(collapseBtn, "SideOpen_Close");
  if (btnHelp) {
    btnHelp.innerHTML = `<span class="emoji">❓</span>`;
    btnHelp.setAttribute("title", i18n.getMessage("sidebar_tooltip_help"));
  }

  function updateCollapseBtn() {
    if (!collapseBtn || !sidebar || !mainContainer) return;

    const isCollapsed = sidebar.classList.contains("collapsed");
    const svgElement = collapseBtn.querySelector("svg");

    if (isCollapsed) {
      if (!svgElement) {
        collapseBtn.innerText = ">";
      }
      collapseBtn.classList.add("rotate-icon");
      mainContainer.classList.add("sidebar-collapsed");
      collapseBtn.setAttribute(
        "title",
        i18n.getMessage("sidebar_tooltip_expand"),
      );
    } else {
      if (!svgElement) {
        collapseBtn.innerText = "<";
      }
      collapseBtn.classList.remove("rotate-icon");
      mainContainer.classList.remove("sidebar-collapsed");
      collapseBtn.setAttribute(
        "title",
        i18n.getMessage("sidebar_tooltip_collapse"),
      );
    }
  }

  if (collapseBtn && sidebar && mainContainer) {
    updateCollapseBtn();
    collapseBtn.onclick = function () {
      sidebar.classList.toggle("collapsed");
      updateCollapseBtn();
      responsiveCollapsed = false; // 用户手动操作时清除响应式折叠标记
    };
  }

  // —— 响应式侧边栏折叠 ——
  const layoutSwitchWidth = 1100;
  const autoCollapseWidth = 1280;
  let responsiveCollapsed = false;
  function setSidebarCollapsed(isCollapsed) {
    if (!sidebar || !mainContainer) return;
    const current = sidebar.classList.contains("collapsed");
    if (current !== isCollapsed) {
      sidebar.classList.toggle("collapsed", isCollapsed);
      updateCollapseBtn();
    }
  }
  function applyResponsiveSidebar() {
    const width = window.innerWidth;
    if (width <= layoutSwitchWidth) {
      if (sidebar.classList.contains("collapsed")) {
        setSidebarCollapsed(false);
      }
      responsiveCollapsed = false;
      return;
    }
    const shouldCollapse = width < autoCollapseWidth;
    if (shouldCollapse) {
      if (!sidebar.classList.contains("collapsed")) {
        setSidebarCollapsed(true);
        responsiveCollapsed = true;
      }
    } else if (responsiveCollapsed && sidebar.classList.contains("collapsed")) {
      setSidebarCollapsed(false);
      responsiveCollapsed = false;
    }
  }
  // 首次应用
  applyResponsiveSidebar();
  // 监听窗口尺寸变化（轻微防抖）
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyResponsiveSidebar, 100);
  });

  // 页面切换逻辑
  function showPage(pageId) {
    // Clean up previous page's styles before rendering the new one
    const oldStyles = document.getElementById("config-page-styles");
    if (oldStyles) {
      oldStyles.remove();
    }

    if (currentPageId) {
      globalKeyManager.unregister(currentPageId);
    }
    currentPageId = pageId;
    globalKeyManager.setCurrentPage(pageId);
    if (!mainContent) {
      console.error("showPage: mainContent 未找到！");
      return;
    }
    mainContent.innerHTML = "";
    if (pageId === "calc") {
      renderCalcPage(mainContent);
      // 可以在这里为计算页面的特定输入框聚焦
      // const firstInput = mainContent.querySelector('input[type="text"]');
      // if (firstInput) firstInput.focus();
    } else if (pageId === "history") {
      renderHistoryPage(mainContent);
    } else if (pageId === "config") {
      renderConfigPage(mainContent);
    } else if (pageId === "query") {
      renderQueryPage(mainContent);
    }
  }

  if (btnCalc) btnCalc.onclick = () => showPage("calc");
  if (btnHistory) btnHistory.onclick = () => showPage("history");
  if (btnConfig) btnConfig.onclick = () => showPage("config");
  if (btnQuery) btnQuery.onclick = () => showPage("query");

  // 语言切换按钮事件
  if (btnLanguage) {
    btnLanguage.onclick = async () => {
      try {
        const currentLang = i18n.getCurrentLanguage();
        const newLang = currentLang === "zh_CN" ? "en" : "zh_CN";
        // 切换语言，这将触发 'languageChanged' 事件来更新UI
        await i18n.switchLanguage(newLang);
      } catch (error) {
        console.error("Failed to switch language:", error);
      }
    };
  }

  // 帮助按钮点击事件（相对并记忆尺寸）
  if (btnHelp) {
    btnHelp.onclick = async () => {
      const currentLang = i18n.getCurrentLanguage();
      const isExtensionEnv =
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        typeof chrome.runtime.getURL === "function" &&
        chrome.windows;
      const helpPageUrl = isExtensionEnv
        ? chrome.runtime.getURL(`src/pages/help/help.html?lang=${currentLang}`)
        : `src/pages/help/help.html?lang=${currentLang}`;

      let stored = {};
      try {
        stored = await chrome.storage.local.get("helpWindowBounds");
      } catch (_) {
        try {
          const raw = localStorage.getItem("helpWindowBounds");
          if (raw) stored.helpWindowBounds = JSON.parse(raw);
        } catch (__) {}
      }
      const bounds = stored.helpWindowBounds || {};
      const availW = (window.screen && window.screen.availWidth) || 1200;
      const availH = (window.screen && window.screen.availHeight) || 800;
      const baseW = Math.max(600, Math.floor(availW * 0.8));
      const baseH = Math.max(400, Math.floor(availH * 0.8));
      const width = bounds.width || baseW;
      const height = bounds.height || baseH;
      const left = bounds.left || Math.floor((availW - width) / 2);
      const top = bounds.top || Math.floor((availH - height) / 2);

      if (isExtensionEnv) {
        chrome.windows.create(
          { url: helpPageUrl, type: "popup", left, top, width, height },
          async (win) => {
            if (!win || !win.id) return;
            try {
              await chrome.storage.local.set({
                helpWindowId: win.id,
                helpWindowBounds: { left, top, width, height },
              });
            } catch (_) {}
          },
        );
      } else {
        const features = `popup=yes,left=${left},top=${top},width=${width},height=${height},noopener=yes`;
        const w = window.open(helpPageUrl, "help", features);
        try {
          localStorage.setItem(
            "helpWindowBounds",
            JSON.stringify({ left, top, width, height }),
          );
        } catch (_) {}
        if (!w) {
          console.warn("无法打开帮助窗口，可能被浏览器拦截。");
        }
      }
    };

    // 跟踪帮助窗口尺寸变化并记忆（仅扩展环境）
    if (
      typeof chrome !== "undefined" &&
      chrome.windows &&
      chrome.windows.onBoundsChanged &&
      typeof chrome.windows.onBoundsChanged.addListener === "function"
    ) {
      chrome.windows.onBoundsChanged.addListener(async (windowId) => {
        try {
          const data = await chrome.storage.local.get("helpWindowId");
          const helpId = data.helpWindowId;
          if (!helpId || windowId !== helpId) return;
          chrome.windows.get(windowId, { populate: false }, async (win) => {
            if (!win) return;
            const bounds = {
              left: typeof win.left === "number" ? win.left : undefined,
              top: typeof win.top === "number" ? win.top : undefined,
              width: typeof win.width === "number" ? win.width : undefined,
              height: typeof win.height === "number" ? win.height : undefined,
            };
            try {
              await chrome.storage.local.set({ helpWindowBounds: bounds });
            } catch (_) {}
          });
        } catch (_) {}
      });
    }

    if (
      typeof chrome !== "undefined" &&
      chrome.windows &&
      chrome.windows.onRemoved &&
      typeof chrome.windows.onRemoved.addListener === "function"
    ) {
      chrome.windows.onRemoved.addListener(async (windowId) => {
        try {
          const data = await chrome.storage.local.get("helpWindowId");
          const helpId = data.helpWindowId;
          if (helpId && windowId === helpId) {
            await chrome.storage.local.remove("helpWindowId");
          }
        } catch (_) {}
      });
    }
  }



  // 监听语言切换事件
  document.addEventListener("languageChanged", function (event) {
    // 更新页面中的静态文本
    i18n.updatePageTexts();
    updateLanguageButton(); // 更新图标和提示
    // 手动更新需要动态设置的 tooltip
    if (btnHelp) {
      btnHelp.setAttribute("title", i18n.getMessage("sidebar_tooltip_help"));
    }
    // 重新渲染当前页面以更新动态文本
    if (currentPageId) {
      showPage(currentPageId);
    }
    // 更新版本显示
    displayAppVersion();
  });

  // 初始化页面文本
  i18n.updatePageTexts();
  updateLanguageButton(); // 初始化语言按钮

  // 默认显示计算页面
  if (mainContent && typeof renderCalcPage === "function") showPage("calc");

  // --- Functions for version display and changelog ---
  function compareVersions(a = "", b = "") {
    const normalize = (v) => v.split(".").map((num) => parseInt(num, 10) || 0);
    const partsA = normalize(a);
    const partsB = normalize(b);
    const length = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < length; i++) {
      const segmentA = partsA[i] || 0;
      const segmentB = partsB[i] || 0;
      if (segmentA > segmentB) return 1;
      if (segmentA < segmentB) return -1;
    }
    return 0;
  }

  /**
   * Fetches and parses CHANGELOG.md
   * @returns {Promise<{versions: Array<{version: string, changes: string[]}>}>}
   */
  async function fetchAndParseChangelog() {
    const changelogURL = chrome.runtime.getURL("CHANGELOG.md");
    const response = await fetch(changelogURL);
    if (!response.ok) {
      throw new Error(`Failed to fetch CHANGELOG.md: ${response.status}`);
    }
    const text = await response.text();
    const versions = [];
    
    // Split by version headers (## 版本)
    // Example: ## 版本 1.0.3.2 (当前版本)
    const sections = text.split(/^##\s+版本\s+/m).slice(1); // slice(1) to skip preamble
    
    for (const section of sections) {
      const lines = section.trim().split('\n');
      // First line contains version number, e.g. "1.0.3.2 (当前版本)"
      const versionMatch = lines[0].match(/^([0-9.]+)/);
      if (versionMatch) {
        const version = versionMatch[1];
        const changes = [];
        // Subsequent lines starting with "- " are changes
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('- ')) {
            changes.push(line.substring(2));
          }
        }
        versions.push({ version, changes });
      }
    }
    
    return { versions };
  }

  async function displayAppVersion() {
    const versionDisplayElement = document.getElementById("version-display");
    if (!versionDisplayElement) {
      return;
    }

    let resolvedVersion = "";

    try {
      const manifest = chrome.runtime.getManifest();
      if (manifest && manifest.version) {
        resolvedVersion = manifest.version;
      }
    } catch (error) {
      console.warn("读取 manifest 版本号失败:", error);
    }

    try {
      const changelogData = await fetchAndParseChangelog();
      const latestEntry = changelogData?.versions?.[0];
      if (
        latestEntry?.version &&
        compareVersions(latestEntry.version, resolvedVersion) >= 0
      ) {
        resolvedVersion = latestEntry.version;
      }
    } catch (error) {
      console.warn("读取更新日志版本信息失败:", error);
    }

    if (resolvedVersion) {
      versionDisplayElement.textContent = i18n.getMessage("version_display", {
        version: resolvedVersion,
      });
    } else {
      versionDisplayElement.textContent = i18n.getMessage("version_na");
    }

    if (!versionDisplayElement.dataset.bound) {
      versionDisplayElement.addEventListener("click", showChangelogModal);
      versionDisplayElement.dataset.bound = "true";
    }
  }

  async function showChangelogModal() {
    try {
      const changelogData = await fetchAndParseChangelog();

      const modalOverlay = document.createElement("div");
      modalOverlay.id = "changelog-modal-overlay";
      modalOverlay.className = "changelog-modal-overlay";

      const modalContent = document.createElement("div");
      modalContent.className = "changelog-modal-content";

      const closeButton = document.createElement("button");
      closeButton.className = "changelog-modal-close";
      closeButton.innerHTML = "&times;";
      closeButton.onclick = () => {
        modalOverlay.remove();
      };

      const modalTitle = document.createElement("h2");
      modalTitle.textContent = i18n.getMessage("changelog_title");

      const changelogList = document.createElement("div");
      changelogList.className = "changelog-list";

      changelogData.versions.forEach((versionEntry) => {
        const versionDiv = document.createElement("div");
        versionDiv.className = "changelog-version-entry";

        const versionTitle = document.createElement("h3");
        versionTitle.textContent = `版本 ${versionEntry.version}`;
        versionDiv.appendChild(versionTitle);

        const changesList = document.createElement("ul");
        versionEntry.changes.forEach((change) => {
          const listItem = document.createElement("li");
          listItem.textContent = change;
          changesList.appendChild(listItem);
        });
        versionDiv.appendChild(changesList);
        changelogList.appendChild(versionDiv);
      });

      modalContent.appendChild(closeButton);
      modalContent.appendChild(modalTitle);
      modalContent.appendChild(changelogList);
      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);

      requestAnimationFrame(() => {
        modalOverlay.classList.add("visible");
      });

      bindOverlayClose(modalOverlay, () => {
        modalOverlay.remove();
      });
    } catch (error) {
      console.error("无法加载或解析 CHANGELOG.md:", error);
      showToast(i18n.getMessage("changelog_load_error") || "无法加载更新日志。", "error");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", displayAppVersion);
  } else {
    displayAppVersion();
  }

  // --- 计算操作的函数 ---
  function performCalculation() {
    // 确保只在计算页面实际触发按钮点击
    if (currentPageId === "calc") {
      const calcButtonOnPage = mainContent.querySelector("#btn-page-calculate");
      if (calcButtonOnPage && !calcButtonOnPage.disabled) {
        calcButtonOnPage.click();
      } else {
        // 按键触发但按钮不可用或未在计算页，不进行任何操作
      }
    }
  }
});
