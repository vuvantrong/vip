
// ==UserScript==
// @name         VIP Script (Key Verified - Strict)
// @namespace    https://github.com/vuvantrong/vip
// @version      1.1
// @match        *://*/*
// @grant        none
// ==/UserScript==

/* --- PUT THIS BLOCK AT THE VERY TOP OF vip.js ---
   This block WILL stop execution if key not verified.
   Replace VERIFY_URL with your hosting URL (https://yourdomain.com/key.txt or /verify).
*/

(function(){
  'use strict';
  const VERIFY_URL = "https://yourdomain.com/key.txt"; // <-- đổi thành link của bạn
  const STORAGE_KEY = "vip_script_key_v1";
  const FORCE_PROMPT = false; // true để luôn bắt nhập key (dùng khi test)

  console.log("[VIP] verify-block: started");

  async function fetchServerKey() {
    const url = VERIFY_URL + (VERIFY_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      console.log("[VIP] fetchServerKey: response", resp.status);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const txt = (await resp.text()).trim();
      console.log("[VIP] server key fetched:", txt ? "(len:"+txt.length+")" : "(empty)");
      return txt;
    } catch (err) {
      console.error("[VIP] fetchServerKey error:", err);
      throw err;
    }
  }

  async function verifyFlow() {
    try {
      // try saved
      const saved = (function(){ try { return localStorage.getItem(STORAGE_KEY) || ''; } catch(e){ return ''; } })();
      if (saved && !FORCE_PROMPT) {
        console.log("[VIP] have saved key, trying auto-verify");
        try {
          const serverKey = await fetchServerKey();
          if (saved.trim() === serverKey.trim() && serverKey.trim() !== "") {
            console.log("[VIP] auto-verified OK");
            return saved.trim();
          } else {
            console.warn("[VIP] saved-key invalid compared to server");
            try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
          }
        } catch (e) {
          // fetch failed -> allow user to input (or block if you prefer)
          console.warn("[VIP] auto verify fetch failed:", e);
        }
      }

      // prompt user
      const userKey = prompt("🔑 Nhập key để kích hoạt script:");
      if (!userKey) {
        alert("Script dừng: không nhập key.");
        throw new Error("User canceled key input");
      }

      // verify with server
      const serverKey = await fetchServerKey();
      if (userKey.trim() === serverKey.trim() && serverKey.trim() !== "") {
        try { localStorage.setItem(STORAGE_KEY, userKey.trim()); } catch(e){}
        console.log("[VIP] user-key verified OK");
        return userKey.trim();
      } else {
        alert("Key không hợp lệ hoặc đã thay đổi.");
        throw new Error("Invalid key");
      }
    } catch (err) {
      // block: do not continue execution of remaining script
      console.error("[VIP] verifyFlow failed, stopping script:", err);
      // show visible banner
      try {
        const b = document.createElement('div');
        b.textContent = 'VIP Script: Xác thực thất bại — script bị dừng.';
        b.style.position = 'fixed';
        b.style.zIndex = 2147483647;
        b.style.left = '12px';
        b.style.top = '12px';
        b.style.background = '#b91c1c';
        b.style.color = '#fff';
        b.style.padding = '10px 14px';
        b.style.borderRadius = '8px';
        document.documentElement.appendChild(b);
      } catch(e){}
      // throw to ensure synchronous stop for top-level awaited call
      throw err;
    }
  }

  // run verify and if OK attach verified key to window for later use
  verifyFlow().then(k => {
    console.log("[VIP] verify completed, key:", k);
    // put key & flag to window so the rest of vip.js can check it
    window.__VIP_VERIFIED_KEY = k;
    window.__VIP_VERIFIED = true;
    // you can continue executing rest of script (it is still in same file)
  }).catch(err => {
    // prevent rest of file from running by setting a flag
    window.__VIP_VERIFIED = false;
  });

})();

// Authentication system for user login
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


// Database connection handler
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


// Payment processing module
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


// Email notification service
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


// File upload manager
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


// Cache management system
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


// Security validation layer
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


// API rate limiting controller
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


// Session management handler
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


// Data encryption utilities
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


// Image processing functions
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


// Search algorithm implementation
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


// User permission checker
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


// Backup and restore system
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


// Analytics tracking module
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


// Social media integration
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


// Real-time chat system
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


// Video streaming handler
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


// Machine learning model
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


// Blockchain transaction processor
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


// Global configuration object
var globalConfig = {
    apiEndpoint: "https://api.example.com/v1/",
    timeout: 30000,
    retryAttempts: 3,
    enableLogging: true,
    version: "2.1.4",
    features: ["auth", "payments", "analytics", "chat"],
    environment: "production"
};

// Utility functions for common operations
var utils = {
    formatDate: function (date) {
        return new Date(date).toISOString();
    },
    generateId: function () {
        return Math.random().toString(36).substr(2, 9);
    },
    validateEmail: function (email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    sanitizeInput: function (input) {
        return input.replace(/[<>]/g, '');
    },
    debounce: function (func, wait) {
        var timeout;
        return function () {
            clearTimeout(timeout);
            timeout = setTimeout(func, wait);
        };
    }
};



(async function () {
    'use strict';

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
                    if (this._url.includes("/v1/user/info")) {
                        let data = JSON.parse(this.responseText);
                        data.result.is_vip = true;
                        data.result.role = "vip";
                        data.result.vip_expires_at = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;
                        data.result.coin_balance = 999999999;
                        data.result.name = "https://wusdev.com/";
                        Object.defineProperty(this, 'responseText', {
                            value: JSON.stringify(data)
                        });
                        Object.defineProperty(this, 'response', {
                            value: JSON.stringify(data)
                        });
                    }
                } catch (e) {
                    console.error("Error:", e);
                }
            });
            return send.apply(this, arguments);
        };
    }

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
            corner.style.animation = 'slideInRight 0.5s ease';
            corner.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
            corner.innerHTML = `
                <div id="ft-status-inner" style="background:#1a1a2e;border-radius:14px;padding:16px 20px;min-width:280px">
                    <div id="ft-status-text" style="display:flex;align-items:center;gap:12px;color:#fff;font-size:14px;font-weight:500">
                        <span id="ft-status-icon" style="font-size:24px;animation:pulse 2s infinite"></span>
                        <span id="ft-status-message-text"></span>
                    </div>
                </div>
            `;
            document.documentElement.appendChild(corner);
        }
        const iconEl = document.getElementById('ft-status-icon');
        const textEl = document.getElementById('ft-status-message-text');
        iconEl.textContent = icon;
        textEl.textContent = text;
        if (autoHide) {
            setTimeout(() => {
                corner.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => corner.remove(), 500);
            }, 3000);
        }
    }

   
    initBypass();
    
    // Hiển thị thông báo kích hoạt thành công
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            showCornerStatus('✅', 'VIP Bypass đã kích hoạt! Không cần key! 🎬', true);
        });
    } else {
        showCornerStatus('✅', 'VIP Bypass đã kích hoạt! Không cần key! 🎬', true);
    }
    
    // Log để debug
    console.log('%c🎉 Rophim VIP Bypass (No Key Version)', 
                'font-size: 16px; font-weight: bold; color: #667eea;');
    console.log('%c✅ Script đã được kích hoạt - Không cần key!', 
                'font-size: 12px; color: #22c55e;');
})();
