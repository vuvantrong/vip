// vip-key-after-login.js
// Chỉ hiển thị yêu cầu key sau khi phát hiện user đã đăng nhập
(function () {
  'use strict';

  // ========== CẤU HÌNH ==========
  const KEY_URL = 'https://checkmoithu.site/key.txt'; // <-- thay bằng file key của bạn
  const STORAGE_KEY = 'cmv_user_key_valid';
  const POLL_INTERVAL_MS = 1500; // kiểm tra login định kỳ
  const POLL_TIMEOUT_MS = 60 * 1000; // tối đa chờ login (60s), sau đó ngưng
  const FETCH_TIMEOUT_MS = 10000;
  const USE_GM_XHR = (typeof GM_xmlhttpRequest === 'function');

  // ========== HỖ TRỢ: fetch text with GM fallback ==========
  function fetchText(url, timeout = FETCH_TIMEOUT_MS) {
    if (USE_GM_XHR) {
      return new Promise((resolve, reject) => {
        try {
          GM_xmlhttpRequest({
            method: 'GET',
            url: url + '?_cb=' + Date.now(),
            timeout,
            onload(resp) {
              if (resp.status >= 200 && resp.status < 300) resolve(String(resp.responseText || '').trim());
              else reject(new Error('HTTP ' + resp.status));
            },
            onerror(err) { reject(err || new Error('GM XHR error')); },
            ontimeout() { reject(new Error('timeout')); }
          });
        } catch (e) { reject(e); }
      });
    }
    // normal fetch (requires CORS on server)
    return new Promise((resolve, reject) => {
      let timer = setTimeout(() => reject(new Error('timeout')), timeout);
      fetch(url + '?_cb=' + Date.now(), { cache: 'no-store', credentials: 'include' })
        .then(r => {
          clearTimeout(timer);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        })
        .then(t => resolve(String(t).trim()))
        .catch(err => { clearTimeout(timer); reject(err); });
    });
  }

  // ========== HỖ TRỢ: lưu / đọc key ==========
  function readSavedKey() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveKey(k) {
    try { localStorage.setItem(STORAGE_KEY, k); } catch (e) {}
  }
  function clearSavedKey() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // ========== HỖ TRỢ: phát hiện login ==========
  // Thử nhiều chiến lược; trả về Promise resolves true nếu phát hiện logged-in.
  function isLoggedInImmediate() {
    try {
      // 1) common global user objects
      const candidates = ['user', 'currentUser', 'USER', 'windowUser', 'AppUser', 'me'];
      for (const name of candidates) {
        if (window[name] && (typeof window[name] === 'object')) return true;
      }
      // 2) common DOM markers (site-specific, add more if cần)
      if (document.querySelector('.user-avatar, .account-name, .profile-menu, .logged-in')) return true;
      // 3) check cookies for common auth key names
      const ck = (document.cookie || '');
      if (ck.includes('token=') || ck.includes('jwt=') || ck.includes('sid=') || ck.includes('session=')) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  // Polling method + XHR hook fallback
  function waitForLogin(timeoutMs, intervalMs) {
    return new Promise((resolve) => {
      if (isLoggedInImmediate()) return resolve(true);

      let elapsed = 0;
      const t = setInterval(() => {
        elapsed += intervalMs;
        if (isLoggedInImmediate()) {
          clearInterval(t); resolve(true); return;
        }
        if (elapsed >= timeoutMs) {
          clearInterval(t); resolve(false); return;
        }
      }, intervalMs);

      // additionally, hook XHR responses to detect /v1/user/info (if page uses it)
      try {
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (method, url) {
          this._cmv_url = url;
          return origOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function () {
          this.addEventListener('load', function () {
            try {
              if (this._cmv_url && String(this._cmv_url).includes('/v1/user/info')) {
                // if response contains user info, consider logged-in
                try {
                  const txt = this.responseText || '';
                  if (txt && txt.indexOf('{') !== -1) {
                    const j = JSON.parse(txt);
                    if (j && (j.result || j.user || j.data)) {
                      // found user info
                      clearInterval(t);
                      // restore prototypes
                      XMLHttpRequest.prototype.open = origOpen;
                      XMLHttpRequest.prototype.send = origSend;
                      resolve(true);
                    }
                  }
                } catch (e) { /* ignore parse errors */ }
              }
            } catch (e) {}
          });
          return origSend.apply(this, arguments);
        };
      } catch (e) { /* if cannot monkeypatch, ignore */ }
    });
  }

  // ========== UI: single modal prompt ==========
  function showSingleKeyModal(promptText = 'Nhập key để kích hoạt VIP') {
    return new Promise((resolve) => {
      // ensure single instance
      if (window.__cmv_key_flow_active) return resolve(null);
      window.__cmv_key_flow_active = true;

      const ID = 'cmv-key-modal-single';
      if (document.getElementById(ID)) return resolve(null);

      const style = document.createElement('style');
      style.id = ID + '-style';
      style.textContent = `
        #${ID} { position: fixed; inset:0; display:flex; align-items:center; justify-content:center;
          background: rgba(0,0,0,0.6); z-index:2147483647; font-family: Inter, Arial, sans-serif; }
        #${ID} .card { width:360px; background:#ffffff; border-radius:10px; padding:18px; box-shadow:0 12px 40px rgba(0,0,0,0.35); }
        #${ID} input { width:100%; padding:10px; margin-top:10px; box-sizing:border-box; border-radius:6px; border:1px solid #ddd; }
        #${ID} .row { display:flex; gap:8px; margin-top:12px; }
        #${ID} button { flex:1; padding:10px; border-radius:6px; border:0; cursor:pointer; font-weight:600; }
        #${ID} .err { color:#b00020; margin-top:8px; min-height:18px; }
      `;
      document.head.appendChild(style);

      const modal = document.createElement('div');
      modal.id = ID;
      modal.innerHTML = `
        <div class="card" role="dialog" aria-modal="true">
          <div style="font-weight:700;font-size:16px">${promptText}</div>
          <div style="font-size:13px;color:#444;margin-top:6px">Vui lòng nhập key để kích hoạt chức năng VIP.</div>
          <input id="${ID}-input" placeholder="Nhập key..." />
          <div class="err" id="${ID}-err"></div>
          <div class="row">
            <button id="${ID}-cancel" style="background:#eee">Hủy</button>
            <button id="${ID}-ok" style="background:#2563eb;color:#fff">Xác nhận</button>
          </div>
        </div>
      `;
      document.documentElement.appendChild(modal);

      const input = modal.querySelector(`#${ID}-input`);
      const ok = modal.querySelector(`#${ID}-ok`);
      const cancel = modal.querySelector(`#${ID}-cancel`);
      const err = modal.querySelector(`#${ID}-err`);

      function cleanup() {
        try { modal.remove(); } catch (e) {}
        try { style.remove(); } catch (e) {}
        window.__cmv_key_flow_active = false;
      }

      cancel.addEventListener('click', () => { cleanup(); resolve(null); });
      ok.addEventListener('click', () => {
        const v = (input.value || '').trim();
        if (!v) { err.textContent = 'Vui lòng nhập key.'; return; }
        cleanup();
        resolve(v);
      });
      input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ok.click(); });
      setTimeout(() => input.focus(), 10);
    });
  }

  // ========== initBypass (giữ nguyên) ==========
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

  // ========== Orchestration ==========
  (async function orchestrate() {
    try {
      // 1) Wait until logged-in (poll / XHR hook)
      const logged = await waitForLogin(POLL_TIMEOUT_MS, POLL_INTERVAL_MS);
      if (!logged) {
        // user not logged in within timeout -> do nothing
        console.warn('[CMV] User not detected as logged-in; aborting key prompt.');
        return;
      }

      // 2) If saved key matches server (or previously validated), run bypass immediately
      const saved = readSavedKey();
      if (saved) {
        // If you want to ALWAYS validate with serverKey, you can fetch and compare here.
        // For simplicity: accept saved as valid for session.
        initBypass();
        console.log('[CMV] Key cached — bypass enabled');
        return;
      }

      // 3) Fetch valid key from hosting
      let serverKey = null;
      try {
        serverKey = await fetchText(KEY_URL).catch(err => { throw err; });
      } catch (e) {
        console.error('[CMV] Không tải được key từ hosting:', e);
        alert('Không thể lấy key từ server — VIP sẽ không được kích hoạt.');
        return;
      }
      if (!serverKey) {
        alert('Key trên server rỗng — VIP không kích hoạt.');
        return;
      }

      // 4) Show single modal to ask user for key (only once)
      const entered = await showSingleKeyModal('Nhập key (chỉ hiện khi đã đăng nhập)');
      if (!entered) { console.warn('[CMV] User cancelled key prompt'); return; }

      if (entered.trim() === serverKey.trim()) {
        saveKey(entered.trim());
        initBypass();
        // notify small corner
        try {
          const el = document.createElement('div');
          el.style = 'position:fixed;right:12px;top:12px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:8px 12px;border-radius:10px;z-index:2147483647;';
          el.textContent = '✅ Key đúng — VIP kích hoạt';
          document.documentElement.appendChild(el);
          setTimeout(()=>el.remove(), 3000);
        } catch(e){}
        console.log('[CMV] Key đúng — bypass enabled');
      } else {
        alert('Key không hợp lệ — VIP không kích hoạt.');
        console.warn('[CMV] Key không hợp lệ');
      }

    } catch (e) {
      console.error('[CMV] orchestration error', e);
    }
  })();

  // helper: wrapper to use fetchText (defined above)
  function fetchText(url) { return fetchText; } // placeholder to satisfy lint — actual used fetchText is above

})();
