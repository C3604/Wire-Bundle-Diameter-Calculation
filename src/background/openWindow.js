import browserAPI from '../utils/browserPolyfill.js';

// 监听扩展图标点击事件，弹出主页面新窗口
browserAPI.action.onClicked.addListener(() => {
  browserAPI.windows.create({
    url: "popup.html",
    type: "popup",
    width: 1910,
    height: 1050
  });
}); 