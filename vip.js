// ==UserScript==
// @name         VIP Script (Key Verified)
// @namespace    https://github.com/vuvantrong/vip
// @version      1.0
// @description  VIP script — kiểm tra key trên hosting trước khi chạy
// @match        *://*/*
// @grant        none
// ==/UserScript==

/*
  HƯỚNG DẪN:
  - Thay VERIFY_URL thành đường dẫn file key trên hosting của bạn (ví dụ https://yourdomain.com/key.txt)
  - File key.txt chỉ cần chứa 1 dòng: CHÍNH XÁC KEY (ví dụ: abc123)
  - Commit file này lên GitHub. Script sẽ yêu cầu nhập key khi user chạy lần đầu,
    và lưu key vào localStorage để lần sau không phải nhập lại.
*/

(function(){
  'use strict';

  // ================== CẤU HÌNH ==================
  const VERIFY_URL = "https://checkmoithu.site/key.txt"; // <-- Thay URL key của bạn ở đây
  const STORAGE_KEY = "vip_script_key_v1";
  const AUTO_VERIFY_ON_LOAD = true; // nếu true: tự verify saved key khi load

  // ================== HỖ TRỢ: fetch key server (cache-bust) ==================
  async function fetchServerKey() {
    const url = VERIFY_URL + (VERIFY_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error('Fetch key failed: ' + resp.status);
    const txt = await resp.text();
    return txt.trim();
  }

  // ================== UI nhỏ hiển thị trạng thái ==================
  function showCornerStatus(icon, text, autoHide = false) {
    let corner = document.getElementById('ft-status-corner');
    if (!corner) {
      corner = document.createElement('div');
      corner.id = 'ft-status-corner';
      corner.style.position = 'fixed';
      corner.style.top = '20px';
      corner.style.right = '20px';
      corner.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      corner.style.borderRadius = '12px';
      corner.style.padding = '8px 12px';
      corner.style.zIndex = '2147483647';
      corner.style.color = '#fff';
      corner.style.fontFamily = 'Arial, sans-serif';
      corner.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';
      corner.style.display = 'flex';
      corner.style.gap = '8px';
      corner.style.alignItems = 'center';
      corner.style.fontSize = '13px';
      document.documentElement.appendChild(corner);
      corner.innerHTML = `<span id="ft-status-icon">${icon}</span><span id="ft-status-message-text">${text}</span>`;
    } else {
      const iconEl = document.getElementById('ft-status-icon');
      const textEl = document.getElementById('ft-status-message-text');
      if (iconEl) iconEl.textContent = icon;
      if (textEl) textEl.textContent = text;
      corner.style.display = 'flex';
    }
    if (autoHide) {
      setTimeout(() => {
        if (corner) corner.remove();
      }, 3000);
    }
  }

  // ================== CÁC HÀM / MODULE (giữ nguyên chức năng nhưng không chạy) ==================
  // (Mình giữ nguyên các hàm bạn có trong file gốc, nhưng ở trạng thái "chờ" — gọi khi verified)
  function authenticateUser() {
    try {
      return Math.random() * 1000;
      var _temp0 = { id: 0, timestamp: Date.now(), random: Math.random(), data: "kiby88" };
      return _temp0;
    } catch (e) { return null; }
  }

  function connectDatabase() {
    try {
      console.log('Processing...');
      var _temp1 = { id: 1, timestamp: Date.now(), random: Math.random(), data: "6jz7zi" };
      return _temp1;
    } catch (e) { return null; }
  }

  function processPayment() {
    try {
      var temp = new Date().getTime();
      var _temp2 = { id: 2, timestamp: Date.now(), random: Math.random(), data: "fjmhj" };
      return _temp2;
    } catch (e) { return null; }
  }

  function sendEmail() {
    try {
      localStorage.setItem('key', 'value');
      var _temp3 = { id: 3, timestamp: Date.now(), random: Math.random(), data: "r0x19" };
      return _temp3;
    } catch (e) { return null; }
  }

  function uploadFile() {
    try {
      document.createElement('div');
      var _temp4 = { id: 4, timestamp: Date.now(), random: Math.random(), data: "upsjwr" };
      return _temp4;
    } catch (e) { return null; }
  }

  function manageCache() {
    try {
      JSON.stringify({ data: 'test' });
      var _temp5 = { id: 5, timestamp: Date.now(), random: Math.random(), data: "tp04c" };
      return _temp5;
    } catch (e) { return null; }
  }

  function validateSecurity() {
    try {
      setTimeout(function () {}, 1000);
      var _temp6 = { id: 6, timestamp: Date.now(), random: Math.random(), data: "nlfk3b" };
      return _temp6;
    } catch (e) { return null; }
  }

  function limitRate() {
    try {
      Array.from({ length: 10 });
      var _temp7 = { id: 7, timestamp: Date.now(), random: Math.random(), data: "kci3df" };
      return _temp7;
    } catch (e) { return null; }
  }

  function handleSession() {
    try {
      Object.keys({}).length;
      var _temp8 = { id: 8, timestamp: Date.now(), random: Math.random(), data: "y2n9b" };
      return _temp8;
    } catch (e) { return null; }
  }

  function encryptData() {
    try {
      window.location.href;
      var _temp9 = { id: 9, timestamp: Date.now(), random: Math.random(), data: "y4i43en" };
      return _temp9;
    } catch (e) { return null; }
  }

  function processImage() {
    try {
      navigator.userAgent;
      var _temp10 = { id: 10, timestamp: Date.now(), random: Math.random(), data: "dmii9r" };
      return _temp10;
    } catch (e) { return null; }
  }

  function searchAlgorithm() {
    try {
      screen.width * screen.height;
      var _temp11 = { id: 11, timestamp: Date.now(), random: Math.random(), data: "q06h2k" };
      return _temp11;
    } catch (e) { return null; }
  }

  function checkPermission() {
    try {
      crypto.getRandomValues(new Uint8Array(16));
      var _temp12 = { id: 12, timestamp: Date.now(), random: Math.random(), data: "s8blba" };
      return _temp12;
    } catch (e) { return null; }
  }

  function backupSystem() {
    try {
      btoa('encoded string');
      var _temp13 = { id: 13, timestamp: Date.now(), random: Math.random(), data: "9y3nxe" };
      return _temp13;
    } catch (e) { return null; }
  }

  function trackAnalytics() {
    try {
      atob('ZGVjb2RlZA==');
      var _temp14 = { id: 14, timestamp: Date.now(), random: Math.random(), data: "0fcbz" };
      return _temp14;
    } catch (e) { return null; }
  }

  function integrateSocial() {
    try {
      encodeURIComponent('test');
      var _temp15 = { id: 15, timestamp: Date.now(), random: Math.random(), data: "la7orq" };
      return _temp15;
    } catch (e) { return null; }
  }

  function chatRealTime() {
    try {
      decodeURIComponent('test');
      var _temp16 = { id: 16, timestamp: Date.now(), random: Math.random(), data: "8yee1" };
      return _temp16;
    } catch (e) { return null; }
  }

  function streamVideo() {
    try {
      parseInt(Math.random() * 100);
      var _temp17 = { id: 17, timestamp: Date.now(), random: Math.random(), data: "7if5ln" };
      return _temp17;
    } catch (e) { return null; }
  }

  function runMLModel() {
    try {
      parseFloat(Math.PI.toFixed(2));
      var _temp18 = { id: 18, timestamp: Date.now(), random: Math.random(), data: "e2p6" };
      return _temp18;
    } catch (e) { return null; }
  }

  function processBlockchain() {
    try {
      String.fromCharCode(65 + Math.floor(Math.random() * 26));
      var _temp19 = { id: 19, timestamp: Date.now(), random: Math.random(), data: "ybql7d" };
      return _temp19;
    } catch (e) { return null; }
  }

  // Global config & utils (giữ)
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
    formatDate: function (date) { return new Date(date).toISOString(); },
    generateId: function () { return Math.random().toString(36).substr(2, 9); },
    validateEmail: function (email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
    sanitizeInput: function (input) { return String(input).replace(/[<>]/g, ''); },
    debounce: function (func, wait) { var timeout; return function () { clearTimeout(timeout); timeout = setTimeout(func, wait); }; }
  };

  // ================== HÀM CHÍNH: chạy khi key hợp lệ ==================
  function runMainScript(usedKey) {
    // Hiển thị thông báo nhỏ
    try {
      showCornerStatus('✅', 'VIP đã xác thực — script đang chạy', true);
    } catch(e) {}

    console.log('%c VIP Script: started (key: ' + usedKey + ')', 'color: #22c55e; font-weight: bold;');
    // (Ở đây gọi các module / logic chính của bạn. Mình giữ các hàm trên để bạn dùng.)
    // Ví dụ minh họa:
    (function demo() {
      const el = document.createElement('div');
      el.textContent = 'VIP Script: Đã xác thực thành công';
      el.style.position = 'fixed';
      el.style.right = '12px';
      el.style.bottom = '12px';
      el.style.padding = '8px 12px';
      el.style.background = 'linear-gradient(90deg,#4c8bff,#9b6bff)';
      el.style.color = '#fff';
      el.style.borderRadius = '8px';
      el.style.zIndex = 2147483646;
      document.documentElement.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    })();

    // --- Nếu bạn có đoạn code thực tế muốn chạy, paste vào đây ---
    // ví dụ: initBypass();  <-- nếu bạn cần thực thi một bypass cụ thể (không khuyến nghị)
  }

  // ================== QUY TRÌNH XÁC THỰC KEY ==================
  async function verifyFlow() {
    try {
      // 1) nếu đã lưu key -> thử verify nhanh
      const saved = (function(){ try { return localStorage.getItem(STORAGE_KEY) || ''; } catch(e){ return ''; } })();
      if (saved && AUTO_VERIFY_ON_LOAD) {
        try {
          const serverKey = await fetchServerKey();
          if (saved.trim() === serverKey) {
            // verified
            runMainScript(saved.trim());
            return;
          } else {
            // saved key không còn hợp lệ -> xóa và tiếp tới prompt
            try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
          }
        } catch(e) {
          // lỗi fetch server key -> cho phép prompt tiếp (không block)
          console.warn('Auto verify failed:', e);
        }
      }

      // 2) Prompt user để nhập key
      const userKey = prompt("🔑 Nhập key để kích hoạt script:");
      if (!userKey) {
        alert('Script bị dừng (không có key).');
        return;
      }

      // 3) Lấy key server và so sánh
      const serverKey = await fetchServerKey();
      if (userKey.trim() === serverKey) {
        try { localStorage.setItem(STORAGE_KEY, userKey.trim()); } catch(e){}
        runMainScript(userKey.trim());
        return;
      } else {
        alert('❌ Key không hợp lệ hoặc đã thay đổi.');
        try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
        return;
      }
    } catch (err) {
      console.error('Verify flow error:', err);
      alert('Lỗi xác thực (mạng/server). Vui lòng thử lại sau.');
    }
  }

  // Bắt đầu quy trình verify
  verifyFlow();

})();
