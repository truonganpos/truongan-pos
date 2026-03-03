// ==========================================
// MODULE CORE: BIẾN TOÀN CỤC & ĐỒNG BỘ DATA
// ==========================================

// 🚨 QUAN TRỌNG: DÁN LINK API TỪ GOOGLE APPS SCRIPT CỦA BẠN VÀO ĐÂY
const API = "https://script.google.com/macros/s/AKfycbyYGE5lb_Ag6pEa9YT8C31tbk4-lCMu0brWzhqbYo-F3gybmQnRn6Lw8KSFTKGji69Urg/exec";

// --- 1. CÁC BIẾN TOÀN CỤC ---
let ALL_PRODUCTS = safeParseArray('ALL_PRODUCTS');
let ALL_ORDERS = safeParseArray('ALL_ORDERS');
let ALL_CUSTOMERS = safeParseArray('ALL_CUSTOMERS');
let syncQueue = safeParseArray('syncQueue');
let SYNC_LOG = safeParseArray('SYNC_LOG');
let hiddenColsProducts = safeParseObj('hiddenColsProducts');
let hiddenColsOrders = safeParseObj('hiddenColsOrders');

let limitProd = 50; 
let limitOrd = 50; 
let limitCus = 50;
let viewMode = localStorage.getItem('viewMode') || 'table'; 
let ALL_CATEGORIES = []; 
let activeTags = []; 
let categoryCol = ''; 
let vipPhones = new Set(); 
let currentPage = "dashboard"; 
let editingProductId = null; 
let inlineEditCatId = null; 
let myChart = null; 
let currentOrderItems = []; 
let editingOrderId = null;
let lastSettingsHash = ""; // Quản lý thay đổi cấu hình

// --- 2. HÀM TIỆN ÍCH (HELPERS) ---
function safeParseArray(key) { 
    try { let raw = localStorage.getItem(key); if(raw && raw !== 'null' && raw !== 'undefined') { let parsed = JSON.parse(raw); if(Array.isArray(parsed)) return parsed; } } catch(e) {} 
    return []; 
}

function safeParseObj(key) { 
    try { let raw = localStorage.getItem(key); if(raw && raw !== 'null' && raw !== 'undefined') return JSON.parse(raw); } catch(e) {} 
    return {}; 
}

function getSafeArrayFromLocal(key) { 
    try { let r = localStorage.getItem(key); if(r && r !== 'undefined') return JSON.parse(r); } catch(e){} 
    return []; 
}

function cleanPhone(p) { return String(p || '').replace(/\D/g, ''); } 

function formatMoney(num) { 
    if (num === null || num === undefined) return "0 đ"; 
    let cleanStr = String(num).replace(/[^0-9\-]/g, ""); 
    return cleanStr === "" ? "0 đ" : Number(cleanStr).toLocaleString('vi-VN') + " đ"; 
}

function smartRound(val) { let v = Number(val); return isNaN(v) ? 0 : Math.round(v / 100) * 100; }

function getKeyByKeyword(obj, keyword) { 
    if(!obj) return null; 
    return Object.keys(obj).find(x => String(x).toLowerCase().trim().includes(keyword.toLowerCase())); 
}

function parseDateString(dateStr) {
    if(!dateStr) return new Date(0);
    let dStr = String(dateStr).trim();
    let parsed = Date.parse(dStr);
    if(!isNaN(parsed) && dStr.includes('-')) return new Date(parsed); 
    let match = dStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if(match) {
        let d = parseInt(match[1]), m = parseInt(match[2]) - 1, y = parseInt(match[3]);
        let timeMatch = dStr.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
        let h = 0, min = 0, sec = 0;
        if(timeMatch) { h = parseInt(timeMatch[1]); min = parseInt(timeMatch[2]); sec = timeMatch[3]?parseInt(timeMatch[3]):0; }
        return new Date(y, m, d, h, min, sec);
    }
    return new Date(dStr); 
}

function generateCustomerId() {
    if (ALL_CUSTOMERS.length === 0) return 'KH0001';
    let maxId = 0;
    ALL_CUSTOMERS.forEach(c => {
        let idStr = c['Mã khách hàng'];
        if(idStr && String(idStr).startsWith('KH')) {
            let num = parseInt(idStr.replace('KH', ''), 10);
            if(!isNaN(num) && num > maxId) maxId = num;
        }
    });
    return 'KH' + String(maxId + 1).padStart(4, '0');
}

// --- 3. LOGIC UI CHUNG (SỰ KIỆN CLICK / PHÍM) ---
document.addEventListener('keydown', function(e) {
    if(e.key === "Escape") {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
        if(typeof closeSuggest === 'function') { closeSuggest('cusSuggestAdd'); closeSuggest('cusSuggestEdit'); }
    }
});

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) event.target.style.display = 'none';
    let inlineMenu = document.getElementById('inlineCatMenu');
    if (inlineMenu && inlineMenu.style.display === 'block') {
        if (!inlineMenu.contains(event.target) && !event.target.classList.contains('cat-cell-inline')) {
            inlineMenu.style.display = 'none'; 
            if(typeof closeInlineCatMenu === 'function') closeInlineCatMenu();
        }
    }
    let isSuggestClick = event.target.closest('.suggest-box');
    let isInputClick = event.target.id === 'cPhone' || event.target.id === 'cName' || event.target.id === 'eoPhone' || event.target.id === 'eoName';
    if (!isSuggestClick && !isInputClick) {
        document.querySelectorAll('.suggest-box').forEach(b => b.style.display = 'none');
    }
    if(!event.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(d => {
            if(d.id !== 'inlineCatMenu') d.classList.remove('show');
        });
    }
});

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    let isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    let t = document.getElementById('themeBtn'); if(t) t.innerText = isDark ? '☀️' : '🌙';
}

function toggleDropdown(e, id) { 
    e.stopPropagation(); 
    document.querySelectorAll('.dropdown-content').forEach(d => { if(d.id !== id) d.classList.remove('show'); });
    let el = document.getElementById(id); if(el) el.classList.toggle('show'); 
}

function openImageModal(src) { 
    if(!src) return; 
    let img = document.getElementById('previewImgSrc'); if(img) img.src = src; 
    let mod = document.getElementById('imageModal'); if(mod) mod.style.display = 'flex'; 
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// --- 4. TÍNH NĂNG CÀI ĐẶT (SETTINGS & CARRIERS) ---
function openSettingsModal() {
    let s = safeParseObj('truongan_settings');
    let sn = document.getElementById('setStoreName'); if(sn) sn.value = s.storeName || 'TRƯỜNG AN STORE';
    let sp = document.getElementById('setStorePhone'); if(sp) sp.value = s.storePhone || '';
    let sa = document.getElementById('setStoreAddress'); if(sa) sa.value = s.storeAddress || '';
    let sb = document.getElementById('setBankId'); if(sb) sb.value = s.bankId || '';
    let sno = document.getElementById('setAccNo'); if(sno) sno.value = s.accNo || '';
    let sna = document.getElementById('setAccName'); if(sna) sna.value = s.accName || '';
    let sbn = document.getElementById('setBillNote'); if(sbn) sbn.value = s.billNote || 'Cảm ơn quý khách!\nHẹn gặp lại.';
    let modal = document.getElementById('settingsModal'); if(modal) modal.style.display = 'flex';
}

function saveSettingsInfo() {
    let s = {
        storeName: document.getElementById('setStoreName').value.trim(),
        storePhone: document.getElementById('setStorePhone').value.trim(),
        storeAddress: document.getElementById('setStoreAddress').value.trim(),
        bankId: document.getElementById('setBankId').value.trim().toUpperCase(),
        accNo: document.getElementById('setAccNo').value.trim(),
        accName: document.getElementById('setAccName').value.trim().toUpperCase(),
        billNote: document.getElementById('setBillNote').value.trim()
    };
    localStorage.setItem('truongan_settings', JSON.stringify(s));
    closeModal('settingsModal'); 
    alert('✅ Đã lưu Cài đặt Hóa đơn & Ngân hàng!');
}

function buildSettingsMenu() {
    try {
        if(ALL_PRODUCTS && ALL_PRODUCTS.length > 0) { 
            let exclude = ['link ảnh', 'chi tiết json', '% khuyến mãi', 'giá khuyến mãi', '% km', 'giá km']; 
            let keysP = Object.keys(ALL_PRODUCTS[0] || {}).filter(k => !exclude.some(ex => String(k).toLowerCase().includes(ex))); 
            let htmlP = '<div style="padding:10px; font-weight:bold; border-bottom:1px solid #eee;">Cột hiển thị:</div><div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; padding:10px;">'; 
            htmlP += keysP.map(k => `<label style="margin:0; font-size:13px;"><input type="checkbox" onchange="toggleCol('products', '${String(k).replace(/'/g, "\\'")}')" ${!hiddenColsProducts[k]?'checked':''}/> <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k}</span></label>`).join(''); 
            htmlP += '</div>';
            let elP = document.getElementById('colMenuProducts'); if(elP) elP.innerHTML = htmlP; 
        }
        if(ALL_ORDERS && ALL_ORDERS.length > 0) { 
            let exclude = ['chi tiết json']; 
            let keysO = Object.keys(ALL_ORDERS[0] || {}).filter(k => !exclude.some(ex => String(k).toLowerCase().includes(ex))); 
            let htmlO = '<div style="padding:10px; font-weight:bold; border-bottom:1px solid #eee;">Cột hiển thị:</div><div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; padding:10px;">'; 
            htmlO += keysO.map(k => `<label style="margin:0; font-size:13px;"><input type="checkbox" onchange="toggleCol('orders', '${String(k).replace(/'/g, "\\'")}')" ${!hiddenColsOrders[k]?'checked':''}/> <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k}</span></label>`).join(''); 
            htmlO += '</div>';
            let elO = document.getElementById('colMenuOrders'); if(elO) elO.innerHTML = htmlO; 
        }
    } catch(e) { console.error(e); }
}

function toggleCol(type, key) { 
    if(type === 'products') { hiddenColsProducts[key] = !hiddenColsProducts[key]; localStorage.setItem('hiddenColsProducts', JSON.stringify(hiddenColsProducts)); renderProductsData(); } 
    else { hiddenColsOrders[key] = !hiddenColsOrders[key]; localStorage.setItem('hiddenColsOrders', JSON.stringify(hiddenColsOrders)); renderOrdersData(); } 
}

function loadCustomCarriers() {
    let customCarriers = []; 
    try { let raw = localStorage.getItem('truongan_custom_carriers'); if(raw) customCarriers = JSON.parse(raw); } catch(e){}
    
    let selects = [document.getElementById('cShippingCarrier'), document.getElementById('eoShippingCarrier')];
    selects.forEach(sel => {
        if(!sel) return;
        Array.from(sel.options).forEach(opt => { if(opt.className === 'custom-carr') opt.remove(); });
        customCarriers.forEach(c => { 
            let opt = document.createElement('option'); 
            opt.value = c; opt.text = c; opt.className = 'custom-carr'; 
            sel.appendChild(opt); 
        });
    });
}

function addNewCarrier(isEdit = false) {
    let newCarr = prompt("Thêm Nhà xe / Đơn vị vận chuyển mới:\n(Ví dụ: Xe Hải Vân, Xe Phương Trang...)");
    if(!newCarr || !newCarr.trim()) return;
    newCarr = newCarr.trim();
    
    let customCarriers = []; 
    try { let raw = localStorage.getItem('truongan_custom_carriers'); if(raw) customCarriers = JSON.parse(raw); } catch(e){}
    
    if(!customCarriers.includes(newCarr)) {
        customCarriers.push(newCarr); 
        localStorage.setItem('truongan_custom_carriers', JSON.stringify(customCarriers));
        loadCustomCarriers();
        
        let selId = isEdit ? 'eoShippingCarrier' : 'cShippingCarrier'; 
        let sel = document.getElementById(selId); 
        if(sel) sel.value = newCarr;
        if(!isEdit && typeof saveDraftLocal === 'function') saveDraftLocal();
    } else { 
        alert("Nhà xe này đã tồn tại trong danh sách!"); 
    }
}

// --- 5. ĐIỀU HƯỚNG (NAVIGATION) ---
function showPage(page) {
    try {
        currentPage = page;
        document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
        let viewEl = document.getElementById('view-' + page); if(viewEl) viewEl.style.display = 'block';
        
        document.querySelectorAll('.nav div').forEach(el => el.classList.remove('active'));
        let navEl = document.getElementById('nav-' + page); if(navEl) navEl.classList.add('active');
        
        let s1 = document.getElementById('searchProducts'); if(s1) s1.value = '';
        let s2 = document.getElementById('searchOrders'); if(s2) s2.value = '';
        let s3 = document.getElementById('searchCustomers'); if(s3) s3.value = '';
        document.querySelectorAll('.chk-box').forEach(c => c.checked = false); 
        if(typeof checkBulk === 'function') checkBulk();

        if(page === 'dashboard' && typeof renderAdvancedDashboard === 'function') renderAdvancedDashboard();
        if(page === 'products' && typeof renderProductsData === 'function') renderProductsData(true);
        if(page === 'orders' && typeof renderOrdersData === 'function') renderOrdersData(true);
        if(page === 'customers' && typeof renderCustomersData === 'function') renderCustomersData(true);
        if(page === 'add' && typeof renderAddFormUI === 'function') { restoreDraftLocal(); renderAddFormUI(); } 
    } catch(e) { console.error("Lỗi showPage:", e); }
}

function setViewMode(mode) {
    viewMode = mode; localStorage.setItem('viewMode', mode);
    document.querySelectorAll('.vbtn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll(`.vbtn[onclick="setViewMode('${mode}')"]`).forEach(b=>b.classList.add('active'));
    showPage(currentPage);
}

function loadMore(type) {
    if(type === 'prod') { limitProd += 50; if(typeof renderProductsData === 'function') renderProductsData(false); }
    if(type === 'ord') { limitOrd += 50; if(typeof renderOrdersData === 'function') renderOrdersData(false); }
    if(type === 'cus') { limitCus += 50; if(typeof renderCustomersData === 'function') renderCustomersData(false); }
}

// --- 6. HÀM QUẢN TRỊ HỆ THỐNG CƠ BẢN ---
function hardResetCache() {
    if(confirm("Hành động này sẽ XÓA BỘ NHỚ TẠM để tải lại dữ liệu mới nhất từ Sheet.\n\nDùng nút này khi:\n1. Bảng sản phẩm bị trắng.\n2. Cột hiển thị bị lỗi.\n3. Dữ liệu trên Sheet và Web không khớp nhau.\n\nXác nhận xóa và tải lại?")) {
        localStorage.clear();
        location.reload(true);
    }
}

function handleLogout() {
    if(confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
        localStorage.removeItem('isLoggedIn'); 
    }
}

// --- 7. LOGIC ĐỒNG BỘ DATA (SYNC ENGINE) ---
function addSyncLog(msg) {
    SYNC_LOG.unshift({ time: new Date().toLocaleString('vi-VN'), msg: msg });
    if(SYNC_LOG.length > 20) SYNC_LOG.pop();
    localStorage.setItem('SYNC_LOG', JSON.stringify(SYNC_LOG));
}

function openSyncLog() {
    let html = SYNC_LOG.map(l => `<div style="padding:10px 0; border-bottom:1px dashed #444; font-size:13px;"><span style="opacity:0.6;font-size:11px;">[${l.time}]</span> <br/><b style="color:#3b82f6;">${l.msg}</b></div>`).join('');
    let b = document.getElementById('syncLogBody');
    if(b) b.innerHTML = html || '<div style="opacity:0.6;font-size:13px;">Chưa có lịch sử đồng bộ.</div>';
    document.getElementById('syncLogModal').style.display = 'flex';
}

function addQueueItem(action, data) {
   let existingIdx = syncQueue.findIndex(q => {
       if (q.action !== action) return false;
       if (action === 'updateProduct' || action === 'deleteProduct') return q.data['Mã SP'] === data['Mã SP'];
       if (action === 'addOrder' || action === 'updateOrder') return q.data['Mã Đơn'] === data['Mã Đơn'];
       if (action === 'deleteOrder') return q.data.id === data.id;
       if (action === 'updateCustomer') return cleanPhone(q.data['Điện thoại']) === cleanPhone(data['Điện thoại']);
       if (action === 'deleteCustomer') return cleanPhone(q.data.phone) === cleanPhone(data.phone);
       return false;
   });
   
   if(existingIdx > -1) { syncQueue[existingIdx].data = data; } 
   else { syncQueue.push({ id: Date.now() + Math.random(), action, data }); }
   
   localStorage.setItem('syncQueue', JSON.stringify(syncQueue)); updateSyncBadge();
   
   if (currentPage === 'orders' && typeof renderOrdersData === 'function') renderOrdersData();
   if (currentPage === 'products' && typeof renderProductsData === 'function') { if(typeof initCategories === 'function') initCategories(); renderProductsData(); if(typeof renderAddFormUI === 'function') renderAddFormUI(); }
   if (currentPage === 'customers' && typeof renderCustomersData === 'function') renderCustomersData();
   if (currentPage === 'dashboard' && typeof renderAdvancedDashboard === 'function') renderAdvancedDashboard();
}

function updateSyncBadge() {
   let b = document.getElementById('syncBtnUI');
   if(!b) return;
   if(syncQueue.length > 0) { b.innerHTML = '🔄 Đang chờ...'; b.style.color = '#f59e0b'; } 
   else { b.innerHTML = '⬆️ Đẩy Lên'; b.style.color = '#fff'; }
}

async function pushSyncQueue(isSilent = false) {
   if(syncQueue.length === 0) return true;
   let b = document.getElementById('syncBtnUI'); if(b) b.innerHTML = '🔄 Đang đẩy...';
   try {
      let res = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "syncBatch", queue: syncQueue }) });
      let result = await res.json();
      if(result.success) {
         addSyncLog(`Đã đẩy thành công ${syncQueue.length} thao tác lên Google Sheet.`);
         syncQueue = []; localStorage.setItem('syncQueue', '[]'); updateSyncBadge(); 
         return true;
      } else {
         if(!isSilent) alert("❌ Lỗi từ Google Sheet: " + result.error);
         updateSyncBadge(); return false;
      }
   } catch(e) { updateSyncBadge(); return false; }
}

function checkAndSyncSettings() {
    let conf = { settings: safeParseObj('truongan_settings'), carriers: getSafeArrayFromLocal('truongan_custom_carriers'), hideProd: safeParseObj('hiddenColsProducts'), hideOrd: safeParseObj('hiddenColsOrders'), colWidths: safeParseObj('truongan_col_widths') };
    let currentHash = JSON.stringify(conf);
    if(lastSettingsHash !== "" && currentHash !== lastSettingsHash) {
        addQueueItem('updateSettings', { "ID": "SETTING_1", "Cấu Hình JSON": currentHash });
        lastSettingsHash = currentHash;
    } else if (lastSettingsHash === "") {
        lastSettingsHash = currentHash; 
    }
}

async function syncData(force = false, isSilent = false) {
    let ui = document.getElementById("loadingUI");
    try {
        if(force && !isSilent) { if(ui) ui.style.display = "flex"; } 
        if(syncQueue.length > 0) { await pushSyncQueue(isSilent); }

        if(force || ALL_PRODUCTS.length === 0 || isSilent) {
            let resDash = await fetch(API+"?type=dashboard"); if(!resDash.ok) throw new Error("API Fails");
            let resProds = await fetch(API+"?type=products"); if(!resProds.ok) throw new Error("API Fails");
            let resOrds = await fetch(API+"?type=orders"); if(!resOrds.ok) throw new Error("API Fails");
            let resCus = await fetch(API+"?type=customers"); if(!resCus.ok) throw new Error("API Fails");
            let resSet = await fetch(API+"?type=settings"); 
            if(resSet.ok) {
                let setObj = await resSet.json();
                if(setObj && setObj['Cấu Hình JSON']) {
                    try {
                        let conf = JSON.parse(setObj['Cấu Hình JSON']);
                        localStorage.setItem('truongan_settings', JSON.stringify(conf.settings || {}));
                        localStorage.setItem('truongan_custom_carriers', JSON.stringify(conf.carriers || []));
                        hiddenColsProducts = conf.hideProd || {}; hiddenColsOrders = conf.hideOrd || {};
                        localStorage.setItem('hiddenColsProducts', JSON.stringify(hiddenColsProducts));
                        localStorage.setItem('hiddenColsOrders', JSON.stringify(hiddenColsOrders));
                        localStorage.setItem('truongan_col_widths', JSON.stringify(conf.colWidths || {}));
                        lastSettingsHash = setObj['Cấu Hình JSON'];
                        if(typeof loadCustomCarriers === 'function') loadCustomCarriers();
                    } catch(e){}
                }
            }

            let prods = await resProds.json(); let ords = await resOrds.json(); let cus = await resCus.json();
            if(Array.isArray(prods) && prods.length > 0) ALL_PRODUCTS = prods; 
            if(Array.isArray(ords)) ALL_ORDERS = ords; 
            if(Array.isArray(cus)) ALL_CUSTOMERS = cus; 
            localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS)); 
            localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS)); 
            localStorage.setItem('ALL_CUSTOMERS', JSON.stringify(ALL_CUSTOMERS));
        }

        updateSyncBadge(); 
        if(ALL_PRODUCTS.length > 0) { 
            if(typeof buildSettingsMenu === 'function') buildSettingsMenu(); 
            if(typeof initCategories === 'function') initCategories(); 
            if(typeof renderAddFormUI === 'function') renderAddFormUI(); 
        }
        
        if(!isSilent) {
            let viewEl = document.getElementById('view-' + currentPage);
            if(viewEl && force) { showPage(currentPage); } 
        } else {
            if (currentPage === 'orders' && typeof renderOrdersData === 'function') renderOrdersData();
            if (currentPage === 'products' && typeof renderProductsData === 'function') renderProductsData();
            if (currentPage === 'customers' && typeof renderCustomersData === 'function') renderCustomersData();
            if (currentPage === 'dashboard' && typeof renderAdvancedDashboard === 'function') renderAdvancedDashboard();
        }
    } catch(e) { console.error("Lỗi mạng:", e); if(!isSilent) alert("⚠️ Lỗi tải dữ liệu. Hãy tải lại trang."); } 
    finally { if(ui && !isSilent) ui.style.display = "none"; }
}

// --- 8. KHỞI TẠO (INITIALIZATION) ---
document.addEventListener('DOMContentLoaded', () => { 
    if(localStorage.getItem('theme') === 'dark') toggleTheme();
    
    // Ép hệ thống mở thẳng Tab Tổng quan ngay khi vừa load xong HTML
    showPage('dashboard'); 
    
    setTimeout(() => {
        if(typeof syncData === 'function') syncData(ALL_PRODUCTS.length === 0);
        setInterval(checkAndSyncSettings, 3000);
        setInterval(() => { syncData(true, true); }, 3 * 60 * 1000);
    }, 1500); 
});
