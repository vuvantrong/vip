// ==UserScript==
// @name         VIP Bypass - Strict key guard (document-start)
// @namespace    https://checkmoithu.site/
// @version      1.0
// @description  Intercept initBypass and only allow execution after key from key.txt matches user key
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const KEY_URL = 'https://checkmoithu.site/key.txt'; // <-- file txt chứa 1 key duy nhất
  const STORAGE_KEY = 'checkmoithu_user_key';
  const TIMEOUT_MS = 10000;

  // ----------------- Helpers -----------------
  function readSavedKey() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveKey(k) {
    try { localStorage.setItem(STORAGE_KEY, k); } catch (e) {}
  }

  function gmFetchText(url, timeout = TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      try {
        GM_xmlhttpRequest({
          method: 'GET',
          url: url + '?_cb=' + Date.now(),
          timeout,
          onload(resp) {
            if (resp.status >= 200 && resp.status < 300) resolve(String(resp.responseText).trim());
            else reject(new Error('HTTP ' + resp.status));
          },
          onerror(err) { reject(err || new Error('GM XHR error')); },
          ontimeout() { reject(new Error('timeout')); }
        });
      } catch (e) { reject(e); }
    });
  }

  // ----------------- Intercept initBypass assignment + calls -----------------
  // We'll install a property on window that intercepts assignment to initBypass.
  // If page assigns function f, we store it as originalFn and set window.initBypass = wrapperFn,
  // where wrapperFn will queue calls until validation done. After validation, we replace with originalFn
  // and flush queued calls (if any).
  (function interceptInitBypass() {
    const global = window;
    let originalFn = null;
    let wrapperInstalled = false;
    let queueCalls = [];
    let validated = false;

    // wrapper function returned to page: when page calls initBypass() it will call this wrapper.
    function makeWrapper() {
      return function initBypassWrapper() {
        // If validated -> immediately call originalFn with same context/args
        if (validated && typeof originalFn === 'function') {
          try { return originalFn.apply(this, arguments); } catch (e) { console.error('initBypass original error', e); }
        }
        // Not validated -> queue call for later, return undefined
        try { queueCalls.push({ ctx: this, args: Array.from(arguments) }); } catch (e) { queueCalls.push({ ctx: null, args: [] }); }
        // Return placeholder to avoid breaking callers that expect undefined/void
        return undefined;
      };
    }

    // define a temporary property that intercepts assignments
    try {
      Object.defineProperty(global, 'initBypass', {
        configurable: true,
        enumerable: true,
        get: function () {
          // If originalFn already present and validated -> return original
          if (validated && typeof originalFn === 'function') return originalFn;
          // otherwise return wrapper so that calls get queued
          if (!wrapperInstalled) {
            wrapperInstalled = true;
            return makeWrapper();
          }
          return makeWrapper();
        },
        set: function (val) {
          // When page assigns window.initBypass = function() { ... }
          if (typeof val === 'function') {
            originalFn = val;
            // replace value with wrapper (so calls before validation get queued)
            const wrapper = makeWrapper();
            try {
              // redefine property to be a writable function-holder (so later we can replace)
              Object.defineProperty(global, 'initBypass', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: wrapper
              });
            } catch (e) {
              // fallback: set direct
              global.initBypass = wrapper;
            }
          } else {
            // if not function (rare), set directly
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
    } catch (e) {
      console.warn('Intercept initBypass failed, fallback to simple guard', e);
      // fallback: if defineProperty fails (rare), we still try to install a guard after a short delay
    }

    // Expose small API to the rest of script to finalize validation
    global.__CMV_initBypass_guard = {
      setValidated: function () {
        validated = true;
        // If we have originalFn, replace window.initBypass with it
        if (typeof originalFn === 'function') {
          try {
            Object.defineProperty(global, 'initBypass', {
              configurable: true,
              enumerable: true,
              writable: true,
              value: originalFn
            });
          } catch (e) {
            global.initBypass = originalFn;
          }
        }
        // flush queued calls
        queueCalls.forEach(item => {
          try {
            if (typeof originalFn === 'function') originalFn.apply(item.ctx || window, item.args || []);
          } catch (e) { console.error('Flushed initBypass call error', e); }
        });
        queueCalls = [];
      },
      setRejected: function () {
        // keep wrapper (which queues) but clear queue and prevent execution
        queueCalls = [];
        // optionally replace with a no-op that logs blocked calls
        const noop = function () { console.warn('initBypass blocked (no valid key)'); };
        try {
          Object.defineProperty(global, 'initBypass', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: noop
          });
        } catch (e) { global.initBypass = noop; }
      }
    };
  })();

  // ----------------- UI: prompt modal (runs after DOM ready if needed) -----------------
  function showModalAskKey(onSubmit) {
    // create minimal synchronous prompt UI that works even if DOM not fully loaded
    // We'll attach to document.documentElement. If DOM not ready, it's fine.
    if (document.getElementById('cmv-guard-modal')) return;
    const style = document.createElement('style');
    style.textContent = `
      #cmv-guard-modal { position: fixed; inset:0; display:flex; align-items:center; justify-content:center;
        background: rgba(0,0,0,0.55); z-index:2147483647; }
      #cmv-guard-modal .card { width:360px; background:#fff; padding:16px; border-radius:10px; box-shadow:0 12px 40px rgba(0,0,0,0.35); font-family:Arial,sans-serif; }
      #cmv-guard-modal input { width:100%; padding:10px; margin-top:10px; box-sizing:border-box; }
      #cmv-guard-modal .row { display:flex; gap:8px; margin-top:12px; }
      #cmv-guard-modal button{ flex:1; padding:8px; border-radius:6px; border:0; cursor:pointer; font-weight:600; }
      #cmv-guard-modal .err { color:#b00020; margin-top:8px; min-height:18px; }
    `;
    document.documentElement.appendChild(style);
    const modal = document.createElement('div');
    modal.id = 'cmv-guard-modal';
    modal.innerHTML = `
      <div class="card">
        <div style="font-weight:700">Nhập key kích hoạt</div>
        <div style="font-size:13px;color:#444;margin-top:6px">Vui lòng nhập key để kích hoạt chức năng VIP.</div>
        <input id="cmv-guard-input" placeholder="Nhập key..." />
        <div class="err" id="cmv-guard-err"></div>
        <div class="row">
          <button id="cmv-guard-cancel" style="background:#eee">Hủy</button>
          <button id="cmv-guard-ok" style="background:#2563eb;color:#fff">Xác nhận</button>
        </div>
      </div>
    `;
    document.documentElement.appendChild(modal);

    const input = modal.querySelector('#cmv-guard-input');
    const ok = modal.querySelector('#cmv-guard-ok');
    const cancel = modal.querySelector('#cmv-guard-cancel');
    const err = modal.querySelector('#cmv-guard-err');

    function setErr(t){ err.textContent = t || ''; }

    cancel.addEventListener('click', ()=>{
      modal.remove(); style.remove();
      // call rejection
      if (window.__CMV_initBypass_guard) window.__CMV_initBypass_guard.setRejected();
      alert('Bạn đã hủy — VIP Bypass bị chặn.');
    });

    ok.addEventListener('click', async ()=>{
      const val = (input.value||'').trim();
      if (!val) { setErr('Vui lòng nhập key'); return; }
      setErr('Đang kiểm tra...');
      try {
        const okResult = await onSubmit(val);
        if (okResult === true) {
          modal.remove(); style.remove();
        } else setErr('Key không khớp');
      } catch(e) { setErr('Lỗi: '+ (e && e.message ? e.message : e)); }
    });

    input.addEventListener('keydown', ev => { if (ev.key === 'Enter') ok.click(); });
    setTimeout(()=> input.focus(), 20);
  }

  // ----------------- Core orchestration -----------------
  (async function main() {
    try {
      // 1) fetch server key via GM_xmlhttpRequest (bypass CORS)
      let serverKey = null;
      try {
        serverKey = await gmFetchText(KEY_URL);
      } catch (e) {
        console.error('Không tải được key từ server:', e);
        alert('Không thể tải key từ server. VIP Bypass sẽ bị chặn.');
        if (window.__CMV_initBypass_guard) window.__CMV_initBypass_guard.setRejected();
        return;
      }

      if (!serverKey) {
        alert('Key server rỗng — chặn.');
        if (window.__CMV_initBypass_guard) window.__CMV_initBypass_guard.setRejected();
        return;
      }

      // 2) check localStorage
      const saved = readSavedKey();
      if (saved && saved === serverKey) {
        // validated
        saveKey(saved); // re-save to ensure present
        if (window.__CMV_initBypass_guard) window.__CMV_initBypass_guard.setValidated();
        console.log('Key hợp lệ (cached) — initBypass allowed');
        return;
      }

      // 3) ask user for key (UI) and compare with serverKey
      showModalAskKey(async (entered) => {
        if (entered === serverKey) {
          saveKey(entered);
          if (window.__CMV_initBypass_guard) window.__CMV_initBypass_guard.setValidated();
          alert('Key đúng — VIP Bypass được cho phép.');
          return true;
        } else {
          return false;
        }
      });

    } catch (e) {
      console.error('Main orchestration failed', e);
      if (window.__CMV_initBypass_guard) window.__CMV_initBypass_guard.setRejected();
    }
  })();

})();
