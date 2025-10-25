// src/pages/common/globalKeyManager.js

const globalKeyManager = (function () {
  let initialized = false;
  let currentPageId = null;
  const handlers = new Map(); // pageId -> handler(event) => boolean (preventDefault)
  let boundListener = null;

  function shouldIgnoreEventTarget(target) {
    if (!target) return false;
    const tag = (target.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return true;
    // contenteditable
    if (typeof target.isContentEditable === "boolean" && target.isContentEditable) return true;
    // inputs inside shadow DOM
    try {
      const editable = target.closest && target.closest("input, select, textarea, [contenteditable=true], [contenteditable=''], [contenteditable]");
      return !!editable;
    } catch (_) {
      return false;
    }
  }

  function onKeydown(event) {
    if (event.key !== "Enter") return;
    if (shouldIgnoreEventTarget(document.activeElement)) return;
    const handler = handlers.get(currentPageId);
    if (typeof handler === "function") {
      const shouldPrevent = !!handler(event);
      if (shouldPrevent) {
        event.preventDefault();
      }
    }
  }

  return {
    init() {
      if (initialized) return;
      boundListener = onKeydown.bind(this);
      document.addEventListener("keydown", boundListener);
      initialized = true;
    },
    destroy() {
      if (!initialized) return;
      if (boundListener) {
        document.removeEventListener("keydown", boundListener);
        boundListener = null;
      }
      handlers.clear();
      currentPageId = null;
      initialized = false;
    },
    setCurrentPage(pageId) {
      currentPageId = pageId || null;
    },
    register(pageId, handler) {
      if (!pageId || typeof handler !== "function") return;
      handlers.set(pageId, handler);
    },
    unregister(pageId) {
      if (!pageId) return;
      handlers.delete(pageId);
    },
  };
})();

export default globalKeyManager;