// 监听扩展图标点击事件，弹出主页面新窗口
chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: "popup.html",
    type: "popup",
    width: 1910,
    height: 1050
  });
}); 