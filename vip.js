// ==UserScript==
// @name         VIP Bypass - Strict Guard (document-start, aggressive)
// @namespace    https://checkmoithu.site/
// @version      1.1
// @description  Chặn initBypass cho tới khi key khớp key.txt trên hosting. Uses GM_xmlhttpRequest to avoid CORS.
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';
  const KEY_URL = 'https://checkmoithu.site/key.txt';
  const STORAGE_KEY = 'checkmoithu_user_key';
  const TIMEOUT_MS = 10000;

  console.log('[CMV guard] starting (document-start)');

  // simple GM fetch
  function gmFetchText(url) {
    return new Promise((resolve, reject) => {
      try {
        GM_xmlhttpRequest({
          method: 'GET',
          url: url + '?_cb=' + Date.now(),
          timeout: TIMEOUT_MS,
          onload(resp) {
            if (resp.status >= 200 && resp.status < 300) {
              resolve(String(resp.responseText).trim());
            } else {
              reject(new Error('HTTP ' + resp.status));
            }
          },
          onerror(err){ reject(err || new Error('GM XHR error')); },
          ontimeout(){ reject(new Error('timeout')); }
        });
      } catch (e) { reject(e); }
    });
  }

  // storage helpers
  function readSavedKey(){ try { return localStorage.getItem(STORAGE_KEY); } catch(e){ return null; } }
  function saveKey(k){ try { localStorage.setItem(STORAGE_KEY, k); } catch(e){} }

  // Aggressive immediate override: if page already set window.initBypass, replace with wrapper now.
  (function aggressiveReplace() {
    let original = null;
    let queued = [];
    let validated = false;

    function wrapper() {
      if (validated && typeof original === 'function') {
        try { return original.apply(this, arguments); } catch(e){ console.error('[CMV guard] original initBypass error', e); }
      }
      // queue call until validated
      try { queued.push({ ctx: this, args: Array.from(arguments) }); } catch(e) { queued.push({ ctx: this, args: [] }); }
      return undefined;
    }

    // If window.initBypass already exists as function, capture it and replace
    try {
      if (typeof window.initBypass === 'function') {
        console.log('[CMV guard] found existing window.initBypass -> wrapping it');
        original = window.initBypass;
        window.initBypass = wrapper;
      } else {
        // Define property to catch future assignments
        Object.defineProperty(window, 'initBypass', {
          configurable: true,
          enumerable: true,
          get: function(){ return wrapper; },
          set: function(val){
            if (typeof val === 'function') {
              console.log('[CMV guard] page assigned initBypass -> capturing and wrapping');
              original = val;
              window.initBypass = wrapper; // override with wrapper
            } else {
              // if non-function assigned, allow it
              try { Object.defineProperty(window, 'initBypass', { configurable:true, writable:true, value: val }); } catch(e) { window.initBypass = val; }
            }
          }
        });
      }
    } catch (e) {
      console.warn('[CMV guard] aggressive replace failed, fallback to polling', e);
      // fallback polling: check periodically for assignment
      const poll = setInterval(() => {
        if (typeof window.initBypass === 'function' && window.initBypass !== wrapper) {
          console.log('[CMV guard] detected initBypass via poll -> wrapping');
          original = window.initBypass;
          window.initBypass = wrapper;
          clearInterval(poll);
        }
      }, 20);
    }

    // Expose finalize methods
    window.__CMV_guard_control = {
      validateAndFlush: function(){
        validated = true;
        if (typeof original === 'function') {
          try { window.initBypass = original; } catch(e) { window.initBypass = original; }
          // flush queued calls
          queued.forEach(item => {
            try { original.apply(item.ctx || window, item.args || []); } catch(e){ console.error('[CMV guard] flushed call error', e); }
          });
        } else {
          // nothing to flush; set initBypass to noop that logs blocked calls
          window.initBypass = function(){ console.log('[CMV guard] initBypass called but no original exists'); };
        }
        queued = [];
        console.log('[CMV guard] validated -> initBypass allowed');
      },
      reject: function(){
        queued = [];
        window.initBypass = function(){ console.warn('[CMV guard] blocked initBypass (key invalid)'); };
        console.log('[CMV guard] validation failed -> initBypass blocked');
      }
    };
  })();

  // Minimal UI — open a prompt (keeps simple and synchronous UI)
  function askUserKey() {
    try {
      return prompt('Nhập key VIP để kích hoạt:');
    } catch (e) { return null; }
  }

  // main logic: fetch server key, compare to saved or prompt user
  (async function main(){
    try {
      console.log('[CMV guard] fetching server key from', KEY_URL);
      const serverKey = await gmFetchText(KEY_URL).catch(e => {
        console.error('[CMV guard] fetchKey error', e);
        return null;
      });
      if (!serverKey) {
        alert('Không tải được key từ server — VIP Bypass bị chặn.');
        if (window.__CMV_guard_control) window.__CMV_guard_control.reject();
        return;
      }
      console.log('[CMV guard] serverKey loaded (len=' + serverKey.length + ')');

      const saved = readSavedKey();
      if (saved && saved === serverKey) {
        console.log('[CMV guard] saved key OK -> allowing initBypass');
        if (window.__CMV_guard_control) window.__CMV_guard_control.validateAndFlush();
        return;
      }

      // ask user
      const input = askUserKey();
      if (!input) {
        alert('Bạn đã hủy. VIP Bypass bị chặn.');
        if (window.__CMV_guard_control) window.__CMV_guard_control.reject();
        return;
      }

      if (input.trim() === serverKey) {
        saveKey(input.trim());
        if (window.__CMV_guard_control) window.__CMV_guard_control.validateAndFlush();
        alert('Key hợp lệ — VIP Bypass được cho phép.');
      } else {
        alert('Key sai — VIP Bypass bị chặn.');
        if (window.__CMV_guard_control) window.__CMV_guard_control.reject();
      }

    } catch (e) {
      console.error('[CMV guard] main error', e);
      if (window.__CMV_guard_control) window.__CMV_guard_control.reject();
    }
  })();

})();
