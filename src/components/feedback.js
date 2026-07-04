// Lightweight feedback utilities: Toast and Confirm Modal
// Self-contained styles are injected on first use.

let stylesInjected = false;
const TOAST_META = {
  info: { icon: "ℹ️", title: "提示" },
  success: { icon: "✅", title: "成功" },
  warning: { icon: "⚠️", title: "注意" },
  error: { icon: "⛔", title: "错误" },
};

function ensureStyles() {
  if (stylesInjected) return;
  const css = `
  :root {
    --app-feedback-width: min(360px, calc(100vw - 24px));
  }
  `;
  const style = document.createElement('style');
  style.id = 'app-feedback-style';
  style.textContent = css;
  document.head.appendChild(style);
  stylesInjected = true;
}

function getToastStack() {
  let stack = document.getElementById('app-toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'app-toast-stack';
    stack.className = 'app-toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

export function showToast(message, type = 'info', options = {}) {
  ensureStyles();
  const { duration = 2500 } = options;
  const stack = getToastStack();
  const el = document.createElement('div');
  el.className = 'app-toast ' + (type || 'info');
  const meta = TOAST_META[type] || TOAST_META.info;
  el.innerHTML = `
    <span class="app-toast-icon" aria-hidden="true">${meta.icon}</span>
    <div class="app-toast-body">
      <span class="app-toast-title">${meta.title}</span>
      <div class="app-toast-message"></div>
    </div>
  `;
  el.querySelector('.app-toast-message').textContent = message;
  stack.appendChild(el);
  const timer = setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => { el.remove(); }, 250);
  }, duration);
  return { close: () => { clearTimeout(timer); el.remove(); } };
}

function ensureModal() {
  let backdrop = document.getElementById('app-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'app-modal-backdrop';
    backdrop.className = 'app-modal-backdrop';
    backdrop.innerHTML = `
      <div class="app-modal" role="dialog" aria-modal="true" aria-labelledby="app-confirm-title">
        <div class="app-modal-header" id="app-confirm-title">确认操作</div>
        <div class="app-modal-body" id="app-confirm-message">确定要继续吗？</div>
        <div class="app-modal-footer">
          <button class="app-btn" id="app-btn-cancel" type="button">取消</button>
          <button class="app-btn app-btn-primary" id="app-btn-ok" type="button">确定</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
  }
  return backdrop;
}

export function showConfirm(message, opts = {}) {
  ensureStyles();
  const { okText = '确定', cancelText = '取消', title = '确认操作' } = opts;
  const backdrop = ensureModal();
  backdrop.querySelector('#app-confirm-title').textContent = title;
  backdrop.querySelector('#app-confirm-message').textContent = message;
  backdrop.classList.add('is-open');
  return new Promise((resolve) => {
    const ok = backdrop.querySelector('#app-btn-ok');
    const cancel = backdrop.querySelector('#app-btn-cancel');
    ok.textContent = okText; cancel.textContent = cancelText;
    const close = () => {
      backdrop.classList.remove('is-open');
      ok.onclick = cancel.onclick = backdrop.onclick = null;
      document.removeEventListener('keydown', handleKeydown);
    };
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        close();
        resolve(false);
      }
    };
    backdrop.onclick = (event) => {
      if (event.target === backdrop) {
        close();
        resolve(false);
      }
    };
    ok.onclick = () => { close(); resolve(true); };
    cancel.onclick = () => { close(); resolve(false); };
    document.addEventListener('keydown', handleKeydown);
    ok.focus();
  });
}
