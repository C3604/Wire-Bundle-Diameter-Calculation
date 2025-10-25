// 主界面页面（侧边栏收缩/展开逻辑及调试输出）

import { renderCalcPage } from './CalcPage.js';
import { renderHistoryPage } from './HistoryPage.js';
import { renderConfigPage } from './ConfigPage.js';
import i18n from '../lib/i18n.js';

// 侧边栏收缩/展开逻辑

document.addEventListener('DOMContentLoaded', async function () {
  // 初始化i18n
  try {
    await i18n.init();
    console.log('I18n initialized successfully');
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
  }

  const mainContainer = document.querySelector('.main-container');
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('mainContent 容器未找到，请检查 HTML 结构！');
  }
  const btnCalc = document.getElementById('btn-calc');
  const btnHistory = document.getElementById('btn-history');
  const btnConfig = document.getElementById('btn-config');
  const btnHelp = document.getElementById('btn-help');
  const btnLanguage = document.getElementById('btn-language');

  let currentPageId = null; // 用于追踪当前活动页面

  // Function to load and set SVG icon for a button, returns the button element
  async function loadSvgIcon(button, iconName, titleKey = null) {
    if (!button) return null;
    try {
      const response = await fetch(chrome.runtime.getURL(`icons/${iconName}.svg`));
      if (!response.ok) {
        throw new Error(`SVG fetch error: ${response.statusText}`);
      }
      let svgText = await response.text();
      svgText = svgText.replace(/<\?xml[^>]*\?>/i, '').replace(/<!DOCTYPE[^>]*>/i, '');
      // Remove any existing fill attributes from paths and then add fill="currentColor" to all paths.
      // This ensures all paths are controlled by CSS color.
      svgText = svgText.replace(/fill="[^"]*"/g, '');
      svgText = svgText.replace(/<path/g, '<path fill="currentColor"');
      svgText = svgText.replace(/p-id="\d+"/g, '');
      button.innerHTML = svgText;
      if (titleKey) {
        button.setAttribute('title', i18n.getMessage(titleKey));
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
    const iconName = currentLang === 'zh_CN' ? 'Language_cn' : 'Language_en';
    await loadSvgIcon(btnLanguage, iconName, 'language_switch');
  }

  // Load and set SVG icon for collapseBtn
  loadSvgIcon(collapseBtn, 'SideOpen_Close');
  // Load and set SVG icon for helpBtn
  loadSvgIcon(btnHelp, 'help', 'sidebar_tooltip_help');

  function updateCollapseBtn() {
    if (!collapseBtn || !sidebar || !mainContainer) return; 

    const isCollapsed = sidebar.classList.contains('collapsed');
    const svgElement = collapseBtn.querySelector('svg');

    if (isCollapsed) { 
      if (!svgElement) { 
        collapseBtn.innerText = '>'; 
      }
      collapseBtn.classList.add('rotate-icon');
      mainContainer.classList.add('sidebar-collapsed');
      collapseBtn.setAttribute('title', i18n.getMessage('sidebar_tooltip_expand'));
    } else { 
      if (!svgElement) { 
        collapseBtn.innerText = '<';
      }
      collapseBtn.classList.remove('rotate-icon');
      mainContainer.classList.remove('sidebar-collapsed');
      collapseBtn.setAttribute('title', i18n.getMessage('sidebar_tooltip_collapse'));
    }
  }

  if (collapseBtn && sidebar && mainContainer) {
    updateCollapseBtn(); 
    collapseBtn.onclick = function() {
      sidebar.classList.toggle('collapsed');
      updateCollapseBtn();
    };
  }

  // 页面切换逻辑
  function showPage(pageId) {
    // Clean up previous page's styles before rendering the new one
    const oldStyles = document.getElementById('config-page-styles');
    if (oldStyles) {
      oldStyles.remove();
    }
    
    console.log('Popup.js: Switching to page:', pageId);
    currentPageId = pageId;
    if (!mainContent) {
      console.error('showPage: mainContent 未找到！');
      return;
    }
    mainContent.innerHTML = '';
    if (pageId === 'calc') {
      renderCalcPage(mainContent);
      // 可以在这里为计算页面的特定输入框聚焦
      // const firstInput = mainContent.querySelector('input[type="text"]');
      // if (firstInput) firstInput.focus();
    } else if (pageId === 'history') {
      renderHistoryPage(mainContent);
    } else if (pageId === 'config') {
      renderConfigPage(mainContent);
    }
  }

  if(btnCalc) btnCalc.onclick = () => showPage('calc');
  if(btnHistory) btnHistory.onclick = () => showPage('history');
  if(btnConfig) btnConfig.onclick = () => showPage('config');

  // 语言切换按钮事件
  if(btnLanguage) {
    btnLanguage.onclick = async () => {
      try {
        const currentLang = i18n.getCurrentLanguage();
        const newLang = currentLang === 'zh_CN' ? 'en' : 'zh_CN';
        // 切换语言，这将触发 'languageChanged' 事件来更新UI
        await i18n.switchLanguage(newLang);
      } catch (error) {
        console.error('Failed to switch language:', error);
      }
    };
  }

  // 帮助按钮点击事件
  if(btnHelp) {
    btnHelp.onclick = () => {
      const currentLang = i18n.getCurrentLanguage();
      const helpPageUrl = chrome.runtime.getURL(`src/pages/help.html?lang=${currentLang}`);
      chrome.windows.create({
        url: helpPageUrl,
        type: 'popup',
        width: 900, // 设定一个合适的宽度
        height: 750 // 设定一个合适的高度
      });
    };
  }

  // 全局键盘监听
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      console.log('Popup.js: Enter key pressed. Current Page:', currentPageId);
      if (currentPageId === 'calc') {
        // 避免在输入框内按回车时，如果输入框自身有回车处理逻辑，可能会冲突
        // 这里简单处理：如果活动元素是输入框，则不通过全局回车触发计算
        // 你可以根据需要细化这个逻辑
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) {
          console.log('Popup.js: Enter pressed on an input/select, allowing default or element-specific behavior.');
          return; 
        }
        performCalculation();
        event.preventDefault(); 
      }
    }
  });

  // 监听语言切换事件
  document.addEventListener('languageChanged', function(event) {
    console.log('Language changed event received:', event.detail);
    // 更新页面中的静态文本
    i18n.updatePageTexts();
    updateLanguageButton(); // 更新图标和提示
    // 手动更新需要动态设置的 tooltip
    if (btnHelp) {
      btnHelp.setAttribute('title', i18n.getMessage('sidebar_tooltip_help'));
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
  if(mainContent && typeof renderCalcPage === 'function') showPage('calc');

  // --- Functions for version display and changelog ---
  function compareVersions(a = '', b = '') {
    const normalize = (v) => v.split('.').map(num => parseInt(num, 10) || 0);
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

  async function displayAppVersion() {
    const versionDisplayElement = document.getElementById('version-display');
    if (!versionDisplayElement) {
      return;
    }

    let resolvedVersion = '';

    try {
      const manifest = chrome.runtime.getManifest();
      if (manifest && manifest.version) {
        resolvedVersion = manifest.version;
      }
    } catch (error) {
      console.warn('读取 manifest 版本号失败:', error);
    }

    try {
      const changelogURL = chrome.runtime.getURL('Change log.json');
      const response = await fetch(changelogURL);
      if (response.ok) {
        const changelogData = await response.json();
        const latestEntry = changelogData?.versions?.[0];
        if (latestEntry?.version && compareVersions(latestEntry.version, resolvedVersion) >= 0) {
          resolvedVersion = latestEntry.version;
        }
      }
    } catch (error) {
      console.warn('读取更新日志版本信息失败:', error);
    }

    if (resolvedVersion) {
      versionDisplayElement.textContent = i18n.getMessage('version_display', { version: resolvedVersion });
    } else {
      versionDisplayElement.textContent = i18n.getMessage('version_na');
    }

    if (!versionDisplayElement.dataset.bound) {
      versionDisplayElement.addEventListener('click', showChangelogModal);
      versionDisplayElement.dataset.bound = 'true';
    }
  }

  async function showChangelogModal() {
    try {
      const changelogURL = chrome.runtime.getURL('Change log.json');
      const response = await fetch(changelogURL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const changelogData = await response.json();

      const modalOverlay = document.createElement('div');
      modalOverlay.id = 'changelog-modal-overlay';
      modalOverlay.className = 'changelog-modal-overlay';

      const modalContent = document.createElement('div');
      modalContent.className = 'changelog-modal-content';

      const closeButton = document.createElement('button');
      closeButton.className = 'changelog-modal-close';
      closeButton.innerHTML = '&times;';
      closeButton.onclick = () => {
        modalOverlay.remove();
      };

      const modalTitle = document.createElement('h2');
      modalTitle.textContent = i18n.getMessage('changelog_title');

      const changelogList = document.createElement('div');
      changelogList.className = 'changelog-list';

      changelogData.versions.forEach(versionEntry => {
        const versionDiv = document.createElement('div');
        versionDiv.className = 'changelog-version-entry';

        const versionTitle = document.createElement('h3');
        versionTitle.textContent = `版本 ${versionEntry.version}`;
        versionDiv.appendChild(versionTitle);

        const changesList = document.createElement('ul');
        versionEntry.changes.forEach(change => {
          const listItem = document.createElement('li');
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
        modalOverlay.classList.add('visible');
      });

      modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
          modalOverlay.remove();
        }
      });

    } catch (error) {
      console.error('无法加载或解析 Change log.json:', error);
      alert('无法加载更新日志。');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayAppVersion);
  } else {
    displayAppVersion();
  }

  // --- 计算操作的函数 ---
  function performCalculation() {
    console.log('Popup.js: performCalculation Fired. Current Page:', currentPageId);
    // 确保只在计算页面实际触发按钮点击
    if (currentPageId === 'calc') {
      const calcButtonOnPage = mainContent.querySelector('#btn-page-calculate'); 
      if (calcButtonOnPage && !calcButtonOnPage.disabled) {
        console.log('Popup.js: Clicking #btn-page-calculate from performCalculation');
        calcButtonOnPage.click();
      } else {
        console.warn('Popup.js: #btn-page-calculate not found or is disabled on current page when performCalculation was called.');
      }
    }
  }
}); 
