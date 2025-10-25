// Lightweight feedback utilities: Toast and Confirm Modal
// Self-contained styles are injected on first use.

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected) return;
  const css = `
  .app-toast-stack { position: fixed; right: 16px; bottom: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 10000; }
  .app-toast { min-width: 240px; max-width: 360px; padding: 10px 12px; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.12); color: #fff; font-size: 14px; line-height: 1.4; }
  .app-toast.info { background: #2d7ef7; }
  .app-toast.success { background: #2ecc71; }
  .app-toast.warning { background: #f39c12; }
  .app-toast.error { background: #e74c3c; }
  .app-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: none; align-items: center; justify-content: center; z-index: 9999; }
  .app-modal { width: 360px; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden; }
  .app-modal-header { padding: 12px 16px; font-weight: 600; border-bottom: 1px solid #d9d9d9; background: #f8f8f8; }
  .app-modal-body { padding: 16px; color: #333; }
  .app-modal-footer { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #d9d9d9; justify-content: flex-end; }
  .app-btn { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 8px; cursor: pointer; background: #fff; }
  .app-btn-primary { background: #2d7ef7; color: #fff; border-color: #1f6fe0; }
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
  el.textContent = message;
  stack.appendChild(el);
  const timer = setTimeout(() => {
    el.style.transition = 'opacity .25s ease, transform .25s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
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
          <button class="app-btn" id="app-btn-cancel">取消</button>
          <button class="app-btn app-btn-primary" id="app-btn-ok">确定</button>
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
  backdrop.style.display = 'flex';
  return new Promise((resolve) => {
    const ok = backdrop.querySelector('#app-btn-ok');
    const cancel = backdrop.querySelector('#app-btn-cancel');
    ok.textContent = okText; cancel.textContent = cancelText;
    const close = () => { backdrop.style.display = 'none'; ok.onclick = cancel.onclick = null; };
    ok.onclick = () => { close(); resolve(true); };
    cancel.onclick = () => { close(); resolve(false); };
  });
}