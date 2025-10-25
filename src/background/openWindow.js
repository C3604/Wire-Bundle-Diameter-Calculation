// 背景服务线程直接使用 Chromium 扩展 API
const action = chrome.action || chrome.browserAction;

// 监听扩展图标点击事件并创建主界面弹窗
action.onClicked.addListener(() => {
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 1910,
    height: 1050
  });
});
