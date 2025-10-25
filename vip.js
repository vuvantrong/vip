// vip-strict-key-check.js
// Bắt buộc check key từ key.txt trên hosting trước khi chạy initBypass()
// NOTE: Thay KEY_URL nếu file .txt để ở vị trí khác.
(function () {
  'use strict';

  const KEY_URL = 'https://checkmoithu.site/key.txt'; // <-- file chứa key hợp lệ (1 dòng)
  const STORAGE_KEY = 'checkmoithu_user_key';
  const CACHE_BUSTER = () => '?_cb=' + Date.now();
  const TIMEOUT_MS = 10000;

  // ---------------- utility: fetch text with timeout (supports GM_xmlhttpRequest fallback) ----------------
  function fetchText(url) {
    // If Tampermonkey's GM_xmlhttpRequest is available, use it (bypass CORS)
    if (typeof GM_xmlhttpRequest === 'function') {
      return new Promise((resolve, reject) => {
        try {
          GM_xmlhttpRequest({
            method: 'GET',
            url: url + CACHE_BUSTER(),
            timeout: TIMEOUT_MS,
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

    // Otherwise use fetch with timeout (requires CORS open on server)
    return new Promise((resolve, reject) => {
      let didTime = false;
      const timer = setTimeout(() => { didTime = true; reject(new Error('timeout')); }, TIMEOUT_MS);
      fetch(url + CACHE_BUSTER(), { cache: 'no-store', credentials: 'omit' })
        .then(r => {
          clearTimeout(timer);
          if (didTime) return;
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        })
        .then(t => resolve(String(t).trim()))
        .catch(err => { if (!didTime) reject(err); });
    });
  }

  // ---------------- UI: simple modal for entering key ----------------
  function showKeyModal(onSubmit) {
    if (document.getElementById('cmv-strict-modal')) return;
    const css = `
      #cmv-strict-modal { position: fixed; inset:0; display:flex; align-items:center; justify-content:center;
        background: rgba(0,0,0,0.55); z-index:2147483647; }
      #cmv-strict-modal .card { width:360px; background:#fff; border-radius:10px; padding:16px; box-shadow:0 12px 40px rgba(0,0,0,0.4); font-family: Arial, sans-serif; }
      #cmv-strict-modal input { width:100%; padding:10px; margin-top:10px; box-sizing:border-box; border-radius:6px; border:1px solid #ddd; }
      #cmv-strict-modal .row { display:flex; gap:8px; margin-top:12px; }
      #cmv-strict-modal button { flex:1; padding:10px; border-radius:6px; border:0; cursor:pointer; font-weight:600; }
      #cmv-strict-modal .err { color:#b00020; font-size:13px; margin-top:8px; min-height:18px; }
    `;
    const style = document.createElement('style');
    style.id = 'cmv-strict-style'; style.textContent = css; document.head.appendChild(style);

    const modal = document.createElement('div'); modal.id = 'cmv-strict-modal';
    modal.innerHTML = `
      <div class="card" role="dialog" aria-modal="true">
        <div style="font-weight:700;font-size:16px">Nhập key kích hoạt</div>
        <div style="font-size:13px;color:#444;margin-top:6px">Bạn phải nhập đúng key để kích hoạt VIP.</div>
        <input id="cmv-strict-input" placeholder="Nhập key..." aria-label="key" />
        <div class="err" id="cmv-strict-err"></div>
        <div class="row">
          <button id="cmv-strict-cancel" style="background:#eee">Hủy</button>
          <button id="cmv-strict-ok" style="background:#2563eb;color:#fff">Xác nhận</button>
        </div>
      </div>
    `;
    document.documentElement.appendChild(modal);

    const input = modal.querySelector('#cmv-strict-input');
    const ok = modal.querySelector('#cmv-strict-ok');
    const cancel = modal.querySelector('#cmv-strict-cancel');
    const err = modal.querySelector('#cmv-strict-err');

    function setError(t) { err.textContent = t || ''; }

    cancel.addEventListener('click', () => {
      setError('');
      modal.remove(); style.remove();
      alert('Bạn đã hủy. VIP Bypass sẽ không được kích hoạt.');
    });

    ok.addEventListener('click', async () => {
      const v = (input.value || '').trim();
      if (!v) { setError('Vui lòng nhập key.'); return; }
      ok.disabled = true; setError('Đang kiểm tra key...');
      try {
        const okRes = await onSubmit(v);
        if (okRes === true) {
          modal.remove(); style.remove();
        } else {
          ok.disabled = false; setError('Key không đúng. Thử lại.');
        }
      } catch (e) {
        ok.disabled = false; setError('Lỗi kiểm tra: ' + (e && e.message ? e.message : e));
      }
    });

    input.addEventListener('keydown', ev => { if (ev.key === 'Enter') ok.click(); });
    setTimeout(() => input.focus(), 10);
  }

  // ---------------- read saved key ----------------
  function readSavedKey() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveKey(k) { try { localStorage.setItem(STORAGE_KEY, k); } catch (e) {} }

  // ---------------- initBypass (your existing code kept) ----------------
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

  // ---------------- Orchestration: strict check ----------------
  (async function orchestration() {
    try {
      // 1) fetch server key
      const serverKey = await fetchText(KEY_URL).catch(err => {
        console.error('Lỗi tải key từ server:', err);
        return null;
      });
      if (!serverKey) {
        alert('Không thể tải key từ server. VIP Bypass KHÔNG được kích hoạt.');
        return; // strict: block if cannot fetch key
      }

      // 2) if savedKey exists and matches -> start
      const savedKey = readSavedKey();
      if (savedKey && savedKey === serverKey) {
        // ok -> start immediately
        console.log('Key cached hợp lệ — khởi chạy initBypass()');
        initBypass();
        // notify
        setTimeout(() => {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
              console.log('✅ VIP Bypass kích hoạt (cached key).');
            });
          } else { console.log('✅ VIP Bypass kích hoạt (cached key).'); }
        }, 10);
        return;
      }

      // 3) show modal to request user key and compare with serverKey
      showKeyModal(async (userKey) => {
        if (userKey === serverKey) {
          saveKey(userKey);
          try { initBypass(); } catch (e) { console.error(e); }
          alert('✅ Key đúng — VIP Bypass đã kích hoạt!');
          return true;
        }
        return false;
      });

    } catch (e) {
      console.error('Orchestration error', e);
      alert('Lỗi nội bộ. VIP Bypass KHÔNG được kích hoạt.');
    }
  })();

})();
