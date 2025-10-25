// 背景服务线程直接使用 Chromium 扩展 API
const action = chrome.action || chrome.browserAction;

// 读取/写入主窗口尺寸
async function getMainWindowBounds() {
  try {
    const data = await chrome.storage.local.get("mainWindowBounds");
    return data.mainWindowBounds || null;
  } catch (_) {
    return null;
  }
}
async function setMainWindowBounds(bounds) {
  try {
    await chrome.storage.local.set({ mainWindowBounds: bounds });
  } catch (_) {}
}
async function setMainWindowId(id) {
  try {
    await chrome.storage.local.set({ mainWindowId: id });
  } catch (_) {}
}
async function getMainWindowId() {
  try {
    const data = await chrome.storage.local.get("mainWindowId");
    return data.mainWindowId || null;
  } catch (_) {
    return null;
  }
}
async function clearMainWindowId() {
  try {
    await chrome.storage.local.remove("mainWindowId");
  } catch (_) {}
}

// 监听扩展图标点击事件并创建主界面弹窗（相对尺寸 + 记忆）
action.onClicked.addListener(async () => {
  const storedBounds = await getMainWindowBounds();
  const createOptions = {
    url: "popup.html",
    type: "popup",
  };
  if (storedBounds && storedBounds.width && storedBounds.height) {
    Object.assign(createOptions, storedBounds);
  } else {
    // 无存储时使用相对策略：尽量填满屏幕（最大化），若不支持则给出安全默认值
    // 注意：某些浏览器对 popup 窗口的 state 支持有限，这里优先使用数值回退
    createOptions.width = 1200;
    createOptions.height = 800;
    createOptions.left = 60;
    createOptions.top = 40;
  }

  chrome.windows.create(createOptions, async (win) => {
    if (!win || !win.id) return;
    await setMainWindowId(win.id);
    // 初始写入当前尺寸，避免首次创建后没有记录
    const bounds = {
      left: typeof win.left === "number" ? win.left : createOptions.left,
      top: typeof win.top === "number" ? win.top : createOptions.top,
      width: typeof win.width === "number" ? win.width : createOptions.width,
      height:
        typeof win.height === "number" ? win.height : createOptions.height,
    };
    await setMainWindowBounds(bounds);
  });
});

// 监听窗口尺寸变化并记忆最新尺寸
chrome.windows.onBoundsChanged.addListener(async (windowId) => {
  const mainId = await getMainWindowId();
  if (!mainId || windowId !== mainId) return;
  chrome.windows.get(windowId, { populate: false }, async (win) => {
    if (!win) return;
    const bounds = {
      left: typeof win.left === "number" ? win.left : undefined,
      top: typeof win.top === "number" ? win.top : undefined,
      width: typeof win.width === "number" ? win.width : undefined,
      height: typeof win.height === "number" ? win.height : undefined,
    };
    await setMainWindowBounds(bounds);
  });
});

// 清理窗口 id 记录
chrome.windows.onRemoved.addListener(async (windowId) => {
  const mainId = await getMainWindowId();
  if (mainId && windowId === mainId) {
    await clearMainWindowId();
  }
});
