// --- KHỞI TẠO DANH MỤC & TAGS ---
function initCategories() {
    if (!ALL_PRODUCTS || ALL_PRODUCTS.length === 0) return;
    categoryCol = Object.keys(ALL_PRODUCTS[0]).find(k => String(k).toLowerCase().includes('loại')) || 'Loại - N';
    let catSet = new Set();
    ALL_PRODUCTS.forEach(p => {
        let cats = String(p[categoryCol] || '');
        if (cats) {
            cats.split(',').forEach(c => {
                let cleanCat = c.trim();
                if (cleanCat) catSet.add(cleanCat);
            });
        }
    });
    ALL_CATEGORIES = Array.from(catSet).sort();
    renderCatTags();
    let catDl = document.getElementById('catDatalist');
    if (catDl) catDl.innerHTML = ALL_CATEGORIES.map(c => `<option value="${c}"></option>`).join('');
}

function renderCatTags() {
    let bar = document.getElementById('catFilterBar');
    if (!categoryCol || ALL_CATEGORIES.length === 0) {
        if (bar) bar.style.display = 'none';
        return;
    }
    if (bar) {
        bar.style.display = 'flex';
        let html = `<div class="cat-tag ${activeTags.length === 0 ? 'active' : ''}" onclick="toggleTag('ALL')">Tất cả</div>`;
        ALL_CATEGORIES.forEach(c => {
            let isActive = activeTags.includes(c) ? 'active' : '';
            html += `<div class="cat-tag ${isActive}" onclick="toggleTag('${c}')">${c}</div>`;
        });
        bar.innerHTML = html;
    }
}

function toggleTag(cat) {
    if (cat === 'ALL') {
        activeTags = [];
    } else {
        if (activeTags.includes(cat)) activeTags = activeTags.filter(t => t !== cat);
        else activeTags.push(cat);
    }
    renderCatTags();
    renderProductsData(true);
}

// --- HIỂN THỊ DỮ LIỆU SẢN PHẨM ---
function renderProductsData(resetLimit = false) {
    try {
        let pl = document.getElementById("productsList");
        if (!ALL_PRODUCTS || ALL_PRODUCTS.length === 0) {
            if (pl) pl.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.6;">Chưa có sản phẩm.</div>';
            return;
        }

        if (resetLimit) limitProd = 50;
        let sEl = document.getElementById("searchProducts");
        let s = sEl ? String(sEl.value).toLowerCase().trim() : '';

        let filtered = s ? ALL_PRODUCTS.filter(p => Object.values(p).join(' ').toLowerCase().includes(s)) : ALL_PRODUCTS;
        if (categoryCol && activeTags.length > 0) {
            filtered = filtered.filter(p => activeTags.some(tag => String(p[categoryCol] || '').includes(tag)));
        }

        let exclude = ['link ảnh', 'chi tiết json', '% khuyến mãi', 'giá khuyến mãi'];
        let keys = Object.keys(ALL_PRODUCTS[0] || {});
        let vis = keys.filter(k => !hiddenColsProducts[k] && !exclude.some(ex => String(k).toLowerCase().includes(ex)));

        let totalStockVal = filtered.reduce((sum, p) => sum + (Number(p[getKeyByKeyword(p, 'tồn kho')]) || 0), 0);
        let pcEl = document.getElementById('prodCountDisplay');
        if (pcEl) pcEl.innerText = `${filtered.length} mã | Tồn: ${totalStockVal}`;

        let sliced = filtered.slice(0, limitProd);
        let html = viewMode === 'table' ? `<div class="table-responsive"><table><thead><tr><th class="col-check"><input type="checkbox" onclick="toggleAllChecks(this)"/></th>` : `<div class="data-grid">`;

        if (viewMode === 'table') {
            vis.forEach(k => {
                let cClass = k === 'Mã SP' ? 'col-id' : (String(k).toLowerCase().includes('giá') ? 'text-right' : '');
                html += `<th class="${cClass}" title="${k}">${k === categoryCol ? 'Phân loại' : k}</th>`;
            });
            html += `<th class="col-action">Thao tác</th></tr></thead><tbody>`;
        }

        sliced.forEach(p => {
            let tkReal = Number(p[getKeyByKeyword(p, 'tồn kho')]) || 0;
            let dangDat = Number(p[getKeyByKeyword(p, 'đang đặt')]) || 0;
            let isOutOfStock = (tkReal - dangDat) <= 0;

            if (viewMode === 'table') {
                html += `<tr id="item_${p['Mã SP']}"><td class="col-check"><input type="checkbox" class="chk-box" value="${p['Mã SP']}" onchange="checkBulk()"/></td>`;
                vis.forEach(k => {
                    let val = p[k] || '';
                    if (String(k).toLowerCase().includes('giá') || String(k).toLowerCase().includes('gốc')) val = formatMoney(val);
                    if (k === getKeyByKeyword(p, 'tồn kho') && tkReal <= 0) val = `<b style="color:#ef4444;">0</b>`;
                    html += `<td>${val}</td>`;
                });
                html += `<td><button class="action-btn gray" onclick="openEditProduct('${p['Mã SP']}')">✏️</button></td></tr>`;
            } else {
                html += `<div class="card">
                    <div class="card-header"><b>${p['Tên SP']}</b> <span>#${p['Mã SP']}</span></div>
                    <div class="card-row"><span class="lbl">Tồn kho:</span> <span class="val" style="${isOutOfStock ? 'color:#ef4444;font-weight:bold;' : ''}">${tkReal}</span></div>
                    <div class="card-row"><span class="lbl">Giá lẻ:</span> <b class="price-text">${formatMoney(p['Giá bán lẻ'])}</b></div>
                    <button class="action-btn gray" style="margin-top:10px;" onclick="openEditProduct('${p['Mã SP']}')">✏️ Chỉnh sửa</button>
                </div>`;
            }
        });

        if (viewMode === 'table') html += `</tbody></table></div>`;
        else html += `</div>`;
        if (filtered.length > limitProd) html += `<div style="text-align:center;padding:15px;"><button class="action-btn blue" onclick="loadMore('prod')">Xem thêm</button></div>`;
        pl.innerHTML = html;
        if (viewMode === 'table' && typeof initResizableColumns === 'function') initResizableColumns();
    } catch (e) { console.error(e); }
}

// --- LOGIC NGHIỆP VỤ ---
function openAddProductModal() {
    document.getElementById('apId').value = '';
    document.getElementById('apName').value = '';
    document.getElementById('apStock').value = 0;
    document.getElementById('addSpModal').style.display = 'flex';
}

function saveNewProduct() {
    let id = document.getElementById('apId').value.trim().toUpperCase();
    let name = document.getElementById('apName').value.trim();
    if (!id || !name) return alert("Vui lòng nhập Mã và Tên SP!");

    let newP = {
        "Mã SP": id, "Tên SP": name, "Loại - N": document.getElementById('apCat').value,
        "Tồn kho": Number(document.getElementById('apStock').value) || 0,
        "Giá gốc": Number(document.getElementById('apCost').value) || 0,
        "Giá bán sỉ": Number(document.getElementById('apWholesale').value) || 0,
        "Giá bán lẻ": Number(document.getElementById('apRetail').value) || 0,
        "Đang đặt": 0
    };
    ALL_PRODUCTS.unshift(newP);
    localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS));
    addQueueItem('updateProduct', newP);
    renderProductsData(true);
    closeModal('addSpModal');
}

function autoCalcRealtimePrice() {
    let l = Number(document.getElementById('smartLoiNhuan').value) || 0;
    let cost = Number(document.getElementById('edit_Giá_gốc').value) || 0;
    if (l > 0 && cost > 0) {
        let price = smartRound(cost * (1 + l / 100));
        document.getElementById('edit_Giá_bán_lẻ').value = price;
    }
}