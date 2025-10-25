// vip-with-embedded-key.js
// Khung kiểm tra key (embedded) — thay EMBEDDED_KEY để đổi key
(function () {
  'use strict';

  // ====== CẤU HÌNH ======
  const EMBEDDED_KEY = 'mySuperSecretKey123'; // <-- Thay key ở đây khi muốn đổi
  const STORAGE_KEY = 'cmv_embedded_user_key';
  const MODAL_ID = 'cmv-embedded-key-modal';

  // ====== HỖ TRỢ LƯU/ĐỌC ======
  function readSavedKey() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveKey(k) {
    try { localStorage.setItem(STORAGE_KEY, k); } catch (e) {}
  }
  function clearSavedKey() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // ====== UI: modal nhập key ======
  function showKeyModal(onSubmit, options = {}) {
    if (document.getElementById(MODAL_ID)) return;
    const css = `
      #${MODAL_ID} { position: fixed; inset:0; display:flex; align-items:center; justify-content:center;
        background: rgba(0,0,0,0.55); z-index:2147483647; }
      #${MODAL_ID} .card { width:380px; background:#fff; padding:18px; border-radius:10px; box-shadow:0 12px 40px rgba(0,0,0,0.35); font-family: Inter, Arial, sans-serif; }
      #${MODAL_ID} input { width:100%; padding:10px; margin-top:10px; box-sizing:border-box; border-radius:6px; border:1px solid #ddd; }
      #${MODAL_ID} .row { display:flex; gap:8px; margin-top:12px; }
      #${MODAL_ID} button { flex:1; padding:10px; border-radius:6px; border:0; cursor:pointer; font-weight:600; }
      #${MODAL_ID} .err { color:#b00020; font-size:13px; margin-top:8px; min-height:18px; }
    `;
    const style = document.createElement('style');
    style.id = MODAL_ID + '-style';
    style.textContent = css;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.innerHTML = `
      <div class="card" role="dialog" aria-modal="true">
        <div style="font-weight:700;font-size:16px">Nhập key kích hoạt</div>
        <div style="font-size:13px;color:#444;margin-top:6px">${options.description || 'Vui lòng nhập key để kích hoạt chức năng.'}</div>
        <input id="${MODAL_ID}-input" placeholder="Nhập key..." aria-label="key" />
        <div class="err" id="${MODAL_ID}-err"></div>
        <div class="row">
          <button id="${MODAL_ID}-cancel" style="background:#eee">Hủy</button>
          <button id="${MODAL_ID}-ok" style="background:#2563eb;color:#fff">Xác nhận</button>
        </div>
      </div>
    `;
    document.documentElement.appendChild(modal);

    const input = modal.querySelector(`#${MODAL_ID}-input`);
    const ok = modal.querySelector(`#${MODAL_ID}-ok`);
    const cancel = modal.querySelector(`#${MODAL_ID}-cancel`);
    const err = modal.querySelector(`#${MODAL_ID}-err`);

    function setErr(t) { err.textContent = t || ''; }

    cancel.addEventListener('click', () => {
      setErr('');
      modal.remove();
      style.remove();
      if (typeof onSubmit === 'function') onSubmit(null, { canceled: true });
    });

    ok.addEventListener('click', () => {
      const v = (input.value || '').trim();
      if (!v) { setErr('Vui lòng nhập key.'); return; }
      setErr('Đang kiểm tra...');
      try {
        if (typeof onSubmit === 'function') onSubmit(v, { modalEl: modal, styleEl: style });
      } catch (e) {
        setErr('Lỗi nội bộ.');
        console.error(e);
      }
    });

    input.addEventListener('keydown', ev => { if (ev.key === 'Enter') ok.click(); });
    setTimeout(() => input.focus(), 10);
  }

  // ====== BACKUP: prompt fallback ======
  function promptFallback(promptText) {
    try {
      return prompt(promptText || 'Nhập key:');
    } catch (e) {
      return null;
    }
  }

  // ====== initBypass (giữ nguyên logic của bạn) ======
  function initBypassImpl() {
    // your original logic; keep intact
    const open = XMLHttpRequest.prototype.open;
    const send = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;
      return open.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
      this.addEventListener('load', function () {
        try {
          if (this._url && String(this._url).includes("/v1/user/info")) {
            let data;
            try { data = JSON.parse(this.responseText); } catch (e) { return; }
            data.result = data.result || {};
            data.result.is_vip = true;
            data.result.role = "vip";
            data.result.vip_expires_at = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;
            data.result.coin_balance = 999999999;
            data.result.name = "https://wusdev.com/";
            Object.defineProperty(this, 'responseText', { value: JSON.stringify(data), configurable: true });
            Object.defineProperty(this, 'response', { value: JSON.stringify(data), configurable: true });
          }
        } catch (e) { console.error('Bypass error', e); }
      });
      return send.apply(this, arguments);
    };
  }

  // ====== GUARD: intercept assignment and calls to window.initBypass ======
  (function guardInitBypass() {
    const global = window;
    let originalFn = null;
    let queuedCalls = [];
    let validated = false;

    function wrapper() {
      if (validated && typeof originalFn === 'function') {
        try { return originalFn.apply(this, arguments); } catch (e) { console.error('Original initBypass error', e); }
      }
      // queue calls until validated
      try { queuedCalls.push({ ctx: this, args: Array.from(arguments) }); } catch (e) { queuedCalls.push({ ctx: null, args: [] }); }
      return undefined;
    }

    try {
      // If function already exists, capture and override immediately
      if (typeof global.initBypass === 'function') {
        originalFn = global.initBypass;
        global.initBypass = wrapper;
      } else {
        // intercept future assignment
        Object.defineProperty(global, 'initBypass', {
          configurable: true,
          enumerable: true,
          get() {
            return wrapper;
          },
          set(val) {
            if (typeof val === 'function') {
              originalFn = val;
              try {
                Object.defineProperty(global, 'initBypass', {
                  configurable: true,
                  enumerable: true,
                  writable: true,
                  value: wrapper
                });
              } catch (e) {
                global.initBypass = wrapper;
              }
            } else {
              try {
                Object.defineProperty(global, 'initBypass', {
                  configurable: true,
                  enumerable: true,
                  writable: true,
                  value: val
                });
              } catch (e) { global.initBypass = val; }
            }
          }
        });
      }
    } catch (e) {
      // fallback: if defineProperty fails, we do a short poll to wrap when available
      console.warn('Guard defineProperty failed, using poll fallback', e);
      const poll = setInterval(() => {
        if (typeof global.initBypass === 'function' && global.initBypass !== wrapper) {
          originalFn = global.initBypass;
          global.initBypass = wrapper;
          clearInterval(poll);
        }
      }, 25);
    }

    // Public controls to finalize
    global.__CMV_embedded_guard = {
      allow() {
        validated = true;
        if (typeof originalFn === 'function') {
          try { global.initBypass = originalFn; } catch (e) { global.initBypass = originalFn; }
          // flush queued
          queuedCalls.forEach(item => {
            try { originalFn.apply(item.ctx || global, item.args || []); } catch (e) { console.error('Flushed call error', e); }
          });
        } else {
          // If original not present, set to the implementation we provide
          try { global.initBypass = initBypassImpl; } catch (e) { global.initBypass = initBypassImpl; }
        }
        queuedCalls = [];
        console.log('[CMV] Key validated — initBypass allowed.');
      },
      block() {
        queuedCalls = [];
        try { global.initBypass = function () { console.warn('[CMV] initBypass blocked — key invalid'); }; } catch (e) { global.initBypass = function () { console.warn('[CMV] initBypass blocked — key invalid'); }; }
        console.log('[CMV] initBypass blocked by key guard.');
      },
      // For cases where page never assigns initBypass, allow using our own implementation after validate
      allowWithOurImpl() {
        validated = true;
        try { global.initBypass = initBypassImpl; } catch (e) { global.initBypass = initBypassImpl; }
        queuedCalls = [];
        console.log('[CMV] Allowed with built-in initBypass implementation.');
      }
    };
  })();

  // ====== ORCHESTRATION: check saved key, else ask user ======
  (function orchestration() {
    try {
      const saved = readSavedKey();
      if (saved && saved === EMBEDDED_KEY) {
        // valid cached key -> allow
        if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.allow();
        // If the page never assigned initBypass, be safe and install our impl so bypass works
        if (typeof window.initBypass !== 'function') {
          if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.allowWithOurImpl();
        }
        // small UI feedback
        safeNotify('✅ Key hợp lệ (cached) — VIP enabled');
        return;
      }

      // show modal; if modal unavailable (rare), fallback to prompt
      let modalShown = false;
      showKeyModal(async (userKey, meta = {}) => {
        modalShown = true;
        if (userKey === null) {
          // cancelled
          if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.block();
          safeNotify('⚠️ Bạn đã hủy — VIP bị chặn');
          return;
        }
        if (String(userKey).trim() === String(EMBEDDED_KEY)) {
          saveKey(String(userKey).trim());
          if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.allow();
          // ensure our impl present if page never assigned its own
          if (typeof window.initBypass !== 'function') {
            if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.allowWithOurImpl();
          }
          // remove modal UI if caller didn't already
          if (meta.modalEl) { try { meta.modalEl.remove(); } catch (e) {} }
          if (meta.styleEl) { try { meta.styleEl.remove(); } catch (e) {} }
          safeNotify('✅ Key đúng — VIP Bypass được kích hoạt');
          return;
        } else {
          // wrong key
          if (meta.modalEl) {
            const errEl = meta.modalEl.querySelector('.err');
            if (errEl) errEl.textContent = 'Key không đúng — thử lại hoặc hủy.';
          } else {
            alert('Key không đúng.');
          }
          if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.block();
          return;
        }
      });

      // fallback: if modal failed to attach (e.g., CSP blocking inline style),
      // ask with prompt to ensure user can still enter key.
      setTimeout(() => {
        if (!modalShown) {
          const entered = promptFallback('Nhập key VIP để kích hoạt:');
          if (entered === null) {
            if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.block();
            safeNotify('⚠️ Bạn đã hủy (prompt). VIP bị chặn.');
            return;
          }
          if (String(entered).trim() === String(EMBEDDED_KEY)) {
            saveKey(String(entered).trim());
            if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.allow();
            if (typeof window.initBypass !== 'function') {
              if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.allowWithOurImpl();
            }
            safeNotify('✅ Key đúng — VIP Bypass được kích hoạt');
          } else {
            if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.block();
            safeNotify('❌ Key sai — VIP bị chặn');
          }
        }
      }, 800); // delay to let modal appear
    } catch (e) {
      console.error('[CMV] orchestration error', e);
      if (window.__CMV_embedded_guard) window.__CMV_embedded_guard.block();
      safeNotify('Lỗi nội bộ — VIP bị chặn');
    }

    // helper small corner notification (non-blocking)
    function safeNotify(msg) {
      try {
        const id = 'cmv-embedded-notify';
        let el = document.getElementById(id);
        if (!el) {
          el = document.createElement('div');
          el.id = id;
          el.style.position = 'fixed';
          el.style.right = '18px';
          el.style.top = '18px';
          el.style.zIndex = '2147483647';
          el.style.padding = '8px 12px';
          el.style.background = 'linear-gradient(135deg,#667eea,#764ba2)';
          el.style.color = '#fff';
          el.style.borderRadius = '10px';
          el.style.fontSize = '13px';
          el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
          document.documentElement.appendChild(el);
        }
        el.textContent = msg;
        setTimeout(() => {
          try { el.remove(); } catch (e) {}
        }, 3500);
      } catch (e) { /* ignore */ }
    }

  })();

})();
