// 主界面页面（侧边栏收缩/展开逻辑及调试输出）

import { renderCalcPage } from './CalcPage.js';
import { renderHistoryPage } from './HistoryPage.js';
import { renderConfigPage } from './ConfigPage.js';

// 侧边栏收缩/展开逻辑

document.addEventListener('DOMContentLoaded', async function () {
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

  let currentPageId = null; // 用于追踪当前活动页面

  // Load and set SVG icon for collapseBtn
  if (collapseBtn) {
    try {
      const response = await fetch(chrome.runtime.getURL('icons/SideOpen_Close.svg'));
      if (!response.ok) {
        throw new Error(`SVG fetch error: ${response.statusText}`);
      }
      let svgText = await response.text();
      // Remove XML declaration and DOCTYPE for inline use
      svgText = svgText.replace(/<\?xml[^>]*\?>/i, '').replace(/<!DOCTYPE[^>]*>/i, '');
      // Replace hardcoded fill with "currentColor" so CSS can control it
      svgText = svgText.replace(/fill="[^"_]*"/g, 'fill="currentColor"');
      
      collapseBtn.innerHTML = svgText;
    } catch (error) {
      console.error('Failed to load SVG icon for collapse button:', error);
      // Fallback text will be handled by updateCollapseBtn if SVG fails
    }
  }

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
      collapseBtn.setAttribute('title', '展开侧边栏');
    } else { 
      if (!svgElement) { 
        collapseBtn.innerText = '<';
      }
      collapseBtn.classList.remove('rotate-icon');
      mainContainer.classList.remove('sidebar-collapsed');
      collapseBtn.setAttribute('title', '收起侧边栏');
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

  // 帮助按钮点击事件
  if(btnHelp) {
    btnHelp.onclick = () => {
      const helpPageUrl = chrome.runtime.getURL('src/pages/help.html');
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

  // 默认显示计算页面
  if(mainContent && typeof renderCalcPage === 'function') showPage('calc');

  // --- Functions for version display and changelog --- 
  async function displayAppVersion() {
    try {
      const manifest = chrome.runtime.getManifest();
      const version = manifest.version;
      const versionDisplayElement = document.getElementById('version-display');
      if (versionDisplayElement) {
        versionDisplayElement.textContent = `版本: ${version}`;
        versionDisplayElement.addEventListener('click', showChangelogModal);
      }
    } catch (error) {
      console.error('无法获取扩展版本号:', error);
      const versionDisplayElement = document.getElementById('version-display');
      if (versionDisplayElement) {
        versionDisplayElement.textContent = '版本 N/A';
      }
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
      modalTitle.textContent = '更新日志';

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