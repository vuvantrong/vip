// ==UserScript==
// @name         VIP Bypass with Key Check
// @namespace    https://checkmoithu.site/
// @version      1.0
// @description  Check key from hosting before enabling VIP bypass
// @match        *://*/*
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';

    // 🧩 URL chứa key hợp lệ
    const KEY_URL = 'https://checkmoithu.site/key.txt';

    // 🧩 Hàm tải key từ hosting
    async function fetchValidKey() {
        try {
            const res = await fetch(KEY_URL + '?v=' + Date.now());
            if (!res.ok) throw new Error('Không tải được key từ hosting!');
            return (await res.text()).trim();
        } catch (err) {
            alert('❌ Lỗi tải key: ' + err.message);
            return null;
        }
    }

    // 🧩 Hiển thị popup nhập key
    async function promptForKey(validKey) {
        const savedKey = localStorage.getItem('user_key');
        if (savedKey && savedKey === validKey) {
            console.log('✅ Key hợp lệ (đã lưu)!');
            return true;
        }

        const userKey = prompt('🔑 Nhập key VIP để kích hoạt:', savedKey || '');
        if (userKey === validKey) {
            alert('✅ Key chính xác! VIP Bypass đang được kích hoạt...');
            localStorage.setItem('user_key', userKey);
            return true;
        } else {
            alert('❌ Key sai hoặc hết hạn!');
            localStorage.removeItem('user_key');
            return false;
        }
    }

    // 🧩 Hàm bypass chính
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
                        data.result.name = "https://checkmoithu.site/";
                        Object.defineProperty(this, 'responseText', { value: JSON.stringify(data) });
                        Object.defineProperty(this, 'response', { value: JSON.stringify(data) });
                    }
                } catch (e) {
                    console.error("Error:", e);
                }
            });
            return send.apply(this, arguments);
        };

        console.log('%c✅ VIP Bypass activated!', 'color: #22c55e; font-weight: bold;');
    }

    // 🧩 Khởi chạy toàn bộ quy trình
    const validKey = await fetchValidKey();
    if (!validKey) return;

    const access = await promptForKey(validKey);
    if (access) {
        initBypass();
    } else {
        console.warn('🚫 Không có quyền truy cập VIP!');
    }
})();
