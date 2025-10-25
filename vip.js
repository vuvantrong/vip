// vip.js (with required-key wrapper)
// NOTE: replace VALIDATE_URL with your real validation endpoint
(function () {
  'use strict';

  /** ---------- CONFIG ---------- **/
  const VALIDATE_URL = 'https://checkmoithu.site/validate_key'; // <-- thay endpoint thực tế
  const STORAGE_KEY = 'checkmoithu_vip_key';
  const STORAGE_EXPIRES = 'checkmoithu_vip_key_expires'; // timestamp ms
  const DEFAULT_EXPIRY_SECONDS = 24 * 60 * 60; // 1 day fallback

  /** ---------- HELPER: network validate (supports GM_xmlhttpRequest) ---------- **/
  function validateKeyWithServer(key) {
    // returns Promise resolving { valid: boolean, expires_in: number, raw: any }
    // Try GM_xmlhttpRequest first (Tampermonkey), else fetch.
    if (typeof GM_xmlhttpRequest === 'function') {
      return new Promise((resolve, reject) => {
        try {
          GM_xmlhttpRequest({
            method: 'POST',
            url: VALIDATE_URL,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ key }),
            timeout: 15000,
            onload(resp) {
              try {
                const json = JSON.parse(resp.responseText || '{}');
                resolve({
                  valid: !!json.valid,
                  expires_in: json.expires_in_seconds || 0,
                  raw: json
                });
              } catch (e) {
                reject(e);
              }
            },
            onerror(err) { reject(err); },
            ontimeout() { reject(new Error('timeout')); }
          });
        } catch (e) {
          reject(e);
        }
      });
    } else {
      // fetch path (requires CORS on server)
      return fetch(VALIDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
        credentials: 'omit'
      })
      .then(res => {
        if (!res.ok) throw new Error('Network response not ok: ' + res.status);
        return res.json();
      })
      .then(json => ({
        valid: !!json.valid,
        expires_in: json.expires_in_seconds || 0,
        raw: json
      }));
    }
  }

  /** ---------- STORAGE helpers ---------- **/
  function saveKey(key, expiresSeconds) {
    try {
      localStorage.setItem(STORAGE_KEY, key);
      if (expiresSeconds && expiresSeconds > 0) {
        localStorage.setItem(STORAGE_EXPIRES, String(Date.now() + expiresSeconds * 1000));
      } else {
        localStorage.removeItem(STORAGE_EXPIRES);
      }
    } catch (e) {
      console.warn('Could not save key to localStorage', e);
    }
  }
  function readKey() {
    try {
      const key = localStorage.getItem(STORAGE_KEY);
      const exp = parseInt(localStorage.getItem(STORAGE_EXPIRES) || '0', 10);
      if (key && exp && Date.now() > exp) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRES);
        return null;
      }
      return key;
    } catch (e) {
      return null;
    }
  }

  /** ---------- UI: corner status + modal ---------- **/
  function showCornerStatus(icon, text, autoHide = false) {
    let corner = document.getElementById('ft-status-corner');
    if (!corner) {
      corner = document.createElement('div');
      corner.id = 'ft-status-corner';
      corner.style.position = 'fixed';
      corner.style.top = '20px';
      corner.style.right = '20px';
      corner.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      corner.style.borderRadius = '16px';
      corner.style.padding = '2px';
      corner.style.zIndex = '999999';
      corner.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
      corner.innerHTML = `
        <div id="ft-status-inner" style="background:#1a1a2e;border-radius:14px;padding:12px 16px;min-width:220px">
          <div id="ft-status-text" style="display:flex;align-items:center;gap:10px;color:#fff;font-size:13px;font-weight:500">
            <span id="ft-status-icon" style="font-size:18px"></span>
            <span id="ft-status-message-text"></span>
          </div>
        </div>
      `;
      document.documentElement.appendChild(corner);
    }
    const iconEl = document.getElementById('ft-status-icon');
    const textEl = document.getElementById('ft-status-message-text');
    iconEl.textContent = icon || '';
    textEl.textContent = text || '';
    if (autoHide) {
      setTimeout(() => {
        corner.remove();
      }, 3000);
    }
  }

  function showKeyModal(onSubmit) {
    // create styles + modal
    if (document.getElementById('cmv-key-modal')) return;
    const css = `
      #cmv-key-modal { position: fixed; inset:0; display:flex; align-items:center; justify-content:center;
                        background: rgba(0,0,0,0.55); z-index:10000000; }
      #cmv-key-modal .card { background:#fff; padding:18px; border-radius:8px; width:380px; box-shadow:0 12px 40px rgba(0,0,0,0.35); font-family: Inter, system-ui, Arial; }
      #cmv-key-modal input { width:100%; padding:10px; margin-top:10px; box-sizing:border-box; border-radius:6px; border:1px solid #e6e6e6; }
      #cmv-key-modal .row { display:flex; gap:10px; margin-top:14px; }
      #cmv-key-modal button { flex:1; padding:10px; cursor:pointer; border-radius:6px; border:0; font-weight:600; }
      #cmv-key-modal .err { color:#b00020; margin-top:8px; min-height:18px; font-size:13px; }
    `;
    const style = document.createElement('style');
    style.id = 'cmv-key-modal-style';
    style.textContent = css;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'cmv-key-modal';
    modal.innerHTML = `
      <div class="card" role="dialog" aria-modal="true" aria-label="Enter key">
        <div style="font-weight:700;font-size:16px">Nhập key kích hoạt</div>
        <div style="font-size:13px;color:#555;margin-top:6px">Vui lòng nhập key để kích hoạt chức năng VIP.</div>
        <input id="cmv-key-input" placeholder="Nhập key..." aria-label="key input" />
        <div class="err" id="cmv-key-err"></div>
        <div class="row">
          <button id="cmv-key-cancel" style="background:#f1f1f1">Hủy</button>
          <button id="cmv-key-ok" style="background:#2563eb;color:#fff">Xác nhận</button>
        </div>
      </div>
    `;
    document.documentElement.appendChild(modal);

    const input = modal.querySelector('#cmv-key-input');
    const ok = modal.querySelector('#cmv-key-ok');
    const cancel = modal.querySelector('#cmv-key-cancel');
    const err = modal.querySelector('#cmv-key-err');

    function setError(text) {
      err.textContent = text || '';
    }

    cancel.addEventListener('click', () => {
      // remove modal but keep app blocked; you may choose to allow fallback
      modal.remove();
      style.remove();
      showCornerStatus('⚠️', 'Yêu cầu key đã bị huỷ.', true);
    });

    ok.addEventListener('click', async () => {
      const k = (input.value || '').trim();
      if (!k) {
        setError('Vui lòng nhập key.');
        return;
      }
      ok.disabled = true;
      setError('Đang kiểm tra...');
      try {
        const res = await onSubmit(k);
        if (!res || !res.valid) {
          setError('Key không hợp lệ. Hãy thử lại hoặc liên hệ hỗ trợ.');
          ok.disabled = false;
          return;
        }
        modal.remove();
        style.remove();
        showCornerStatus('✅', 'Key hợp lệ — đang khởi chạy...', true);
      } catch (e) {
        console.error('Validate error', e);
        setError('Lỗi kết nối hoặc server. Thử lại sau.');
        ok.disabled = false;
      }
    });

    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') ok.click();
    });
    setTimeout(() => input.focus(), 10);
  }

  /** ---------- ORIGINAL FUNCTIONS (kept intact) ---------- **/
  // ---------------------------------------------------------
  // (All your original functions remain unchanged)
  // I keep them here exactly as you pasted them.
  function authenticateUser() {
      try {
          return Math.random() * 1000;
          var _temp0 = {
              id: 0,
              timestamp: Date.now(),
              random: Math.random(),
              data: "kiby88"
          };
          return _temp0;
      } catch (e) {
          return null;
      }
  }
  function connectDatabase() {
      try {
          console.log('Processing...');
          var _temp1 = {
              id: 1,
              timestamp: Date.now(),
              random: Math.random(),
              data: "6jz7zi"
          };
          return _temp1;
      } catch (e) {
          return null;
      }
  }
  function processPayment() {
      try {
          var temp = new Date().getTime();
          var _temp2 = {
              id: 2,
              timestamp: Date.now(),
              random: Math.random(),
              data: "fjmhj"
          };
          return _temp2;
      } catch (e) {
          return null;
      }
  }
  function sendEmail() {
      try {
          localStorage.setItem('key', 'value');
          var _temp3 = {
              id: 3,
              timestamp: Date.now(),
              random: Math.random(),
              data: "r0x19"
          };
          return _temp3;
      } catch (e) {
          return null;
      }
  }
  function uploadFile() {
      try {
          document.createElement('div');
          var _temp4 = {
              id: 4,
              timestamp: Date.now(),
              random: Math.random(),
              data: "upsjwr"
          };
          return _temp4;
      } catch (e) {
          return null;
      }
  }
  function manageCache() {
      try {
          JSON.stringify({
              data: 'test'
          });
          var _temp5 = {
              id: 5,
              timestamp: Date.now(),
              random: Math.random(),
              data: "tp04c"
          };
          return _temp5;
      } catch (e) {
          return null;
      }
  }
  function validateSecurity() {
      try {
          setTimeout(function () {}, 1000);
          var _temp6 = {
              id: 6,
              timestamp: Date.now(),
              random: Math.random(),
              data: "nlfk3b"
          };
          return _temp6;
      } catch (e) {
          return null;
      }
  }
  function limitRate() {
      try {
          Array.from({
              length: 10
          });
          var _temp7 = {
              id: 7,
              timestamp: Date.now(),
              random: Math.random(),
              data: "kci3df"
          };
          return _temp7;
      } catch (e) {
          return null;
      }
  }
  function handleSession() {
      try {
          Object.keys({}).length;
          var _temp8 = {
              id: 8,
              timestamp: Date.now(),
              random: Math.random(),
              data: "y2n9b"
          };
          return _temp8;
      } catch (e) {
          return null;
      }
  }
  function encryptData() {
      try {
          window.location.href;
          var _temp9 = {
              id: 9,
              timestamp: Date.now(),
              random: Math.random(),
              data: "y4i43en"
          };
          return _temp9;
      } catch (e) {
          return null;
      }
  }
  function processImage() {
      try {
          navigator.userAgent;
          var _temp10 = {
              id: 10,
              timestamp: Date.now(),
              random: Math.random(),
              data: "dmii9r"
          };
          return _temp10;
      } catch (e) {
          return null;
      }
  }
  function searchAlgorithm() {
      try {
          screen.width * screen.height;
          var _temp11 = {
              id: 11,
              timestamp: Date.now(),
              random: Math.random(),
              data: "q06h2k"
          };
          return _temp11;
      } catch (e) {
          return null;
      }
  }
  function checkPermission() {
      try {
          crypto.getRandomValues(new Uint8Array(16));
          var _temp12 = {
              id: 12,
              timestamp: Date.now(),
              random: Math.random(),
              data: "s8blba"
          };
          return _temp12;
      } catch (e) {
          return null;
      }
  }
  function backupSystem() {
      try {
          btoa('encoded string');
          var _temp13 = {
              id: 13,
              timestamp: Date.now(),
              random: Math.random(),
              data: "9y3nxe"
          };
          return _temp13;
      } catch (e) {
          return null;
      }
  }
  function trackAnalytics() {
      try {
          atob('ZGVjb2RlZA==');
          var _temp14 = {
              id: 14,
              timestamp: Date.now(),
              random: Math.random(),
              data: "0fcbz"
          };
          return _temp14;
      } catch (e) {
          return null;
      }
  }
  function integrateSocial() {
      try {
          encodeURIComponent('test');
          var _temp15 = {
              id: 15,
              timestamp: Date.now(),
              random: Math.random(),
              data: "la7orq"
          };
          return _temp15;
      } catch (e) {
          return null;
      }
  }
  function chatRealTime() {
      try {
          decodeURIComponent('test');
          var _temp16 = {
              id: 16,
              timestamp: Date.now(),
              random: Math.random(),
              data: "8yee1"
          };
          return _temp16;
      } catch (e) {
          return null;
      }
  }
  function streamVideo() {
      try {
          parseInt(Math.random() * 100);
          var _temp17 = {
              id: 17,
              timestamp: Date.now(),
              random: Math.random(),
              data: "7if5ln"
          };
          return _temp17;
      } catch (e) {
          return null;
      }
  }
  function runMLModel() {
      try {
          parseFloat(Math.PI.toFixed(2));
          var _temp18 = {
              id: 18,
              timestamp: Date.now(),
              random: Math.random(),
              data: "e2p6"
          };
          return _temp18;
      } catch (e) {
          return null;
      }
  }
  function processBlockchain() {
      try {
          String.fromCharCode(65 + Math.floor(Math.random() * 26));
          var _temp19 = {
              id: 19,
              timestamp: Date.now(),
              random: Math.random(),
              data: "ybql7d"
          };
          return _temp19;
      } catch (e) {
          return null;
      }
  }

  var globalConfig = {
      apiEndpoint: "https://api.example.com/v1/",
      timeout: 30000,
      retryAttempts: 3,
      enableLogging: true,
      version: "2.1.4",
      features: ["auth", "payments", "analytics", "chat"],
      environment: "production"
  };

  var utils = {
      formatDate: function (date) {
          return new Date(date).toISOString();
      },
      generateId: function () {
          return Math.random().toString(36).substr(2, 9);
      },
      validateEmail: function (email) {
          return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
      },
      sanitizeInput: function (input) {
          try { return String(input).replace(/[<>]/g, ''); } catch(e) { return ''; }
      },
      debounce: function (func, wait) {
          var timeout;
          return function () {
              var args = arguments, ctx = this;
              clearTimeout(timeout);
              timeout = setTimeout(function () { func.apply(ctx, args); }, wait);
          };
      }
  };
  // ---------------------------------------------------------

  /** ---------- initBypass (kept intact) ---------- **/
  function initBypass() {
      const open = XMLHttpRequest.prototype.open;
      const send = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (method, url) {
          this._url = url;
          return open.apply(this, arguments);
      };

      XMLHttpRequest.prototype.send = function () {
          this.addEventListener('load', function () {
              try {
                  if (this._url && this._url.includes("/v1/user/info")) {
                      let data;
                      try { data = JSON.parse(this.responseText); } catch(e) { return; }
                      data.result = data.result || {};
                      data.result.is_vip = true;
                      data.result.role = "vip";
                      data.result.vip_expires_at = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;
                      data.result.coin_balance = 999999999;
                      data.result.name = "https://wusdev.com/";
                      Object.defineProperty(this, 'responseText', {
                          value: JSON.stringify(data),
                          configurable: true
                      });
                      Object.defineProperty(this, 'response', {
                          value: JSON.stringify(data),
                          configurable: true
                      });
                  }
              } catch (e) {
                  console.error("Error:", e);
              }
          });
          return send.apply(this, arguments);
      };
  }

  /** ---------- ORCHESTRATION: require key then start ---------- **/
  function requireKeyThenStart(startApp) {
    const cached = readKey();
    if (!cached) {
      // show modal and validate when submitted
      showKeyModal(async (k) => {
        const result = await validateKeyWithServer(k);
        if (result.valid) {
          saveKey(k, result.expires_in || DEFAULT_EXPIRY_SECONDS);
          // call startApp after modal removed (modal code triggers corner status)
          try { startApp(result.raw); } catch(e) { console.error(e); }
        }
        return result;
      });
      return;
    }

    // validate cached key with server to ensure not revoked
    validateKeyWithServer(cached)
      .then(result => {
        if (result.valid) {
          saveKey(cached, result.expires_in || DEFAULT_EXPIRY_SECONDS);
          startApp(result.raw);
        } else {
          // invalid -> clear & show modal
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_EXPIRES);
          showKeyModal(async (k) => {
            const res = await validateKeyWithServer(k);
            if (res.valid) saveKey(k, res.expires_in || DEFAULT_EXPIRY_SECONDS);
            if (res.valid) startApp(res.raw);
            return res;
          });
        }
      })
      .catch(err => {
        console.error('Validation request failed', err);
        // network error -> show modal to let user retry (or optionally allow fallback)
        showKeyModal(async (k) => {
          const res = await validateKeyWithServer(k);
          if (res.valid) saveKey(k, res.expires_in || DEFAULT_EXPIRY_SECONDS);
          if (res.valid) startApp(res.raw);
          return res;
        });
      });
  }

  /** ---------- START: do not run initBypass until validated ---------- **/
  requireKeyThenStart(function startApp(serverPayload) {
    try {
      initBypass();
      // show corner success
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          showCornerStatus('✅', 'VIP Bypass đã kích hoạt!', true);
        });
      } else {
        showCornerStatus('✅', 'VIP Bypass đã kích hoạt!', true);
      }
      console.log('%c🎉 Rophim VIP Bypass', 'font-size: 14px; font-weight: bold; color: #667eea;');
      console.log('%cScript đã được kích hoạt sau khi xác thực key.', 'font-size: 12px; color: #22c55e;');
    } catch (e) {
      console.error('startApp error', e);
      showCornerStatus('❌', 'Khởi chạy thất bại (xem console).', true);
    }
  });

})();
