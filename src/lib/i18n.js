/**
 * 国际化工具类
 * 提供语言包加载、语言切换、文本获取等功能。
 *
 * 回退策略说明（文档层）：
 * 1) 语言偏好优先读取 `chrome.storage.local`，不可用则按浏览器语言推断（zh→`zh_CN`，否则 `en`）。
 * 2) 消息包加载优先使用 `chrome.runtime.getURL("_locales/.../messages.json")`；
 *    非扩展环境自动回退为相对路径 `/_locales/.../messages.json`。
 * 3) 初始化或加载失败时回退到默认语言 `zh_CN` 并记录错误日志；若仍失败则抛出初始化错误。
 * 4) 获取文案失败时，尝试使用 `chrome.i18n.getMessage`；仍失败则回退到当前语言已加载的消息或直接返回 key。
 * 5) 所有回退路径均以简短 `console.warn/console.error` 记录，不中断 UI 渲染。
 */

class I18nManager {
  constructor() {
    this.currentLanguage = "zh_CN"; // 默认语言
    this.messages = {}; // 缓存的语言包数据
    this.supportedLanguages = ["zh_CN", "en"]; // 支持的语言列表
    this.storageKey = "i18n_language_preference"; // 存储键名
    this.initialized = false;
  }

  /**
   * 初始化国际化管理器
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // 从存储中加载用户语言偏好
      await this.loadLanguagePreference();

      // 加载当前语言包
      await this.loadMessages(this.currentLanguage);

      this.initialized = true;
      console.log("I18n initialized with language:", this.currentLanguage);
    } catch (error) {
      console.error("Failed to initialize I18n:", error);
      // 降级到默认语言
      this.currentLanguage = "zh_CN";
      try {
        await this.loadMessages(this.currentLanguage);
        this.initialized = true;
      } catch (fallbackError) {
        console.error("Failed to load fallback language:", fallbackError);
        throw new Error("国际化初始化失败");
      }
    }
  }

  /**
   * 从存储中加载语言偏好设置
   * @returns {Promise<void>}
   */
  async loadLanguagePreference() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      if (
        result[this.storageKey] &&
        this.supportedLanguages.includes(result[this.storageKey])
      ) {
        this.currentLanguage = result[this.storageKey];
      } else {
        // 尝试从浏览器语言检测
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith("zh")) {
          this.currentLanguage = "zh_CN";
        } else {
          this.currentLanguage = "en";
        }
      }
    } catch (error) {
      console.warn("Failed to load language preference:", error);
      // 使用默认语言
    }
  }

  /**
   * 保存语言偏好设置到存储
   * @param {string} language - 要保存的语言代码
   * @returns {Promise<void>}
   */
  async saveLanguagePreference(language) {
    try {
      await chrome.storage.local.set({ [this.storageKey]: language });
    } catch (error) {
      // 非扩展环境下使用 localStorage 回退
      try {
        localStorage.setItem(this.storageKey, language);
      } catch (_) {}
      console.error("Failed to save language preference:", error);
    }
  }

  /**
   * 加载指定语言的消息包
   * @param {string} language - 语言代码
   * @returns {Promise<void>}
   */
  async loadMessages(language) {
    if (!this.supportedLanguages.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    try {
      // 使用Chrome扩展的国际化API加载消息；在非扩展环境下回退到相对路径
      let messagesUrl;
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        typeof chrome.runtime.getURL === "function"
      ) {
        messagesUrl = chrome.runtime.getURL(`_locales/${language}/messages.json`);
      } else {
        messagesUrl = `/_locales/${language}/messages.json`;
      }
      const response = await fetch(messagesUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch messages for ${language}: ${response.status}`,
        );
      }

      const messages = await response.json();
      this.messages[language] = messages;

      console.log(
        `Loaded messages for ${language}:`,
        Object.keys(messages).length,
        "keys",
      );
    } catch (error) {
      console.error(`Failed to load messages for ${language}:`, error);
      throw error;
    }
  }

  /**
   * 切换语言
   * @param {string} newLanguage - 新的语言代码
   * @returns {Promise<void>}
   */
  async switchLanguage(newLanguage) {
    if (!this.supportedLanguages.includes(newLanguage)) {
      throw new Error(`Unsupported language: ${newLanguage}`);
    }

    if (newLanguage === this.currentLanguage) {
      return; // 语言未改变
    }

    try {
      // 如果消息包未加载，先加载
      if (!this.messages[newLanguage]) {
        await this.loadMessages(newLanguage);
      }

      const oldLanguage = this.currentLanguage;
      this.currentLanguage = newLanguage;

      // 保存语言偏好
      await this.saveLanguagePreference(newLanguage);

      console.log(`Language switched from ${oldLanguage} to ${newLanguage}`);

      // 触发语言切换事件
      this.dispatchLanguageChangeEvent(oldLanguage, newLanguage);
    } catch (error) {
      console.error("Failed to switch language:", error);
      throw error;
    }
  }

  /**
   * 获取翻译文本
   * @param {string} key - 翻译键名，支持点号分隔的嵌套键
   * @param {Object} substitutions - 替换参数
   * @returns {string} 翻译后的文本
   */
  getMessage(key, substitutions = {}) {
    if (!this.initialized) {
      console.warn("I18n not initialized, returning key:", key);
      return key;
    }

    try {
      const messages = this.messages[this.currentLanguage];
      if (!messages) {
        console.warn(`No messages found for language: ${this.currentLanguage}`);
        return this.getFallbackMessage(key, substitutions);
      }

      // 处理嵌套键名（如 app.title）
      const keyParts = key.split(".");
      let message = messages;

      for (const part of keyParts) {
        if (message && typeof message === "object" && message[part]) {
          message = message[part];
        } else {
          // 键名不存在，尝试降级
          console.warn(
            `Translation key not found: ${key} in language: ${this.currentLanguage}`,
          );
          return this.getFallbackMessage(key, substitutions);
        }
      }

      // 如果找到的是完整的消息对象
      if (message && typeof message === "object" && message.message) {
        return this.substituteMessage(message.message, substitutions);
      }

      // 如果找到的是简单字符串
      if (typeof message === "string") {
        return this.substituteMessage(message, substitutions);
      }

      // 都不是，返回降级消息
      return this.getFallbackMessage(key, substitutions);
    } catch (error) {
      console.error("Error getting message:", error);
      return this.getFallbackMessage(key, substitutions);
    }
  }

  /**
   * 获取降级消息（当主语言失败时）
   * @param {string} key - 翻译键名
   * @param {Object} substitutions - 替换参数
   * @returns {string}
   */
  getFallbackMessage(key, substitutions) {
    // 尝试使用chrome.i18n API作为降级
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.i18n &&
        typeof chrome.i18n.getMessage === "function"
      ) {
        const message = chrome.i18n.getMessage(key, Object.values(substitutions));
        if (message) {
          return message;
        }
      }
    } catch (error) {
      console.warn("Chrome i18n API also failed:", error);
    }

    // 最终降级：如果已加载消息包，尝试直接返回对应键
    try {
      const msgObj = this.messages[this.currentLanguage]?.[key];
      if (msgObj && typeof msgObj === "object" && msgObj.message) {
        return this.substituteMessage(msgObj.message, substitutions);
      }
    } catch (_) {}

    // 最终降级：返回键名
    return key;
  }

  /**
   * 替换消息中的占位符
   * @param {string} message - 原始消息
   * @param {Object} substitutions - 替换参数
   * @returns {string}
   */
  substituteMessage(message, substitutions) {
    if (!substitutions || typeof substitutions !== "object") {
      return message;
    }

    let result = message;
    for (const [key, value] of Object.entries(substitutions)) {
      // 支持 {key} 格式的占位符
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
      // 支持 $key$ 格式的占位符
      result = result.replace(new RegExp(`\\$${key}\\$`, "g"), value);
    }

    return result;
  }

  /**
   * 触发语言切换事件
   * @param {string} oldLanguage - 旧语言
   * @param {string} newLanguage - 新语言
   */
  dispatchLanguageChangeEvent(oldLanguage, newLanguage) {
    const event = new CustomEvent("languageChanged", {
      detail: {
        oldLanguage,
        newLanguage,
        i18n: this,
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * 获取当前语言
   * @returns {string}
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * 获取支持的语言列表
   * @returns {string[]}
   */
  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  /**
   * 检查是否已初始化
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * 更新页面中的所有翻译文本
   * 查找带有 data-i18n 属性的元素并更新其文本
   * @param {HTMLElement} [element=document.body] - The root element to search for internationalized elements.
   */
  updatePageTexts(element = document.body) {
    if (!this.isInitialized()) {
      console.warn("i18n is not initialized yet. Skipping text update.");
      return;
    }
    const elements = element.querySelectorAll("[data-i18n]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const translation = this.getMessage(key);

      if (translation) {
        // Check if the button contains only an icon (emoji or <i> tag)
        const hasIcon =
          el.querySelector("i") !== null ||
          /^[✨🔄✅❌📄📤🗑️⚙️📏🧹📐🧮🖼️🔗🛡️💾▶️⏸️⏹️]+$/.test(
            el.textContent.trim(),
          );

        if (el.tagName === "BUTTON" && hasIcon) {
          const iconMatch = el.innerHTML.match(
            /^(\s*<i class="[^"]+"><\/i>\s*|^\s*[✨🔄✅❌📄📤🗑️⚙️📏🧹📐🧮🖼️🔗🛡️💾▶️⏸️⏹️]+)/,
          );
          if (iconMatch) {
            // Preserve the icon and append the translated text
            el.innerHTML = `${iconMatch[0]} ${translation}`;
          } else {
            // Fallback for cases where regex might fail
            el.textContent = translation;
          }
        } else {
          // For non-buttons or buttons without icons, just set the text content
          el.textContent = translation;
        }
      } else {
        console.warn(`Translation not found for key: ${key}`);
      }
    });
    this.updateElementAttributes(element);
  }

  /**
   * 更新页面中所有元素的翻译属性（如 title）
   * @param {HTMLElement} [element=document.body] - The root element to search for internationalized elements.
   */
  updateElementAttributes(element = document.body) {
    const elements = element.querySelectorAll("[data-i18n-title]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      const translation = this.getMessage(key);
      if (translation) {
        el.setAttribute("title", translation);
      }
    });
  }

  /**
   * 更新单个元素的文本和属性
   * @param {HTMLElement} element - The element to update.
   */
  updateElement(element) {
    if (!element) return;

    // Update text content if data-i18n exists
    if (element.hasAttribute("data-i18n")) {
      const key = element.getAttribute("data-i18n");
      const translation = this.getMessage(key);
      if (translation) {
        element.textContent = translation;
      }
    }

    // Update title attribute if data-i18n-title exists
    if (element.hasAttribute("data-i18n-title")) {
      const key = element.getAttribute("data-i18n-title");
      const translation = this.getMessage(key);
      if (translation) {
        element.setAttribute("title", translation);
      }
    }
  }
}

// 创建全局实例
const i18n = new I18nManager();

// 导出实例和类
export { i18n, I18nManager };
export default i18n;
