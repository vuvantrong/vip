(async function () {
    'use strict';

    // 🔐 Link chứa key (file txt trên hosting của bạn)
    const KEY_URL = "https://checkmoithu.site/key.txt";

    // Hiển thị khung nhập key
    function showKeyPrompt() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.75); display: flex; justify-content: center;
                align-items: center; z-index: 999999; font-family: Arial, sans-serif;
            `;
            overlay.innerHTML = `
                <div style="background: #1a1a2e; padding: 30px 40px; border-radius: 14px; text-align: center; color: white; box-shadow: 0 0 25px rgba(0,0,0,0.3);">
                    <h2 style="margin-bottom: 15px; color: #60a5fa;">🔑 Nhập key để kích hoạt</h2>
                    <input type="password" id="userKey" placeholder="Nhập key tại đây..." style="width: 100%; padding: 10px; border-radius: 6px; border: none; margin-bottom: 15px; text-align:center; font-size:16px;">
                    <br>
                    <button id="checkKeyBtn" style="background: linear-gradient(135deg,#667eea,#764ba2); border: none; padding: 10px 20px; color: white; border-radius: 8px; cursor: pointer; font-size: 15px;">Xác nhận</button>
                    <p id="statusMsg" style="margin-top: 10px; color: #f87171; font-size: 13px;"></p>
                </div>
            `;
            document.body.appendChild(overlay);

            const input = overlay.querySelector('#userKey');
            const btn = overlay.querySelector('#checkKeyBtn');
            const msg = overlay.querySelector('#statusMsg');

            btn.addEventListener('click', () => {
                const key = input.value.trim();
                if (!key) {
                    msg.textContent = "⚠️ Vui lòng nhập key.";
                    return;
                }
                resolve({ overlay, key, msg });
            });
        });
    }

    // Tải key hợp lệ từ hosting
    async function fetchValidKey() {
        try {
            const res = await fetch(KEY_URL + '?t=' + Date.now()); // tránh cache
            const text = await res.text();
            return text.trim();
        } catch (err) {
            alert("❌ Không tải được key từ server. Kiểm tra lại đường dẫn file key.txt!");
            throw err;
        }
    }

    // Hiển thị thông báo góc màn hình
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
            corner.innerHTML = `
                <div id="ft-status-inner" style="background:#1a1a2e;border-radius:14px;padding:16px 20px;min-width:280px">
                    <div id="ft-status-text" style="display:flex;align-items:center;gap:12px;color:#fff;font-size:14px;font-weight:500">
                        <span id="ft-status-icon" style="font-size:24px;"></span>
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
        if (autoHide) setTimeout(() => corner.remove(), 3000);
    }

    // 🔧 Code gốc của bạn (đặt vào đây)
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

    // Bắt đầu
    const { overlay, key, msg } = await showKeyPrompt();
    const validKey = await fetchValidKey();

    if (key === validKey) {
        overlay.remove();
        showCornerStatus('✅', 'Key hợp lệ! VIP Bypass đang kích hoạt...', true);
        initBypass();
    } else {
        msg.textContent = "❌ Key không hợp lệ!";
        setTimeout(() => overlay.remove(), 2000);
        throw new Error("Sai key, script dừng lại!");
    }
})();
