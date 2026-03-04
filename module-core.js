// ==========================================
// MODULE CORE: BIẾN TOÀN CỤC & ĐỒNG BỘ DATA
// ==========================================

const API = "https://script.google.com/macros/s/AKfycbyYGE5lb_Ag6pEa9YT8C31tbk4-lCMu0brWzhqbYo-F3gybmQnRn6Lw8KSFTKGji69Urg/exec";

let ALL_PRODUCTS = safeParseArray('ALL_PRODUCTS'); 
let ALL_ORDERS = safeParseArray('ALL_ORDERS'); 
let ALL_CUSTOMERS = safeParseArray('ALL_CUSTOMERS');
let syncQueue = safeParseArray('syncQueue'); 
let SYNC_LOG = safeParseArray('SYNC_LOG');
let hiddenColsProducts = safeParseObj('hiddenColsProducts'); 
let hiddenColsOrders = safeParseObj('hiddenColsOrders');

// BỘ TỪ ĐIỂN ĐỔI TÊN CỘT
let colAliases = safeParseObj('truongan_col_aliases'); 

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
let lastSettingsHash = ""; 

function safeParseArray(key) { try { let raw = localStorage.getItem(key); if(raw && raw !== 'null' && raw !== 'undefined') { let parsed = JSON.parse(raw); if(Array.isArray(parsed)) return parsed; } } catch(e) {} return []; }
function safeParseObj(key) { try { let raw = localStorage.getItem(key); if(raw && raw !== 'null' && raw !== 'undefined') return JSON.parse(raw); } catch(e) {} return {}; }
function getSafeArrayFromLocal(key) { try { let r = localStorage.getItem(key); if(r && r !== 'undefined') return JSON.parse(r); } catch(e){} return []; }
function cleanPhone(p) { return String(p || '').replace(/\D/g, ''); } 
function formatMoney(num) { if (num === null || num === undefined) return "0 đ"; let cleanStr = String(num).replace(/[^0-9\-]/g, ""); return cleanStr === "" ? "0 đ" : Number(cleanStr).toLocaleString('vi-VN') + " đ"; }
function smartRound(val) { let v = Number(val); return isNaN(v) ? 0 : Math.round(v / 100) * 100; }
function getKeyByKeyword(obj, keyword) { if(!obj) return null; return Object.keys(obj).find(x => String(x).toLowerCase().trim().includes(keyword.toLowerCase())); }

function resolveKey(obj, keywords, exactFallback) {
    if (!obj) return exactFallback;
    let keys = Object.keys(obj);
    if (keys.includes(exactFallback)) return exactFallback;
    for (let kw of keywords) { let found = keys.find(k => String(k).trim().toLowerCase() === kw.toLowerCase()); if (found) return found; }
    for (let kw of keywords) { let found = keys.find(k => String(k).trim().toLowerCase().includes(kw.toLowerCase())); if (found) return found; }
    return exactFallback;
}

// BỘ ĐỌC NGÀY THÁNG ĐÃ ĐƯỢC FIX CHUẨN ĐỂ VẼ BIỂU ĐỒ 7 NGÀY
function parseDateString(dateStr) {
    if(!dateStr) return new Date(0); 
    let dStr = String(dateStr).trim(); 
    let timeMatch = dStr.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    let dateMatch = dStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    let now = new Date(); let h=0, min=0, sec=0, d=now.getDate(), m=now.getMonth(), y=now.getFullYear();
    
    if(timeMatch) { h = parseInt(timeMatch[1]); min = parseInt(timeMatch[2]); sec = timeMatch[3]?parseInt(timeMatch[3]):0; }
    if(dateMatch) { d = parseInt(dateMatch[1]); m = parseInt(dateMatch[2])-1; y = parseInt(dateMatch[3]); return new Date(y,m,d,h,min,sec); }
    
    let parsed = Date.parse(dStr); 
    if(!isNaN(parsed)) return new Date(parsed); 
    return new Date(y,m,d,h,min,sec); 
}

function generateCustomerId() {
    if (ALL_CUSTOMERS.length === 0) return 'KH0001'; 
    let maxId = 0;
    ALL_CUSTOMERS.forEach(c => { 
        let idStr = c[resolveKey(c, ['mã khách hàng'], 'Mã khách hàng')]; 
        if(idStr && String(idStr).startsWith('KH')) { 
            let num = parseInt(idStr.replace('KH', ''), 10); 
            if(!isNaN(num) && num > maxId) maxId = num; 
        } 
    });
    return 'KH' + String(maxId + 1).padStart(4, '0');
}

// --- SỰ KIỆN GIAO DIỆN ---
document.addEventListener('keydown', function(e) { if(e.key === "Escape") { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show')); if(typeof closeSuggest === 'function') { closeSuggest('cusSuggestAdd'); closeSuggest('cusSuggestEdit'); } } });
document.addEventListener('click', function(event) { if (event.target.classList.contains('modal')) { event.target.style.display = 'none'; } let inlineMenu = document.getElementById('inlineCatMenu'); if (inlineMenu && inlineMenu.style.display === 'block') { if (!inlineMenu.contains(event.target) && !event.target.classList.contains('cat-cell-inline')) { inlineMenu.style.display = 'none'; if(typeof closeInlineCatMenu === 'function') closeInlineCatMenu(); } } let isSuggestClick = event.target.closest('.suggest-box'); let isInputClick = event.target.id === 'cPhone' || event.target.id === 'cName' || event.target.id === 'eoPhone' || event.target.id === 'eoName'; if (!isSuggestClick && !isInputClick) { document.querySelectorAll('.suggest-box').forEach(b => b.style.display = 'none'); } if(!event.target.closest('.dropdown')) { document.querySelectorAll('.dropdown-content').forEach(d => { if(d.id !== 'inlineCatMenu') d.classList.remove('show'); }); } });

function toggleTheme() { document.body.classList.toggle('dark-theme'); let isDark = document.body.classList.contains('dark-theme'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); let t = document.getElementById('themeBtn'); if(t) t.innerText = isDark ? '☀️' : '🌙'; }
function toggleDropdown(e, id) { e.stopPropagation(); document.querySelectorAll('.dropdown-content').forEach(d => { if(d.id !== id) d.classList.remove('show'); }); let el = document.getElementById(id); if(el) el.classList.toggle('show'); }
function openImageModal(src) { if(!src) return; let img = document.getElementById('previewImgSrc'); if(img) img.src = src; let mod = document.getElementById('imageModal'); if(mod) mod.style.display = 'flex'; }
function closeModal(id) { let el = document.getElementById(id); if(el) el.style.display = 'none'; }

function showPage(page) {
    try {
        currentPage = page; document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
        let viewEl = document.getElementById('view-' + page); if(viewEl) viewEl.style.display = 'block';
        document.querySelectorAll('.nav div').forEach(el => el.classList.remove('active')); let navEl = document.getElementById('nav-' + page); if(navEl) navEl.classList.add('active');
        let s1 = document.getElementById('searchProducts'); if(s1) s1.value = ''; let s2 = document.getElementById('searchOrders'); if(s2) s2.value = ''; let s3 = document.getElementById('searchCustomers'); if(s3) s3.value = ''; document.querySelectorAll('.chk-box').forEach(c => c.checked = false); if(typeof checkBulk === 'function') checkBulk();
        
        if(page === 'dashboard' && typeof renderAdvancedDashboard === 'function') renderAdvancedDashboard();
        if(page === 'products' && typeof renderProductsData === 'function') renderProductsData(true);
        if(page === 'orders' && typeof renderOrdersData === 'function') renderOrdersData(true);
        if(page === 'customers' && typeof renderCustomersData === 'function') renderCustomersData(true);
        if(page === 'add' && typeof renderAddFormUI === 'function') { restoreDraftLocal(); renderAddFormUI(); } 
    } catch(e) { console.error("Lỗi chuyển trang:", e); }
}

function setViewMode(mode) { viewMode = mode; localStorage.setItem('viewMode', mode); document.querySelectorAll('.vbtn').forEach(btn => btn.classList.remove('active')); document.querySelectorAll(`.vbtn[onclick="setViewMode('${mode}')"]`).forEach(b=>b.classList.add('active')); showPage(currentPage); }
function loadMore(type) { if(type === 'prod') { limitProd += 50; if(typeof renderProductsData === 'function') renderProductsData(false); } if(type === 'ord') { limitOrd += 50; if(typeof renderOrdersData === 'function') renderOrdersData(false); } if(type === 'cus') { limitCus += 50; if(typeof renderCustomersData === 'function') renderCustomersData(false); } }
function hardResetCache() { if(confirm("XÓA BỘ NHỚ TẠM?\nDùng khi: Lỗi cột, trắng bảng, cần tải dữ liệu sạch 100% từ đầu.")) { localStorage.removeItem('lastSyncTime'); localStorage.removeItem('ALL_PRODUCTS'); localStorage.removeItem('ALL_ORDERS'); localStorage.removeItem('ALL_CUSTOMERS'); location.reload(true); } }

// =======================================================
// CÁC HÀM XỬ LÝ CÀI ĐẶT RIÊNG CHO TỪNG TÀI KHOẢN
// =======================================================

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
    
    let conf = { 
        settings: s, 
        carriers: getSafeArrayFromLocal('truongan_custom_carriers'), 
        hideProd: safeParseObj('hiddenColsProducts'), 
        hideOrd: safeParseObj('hiddenColsOrders'), 
        colWidths: safeParseObj('truongan_col_widths'),
        aliases: safeParseObj('truongan_col_aliases') 
    };
    let currentHash = JSON.stringify(conf);
    
    let accId = (typeof currentUser !== 'undefined' && currentUser && currentUser.username) ? currentUser.username : "SETTING_1";
    
    addQueueItem('updateSettings', { "ID": accId, "Cấu Hình JSON": currentHash });
    lastSettingsHash = currentHash; 
    pushSyncQueue(); 
    
    closeModal('settingsModal'); 
    alert(`✅ Đã lưu cấu hình riêng cho tài khoản: [${accId}]`);
}

// BỘ LƯU TÊN TIÊU ĐỀ TÙY CHỈNH
function saveAlias(origKey, newName) {
    colAliases[origKey] = newName.trim() || origKey;
    localStorage.setItem('truongan_col_aliases', JSON.stringify(colAliases));
    checkAndSyncSettings();
    if(currentPage === 'products' && typeof renderProductsData === 'function') renderProductsData();
    if(currentPage === 'orders' && typeof renderOrdersData === 'function') renderOrdersData();
}

function buildSettingsMenu() {
    try {
        if(ALL_PRODUCTS && ALL_PRODUCTS.length > 0) { 
            let exclude = ['link ảnh', 'chi tiết json', '% khuyến mãi', 'giá khuyến mãi', '% km', 'giá km', 'cập nhật cuối', 'json']; 
            let keysP = Object.keys(ALL_PRODUCTS[0] || {}).filter(k => !exclude.some(ex => String(k).toLowerCase().includes(ex))); 
            let htmlP = '<div style="padding:10px; font-weight:bold; border-bottom:1px solid #eee;">Kho Hàng - Ẩn hiện & Đổi Tên Cột:</div><div style="display:grid; grid-template-columns:1fr; gap:8px; padding:10px; max-height:200px; overflow-y:auto;">'; 
            keysP.forEach(k => {
                let sK = String(k).replace(/'/g, "\\'");
                htmlP += `<div style="display:flex; align-items:center; gap:8px;"><input type="checkbox" style="flex-shrink:0;" onchange="toggleCol('products', '${sK}')" ${!hiddenColsProducts[k]?'checked':''}/> <span style="font-size:13px; width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${k}">${k}</span> <input type="text" value="${colAliases[k] || k}" onchange="saveAlias('${sK}', this.value)" style="flex:1; padding:4px; font-size:12px; border:1px solid #ccc; border-radius:4px;" placeholder="Đổi tên..."/></div>`;
            }); 
            htmlP += '</div>'; let elP = document.getElementById('colMenuProducts'); if(elP) elP.innerHTML = htmlP; 
        }
        if(ALL_ORDERS && ALL_ORDERS.length > 0) { 
            let exclude = ['chi tiết json', 'cập nhật cuối', 'json']; 
            let keysO = Object.keys(ALL_ORDERS[0] || {}).filter(k => !exclude.some(ex => String(k).toLowerCase().includes(ex))); 
            let htmlO = '<div style="padding:10px; font-weight:bold; border-bottom:1px solid #eee;">Đơn Hàng - Ẩn hiện & Đổi Tên Cột:</div><div style="display:grid; grid-template-columns:1fr; gap:8px; padding:10px; max-height:200px; overflow-y:auto;">'; 
            keysO.forEach(k => {
                let sK = String(k).replace(/'/g, "\\'");
                htmlO += `<div style="display:flex; align-items:center; gap:8px;"><input type="checkbox" style="flex-shrink:0;" onchange="toggleCol('orders', '${sK}')" ${!hiddenColsOrders[k]?'checked':''}/> <span style="font-size:13px; width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${k}">${k}</span> <input type="text" value="${colAliases[k] || k}" onchange="saveAlias('${sK}', this.value)" style="flex:1; padding:4px; font-size:12px; border:1px solid #ccc; border-radius:4px;" placeholder="Đổi tên..."/></div>`;
            }); 
            htmlO += '</div>'; let elO = document.getElementById('colMenuOrders'); if(elO) elO.innerHTML = htmlO; 
        }
    } catch(e) {}
}

function toggleCol(type, key) { 
    if(type === 'products') { 
        hiddenColsProducts[key] = !hiddenColsProducts[key]; 
        localStorage.setItem('hiddenColsProducts', JSON.stringify(hiddenColsProducts)); 
        if(typeof renderProductsData === 'function') renderProductsData(); 
    } else { 
        hiddenColsOrders[key] = !hiddenColsOrders[key]; 
        localStorage.setItem('hiddenColsOrders', JSON.stringify(hiddenColsOrders)); 
        if(typeof renderOrdersData === 'function') renderOrdersData(); 
    } 
    checkAndSyncSettings();
    pushSyncQueue(true);
}

function loadCustomCarriers() {
    let customCarriers = []; 
    try { let raw = localStorage.getItem('truongan_custom_carriers'); if(raw) customCarriers = JSON.parse(raw); } catch(e){}
    let selects = [document.getElementById('cShippingCarrier'), document.getElementById('eoShippingCarrier')];
    selects.forEach(sel => { 
        if(!sel) return; 
        Array.from(sel.options).forEach(opt => { if(opt.className === 'custom-carr') opt.remove(); }); 
        customCarriers.forEach(c => { 
            let opt = document.createElement('option'); opt.value = c; opt.text = c; opt.className = 'custom-carr'; 
            sel.appendChild(opt); 
        }); 
    });
}

function addNewCarrier(isEdit = false) {
    let newCarr = prompt("Thêm Nhà xe / Đơn vị vận chuyển mới:\n(Ví dụ: Xe Hải Vân...)");
    if(!newCarr || !newCarr.trim()) return; newCarr = newCarr.trim();
    let customCarriers = getSafeArrayFromLocal('truongan_custom_carriers');
    if(!customCarriers.includes(newCarr)) {
        customCarriers.push(newCarr); 
        localStorage.setItem('truongan_custom_carriers', JSON.stringify(customCarriers)); 
        loadCustomCarriers();
        
        let selId = isEdit ? 'eoShippingCarrier' : 'cShippingCarrier'; 
        let sel = document.getElementById(selId); if(sel) sel.value = newCarr;
        
        checkAndSyncSettings(); 
        pushSyncQueue(true);
        if(!isEdit && typeof saveDraftLocal === 'function') saveDraftLocal();
    } else { alert("Nhà xe này đã tồn tại!"); }
}

function checkAndSyncSettings() { 
    let conf = { 
        settings: safeParseObj('truongan_settings'), 
        carriers: getSafeArrayFromLocal('truongan_custom_carriers'), 
        hideProd: safeParseObj('hiddenColsProducts'), 
        hideOrd: safeParseObj('hiddenColsOrders'), 
        colWidths: safeParseObj('truongan_col_widths'),
        aliases: safeParseObj('truongan_col_aliases')
    }; 
    let currentHash = JSON.stringify(conf); 
    let accId = (typeof currentUser !== 'undefined' && currentUser && currentUser.username) ? currentUser.username : "SETTING_1";
    
    if(lastSettingsHash !== "" && currentHash !== lastSettingsHash) { 
        addQueueItem('updateSettings', { "ID": accId, "Cấu Hình JSON": currentHash }); 
        lastSettingsHash = currentHash; 
    } else if (lastSettingsHash === "") { 
        lastSettingsHash = currentHash; 
    } 
}

// --- QUEUE & ĐỒNG BỘ DATA ---
function addQueueItem(action, data) {
   let existingIdx = syncQueue.findIndex(q => { if (q.action !== action) return false; if (action === 'updateProduct' || action === 'deleteProduct') return q.data[resolveKey(q.data, ['mã sp'], 'Mã SP')] === data[resolveKey(data, ['mã sp'], 'Mã SP')]; if (action === 'addOrder' || action === 'updateOrder') return q.data[resolveKey(q.data, ['mã đơn'], 'Mã Đơn')] === data[resolveKey(data, ['mã đơn'], 'Mã Đơn')]; if (action === 'deleteOrder') return q.data.id === data.id; if (action === 'updateCustomer') return cleanPhone(q.data[resolveKey(q.data, ['điện thoại', 'sdt'], 'Điện thoại')]) === cleanPhone(data[resolveKey(data, ['điện thoại', 'sdt'], 'Điện thoại')]); if (action === 'deleteCustomer') return cleanPhone(q.data.phone) === cleanPhone(data.phone); return false; });
   if(existingIdx > -1) { syncQueue[existingIdx].data = data; } else { syncQueue.push({ id: Date.now() + Math.random(), action, data }); }
   localStorage.setItem('syncQueue', JSON.stringify(syncQueue)); updateSyncBadge();
   if (currentPage === 'orders' && typeof renderOrdersData === 'function') renderOrdersData(); if (currentPage === 'products' && typeof renderProductsData === 'function') renderProductsData(); if (currentPage === 'customers' && typeof renderCustomersData === 'function') renderCustomersData(); if (currentPage === 'dashboard' && typeof renderAdvancedDashboard === 'function') renderAdvancedDashboard();
}

function updateSyncBadge() { let b = document.getElementById('syncBtnUI'); if(!b) return; if(syncQueue.length > 0) { b.innerHTML = '🔄 Đang chờ...'; b.style.color = '#f59e0b'; } else { b.innerHTML = '⬆️ Đẩy Lên'; b.style.color = '#fff'; } }

async function pushSyncQueue(isSilent = false) {
   if(syncQueue.length === 0) return true; let b = document.getElementById('syncBtnUI'); if(b) b.innerHTML = '🔄 Đang đẩy...';
   try { let res = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "syncBatch", queue: syncQueue }) }); let result = await res.json(); if(result.success) { syncQueue = []; localStorage.setItem('syncQueue', '[]'); updateSyncBadge(); return true; } else { if(!isSilent) alert("❌ Lỗi từ Google Sheet: " + result.error); updateSyncBadge(); return false; } } catch(e) { updateSyncBadge(); return false; }
}

async function syncData(force = false, isSilent = false) {
    if(typeof currentUser === 'undefined' || !currentUser || !currentUser.success) return; 
    let ui = document.getElementById("loadingUI");
    try {
        if(force && !isSilent) { if(ui) ui.style.display = "flex"; } 
        if(syncQueue.length > 0) { await pushSyncQueue(isSilent); }
        
        let lastSync = force ? 0 : (Number(localStorage.getItem('lastSyncTime')) || 0);
        let syncTimeMark = new Date().getTime(); 
        
        let resProds = await fetch(API+`?type=products&lastSync=${lastSync}`);
        let resOrds = await fetch(API+`?type=orders&lastSync=${lastSync}`);
        let resCus = await fetch(API+`?type=customers&lastSync=${lastSync}`);
        
        // TẢI SETTINGS CỦA RIÊNG TÀI KHOẢN NÀY VỀ MÁY
        if(lastSync === 0) {
            let accId = currentUser.username || "SETTING_1";
            let resSet = await fetch(API+"?type=settings&username=" + accId); 
            if(resSet.ok) {
                let setObj = await resSet.json();
                if(setObj && setObj['Cấu Hình JSON']) {
                    try {
                        let conf = JSON.parse(setObj['Cấu Hình JSON']);
                        if(Object.keys(conf).length > 0) {
                            if(conf.settings && Object.keys(conf.settings).length > 0) localStorage.setItem('truongan_settings', JSON.stringify(conf.settings));
                            if(conf.carriers && conf.carriers.length > 0) localStorage.setItem('truongan_custom_carriers', JSON.stringify(conf.carriers));
                            if(conf.hideProd && Object.keys(conf.hideProd).length > 0) { hiddenColsProducts = conf.hideProd; localStorage.setItem('hiddenColsProducts', JSON.stringify(hiddenColsProducts)); }
                            if(conf.hideOrd && Object.keys(conf.hideOrd).length > 0) { hiddenColsOrders = conf.hideOrd; localStorage.setItem('hiddenColsOrders', JSON.stringify(hiddenColsOrders)); }
                            if(conf.colWidths && Object.keys(conf.colWidths).length > 0) localStorage.setItem('truongan_col_widths', JSON.stringify(conf.colWidths));
                            if(conf.aliases && Object.keys(conf.aliases).length > 0) { colAliases = conf.aliases; localStorage.setItem('truongan_col_aliases', JSON.stringify(colAliases)); }
                        }
                        lastSettingsHash = setObj['Cấu Hình JSON']; 
                        if(typeof loadCustomCarriers === 'function') loadCustomCarriers();
                    } catch(e){}
                }
            }
        }
        
        let prods = await resProds.json(); let ords = await resOrds.json(); let cus = await resCus.json();
        
        if(lastSync === 0) {
            if(Array.isArray(prods) && prods.length > 0) ALL_PRODUCTS = prods; 
            if(Array.isArray(ords)) ALL_ORDERS = ords; 
            if(Array.isArray(cus)) ALL_CUSTOMERS = cus; 
        } else {
            if(Array.isArray(prods) && prods.length > 0) { prods.forEach(np => { let pKey = resolveKey(np, ['mã sp'], 'Mã SP'); let idx = ALL_PRODUCTS.findIndex(op => op[pKey] === np[pKey]); if(idx > -1) ALL_PRODUCTS[idx] = np; else ALL_PRODUCTS.unshift(np); }); }
            if(Array.isArray(ords) && ords.length > 0) { ords.forEach(no => { let oKey = resolveKey(no, ['mã đơn'], 'Mã Đơn'); let idx = ALL_ORDERS.findIndex(oo => oo[oKey] === no[oKey]); if(idx > -1) ALL_ORDERS[idx] = no; else ALL_ORDERS.unshift(no); }); }
            if(Array.isArray(cus) && cus.length > 0) { cus.forEach(nc => { let pKey = resolveKey(nc, ['điện thoại', 'sdt'], 'Điện thoại'); let idx = ALL_CUSTOMERS.findIndex(oc => cleanPhone(oc[pKey]) === cleanPhone(nc[pKey])); if(idx > -1) ALL_CUSTOMERS[idx] = nc; else ALL_CUSTOMERS.unshift(nc); }); }
        }
        
        localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS)); 
        localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS)); 
        localStorage.setItem('ALL_CUSTOMERS', JSON.stringify(ALL_CUSTOMERS));
        localStorage.setItem('lastSyncTime', syncTimeMark); 
        
        updateSyncBadge(); 
        if(ALL_PRODUCTS.length > 0) { if(typeof buildSettingsMenu === 'function') buildSettingsMenu(); if(typeof initCategories === 'function') initCategories(); if(typeof renderAddFormUI === 'function') renderAddFormUI(); }
        
        if(!isSilent) { let viewEl = document.getElementById('view-' + currentPage); if(viewEl && force) { showPage(currentPage); } } 
        else { if (currentPage === 'orders' && typeof renderOrdersData === 'function') renderOrdersData(); if (currentPage === 'products' && typeof renderProductsData === 'function') renderProductsData(); if (currentPage === 'customers' && typeof renderCustomersData === 'function') renderCustomersData(); if (currentPage === 'dashboard' && typeof renderAdvancedDashboard === 'function') renderAdvancedDashboard(); }
    } catch(e) { console.error("Lỗi mạng:", e); if(!isSilent) alert("⚠️ Lỗi tải dữ liệu. Hãy tải lại trang."); } finally { if(ui && !isSilent) ui.style.display = "none"; }
}

setInterval(() => { if(typeof currentUser !== 'undefined' && currentUser && currentUser.success) { checkAndSyncSettings(); syncData(false, true); } }, 3 * 60 * 1000);