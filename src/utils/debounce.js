/**
 * 防抖函数。在事件触发后等待指定时间，如果这段时间内没有再次触发，则执行函数。
 * @param {Function} func - 需要进行防抖处理的函数。
 * @param {number} delay - 延迟时间，单位为毫秒。
 * @returns {Function} - 经过防抖处理后的新函数。
 */
export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
} 