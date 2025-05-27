// 创建浏览器API兼容层
const browserAPI = (() => {
  // 检测当前环境是Chrome还是Firefox
  const isFirefox = typeof browser !== 'undefined';
  
  // 如果是Firefox环境，直接返回browser对象
  if (isFirefox) {
    return {
      action: browser.browserAction,
      windows: browser.windows,
      storage: browser.storage
    };
  }
  
  // 如果是Chrome环境，将chrome API包装成Promise形式
  return {
    action: chrome.action || chrome.browserAction,
    windows: chrome.windows,
    storage: chrome.storage
  };
})();

// 导出统一的API接口
export default browserAPI; 