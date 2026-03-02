let returnCart = [];
let returnTotal = 0;

function openReturnModal() {
    returnCart = [];
    returnTotal = 0;
    document.getElementById('returnSearchInput').value = '';
    document.getElementById('returnSearchInfo').innerHTML = '';
    document.getElementById('returnNote').value = '';
    renderReturnCart();
    document.getElementById('returnModal').style.display = 'flex';
}

function searchReturnItem() {
    let searchStr = document.getElementById('returnSearchInput').value.trim().toUpperCase();
    if (!searchStr) return;

    let infoBox = document.getElementById('returnSearchInfo');
    
    // Tìm đơn hàng khớp SĐT hoặc Mã Đơn
    let matchingOrders = ALL_ORDERS.filter(o => 
        String(o['Mã Đơn']).toUpperCase() === searchStr || 
        cleanPhone(o['SDT']) === cleanPhone(searchStr)
    );

    if (matchingOrders.length > 0) {
        let html = '';
        matchingOrders.forEach(order => {
            if(order['Trạng Thái'] === 'Nháp' || order['Trạng Thái'] === 'Đã hủy' || order['Trạng Thái'] === 'Đã hoàn trả') return;
            
            html += `<div style="margin-top:10px; padding:10px; background:var(--btn-bg, #fff); border:1px dashed #ccc; border-radius:6px;">`;
            html += `<b style="color:#3b82f6;">📦 Đơn: ${order['Mã Đơn']}</b> <span style="font-size:11px;">(${order['Thời Gian']})</span><br/>`;
            
            try {
                let items = JSON.parse(order['Chi Tiết JSON']);
                items.forEach((item, idx) => {
                    html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:1px dotted #eee; padding-top:8px;">
                                <div style="flex:1;">
                                    <b>${item.tenSP}</b><br/>
                                    <span style="font-size:11px;">SL mua: ${item.soLuong} | Đơn giá: ${formatMoney(item.giaBan)}</span>
                                </div>
                                <button class="action-btn red" style="padding:4px 8px;" onclick="addReturnItem('${order['Mã Đơn']}', '${item.maSP}', '${String(item.tenSP).replace(/'/g, "\\'")}', ${item.giaBan}, ${item.soLuong})">Tạo mã trả</button>
                             </div>`;
                });
            } catch(e) {}
            html += `</div>`;
        });
        
        infoBox.innerHTML = html || '<i style="color:#ef4444;">Đơn hàng này không hợp lệ để trả (Có thể là đơn nháp/đã hủy).</i>';
    } else {
        infoBox.innerHTML = '<i style="color:#ef4444;">Không tìm thấy Đơn hàng / SĐT này.</i>';
    }
}

function addReturnItem(orderId, spId, spName, price, maxQty) {
    let existing = returnCart.find(i => i.spId === spId && i.orderId === orderId);
    if(existing) {
        if(existing.qty >= maxQty) return alert(`Sản phẩm này trong đơn chỉ có ${maxQty} cái. Không thể trả quá số lượng mua!`);
        existing.qty++;
    } else {
        returnCart.push({ orderId: orderId, spId: spId, spName: spName, price: price, qty: 1, maxQty: maxQty });
    }
    renderReturnCart();
}

function renderReturnCart() {
    let box = document.getElementById('returnCartList');
    returnTotal = 0;
    
    if(returnCart.length === 0) {
        box.innerHTML = '<i style="opacity:0.6; font-size:12px;">Chưa có sản phẩm nào được chọn để trả...</i>';
        document.getElementById('returnTotalDisplay').innerText = '0 đ';
        return;
    }

    let html = '';
    returnCart.forEach((item, idx) => {
        let lineTotal = item.price * item.qty;
        returnTotal += lineTotal;
        html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
                    <div style="flex:1;">
                        <b style="font-size:13px; color:#3b82f6;">${item.spName}</b> <span style="font-size:10px; opacity:0.6;">(Từ đơn: ${item.orderId})</span><br/>
                        <span style="font-size:12px; color:#ef4444;">Hoàn tiền: ${formatMoney(item.price)} / SP</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="number" class="item-edit-input" style="width:50px; margin:0;" value="${item.qty}" min="1" max="${item.maxQty}" onchange="changeReturnQty(${idx}, this.value)">
                        <button class="action-btn gray" style="padding:4px 8px;" onclick="removeReturnItem(${idx})">X</button>
                    </div>
                 </div>`;
    });
    
    box.innerHTML = html;
    document.getElementById('returnTotalDisplay').innerText = formatMoney(returnTotal);
}

function changeReturnQty(idx, newQty) {
    let item = returnCart[idx];
    let val = Number(newQty);
    if(val > item.maxQty) { alert(`Chỉ được trả tối đa ${item.maxQty} cái.`); val = item.maxQty; }
    if(val <= 0) val = 1;
    item.qty = val;
    renderReturnCart();
}

function removeReturnItem(idx) {
    returnCart.splice(idx, 1);
    renderReturnCart();
}

function processReturn() {
    if(returnCart.length === 0) return alert("Vui lòng chọn sản phẩm cần trả!");
    if(!confirm(`Xác nhận hoàn tất phiếu TRẢ HÀNG?\n\n- Tổng tiền sẽ hoàn: ${formatMoney(returnTotal)}\n- Tồn kho sẽ được cộng lại.`)) return;

    let note = document.getElementById('returnNote').value.trim();
    let detailJsonArr = returnCart.map(i => { return { maSP: i.spId, tenSP: i.spName, soLuong: i.qty, giaBan: i.price, thanhTien: i.price * i.qty, orderGoc: i.orderId }; });

    // 1. Ghi nhận phiếu Trả Hàng vào Tab Đơn Hàng (Tiền âm)
    let mockId = "TRA_" + Date.now().toString().slice(-5);
    let createTime = new Date().toLocaleString('vi-VN');
    
    // Tìm SĐT của khách hàng từ đơn gốc để cộng trừ nợ
    let originalOrder = ALL_ORDERS.find(o => o['Mã Đơn'] === returnCart[0].orderId);
    let sdtKhach = originalOrder ? cleanPhone(originalOrder['SDT']) : '';
    let tenKhach = originalOrder ? originalOrder['Tên Khách Hàng'] : 'Khách Trả Hàng';

    let returnOrder = { 
        "Mã Đơn": mockId, 
        "Thời Gian": createTime, 
        "Tên Khách Hàng": tenKhach, 
        "SDT": sdtKhach, 
        "Địa Chỉ": "", "Phí Ship": 0, "Thông tin Giao hàng": "", 
        "Ghi Chú": "PHIẾU TRẢ HÀNG: " + note, 
        "Tổng SP": returnCart.reduce((sum, i) => sum + i.qty, 0), 
        "Tổng Tiền": -returnTotal, 
        "Chiết Khấu %": 0, 
        "Thành Tiền Sau Chiết Khấu": -returnTotal, 
        "Chi Tiết JSON": JSON.stringify(detailJsonArr), 
        "Trạng Thái": "Đã hoàn trả", 
        "Khách Thanh Toán": -returnTotal, 
        "Còn Nợ": 0, 
        "Loại Đơn": "Hoàn trả" 
    };

    ALL_ORDERS.unshift(returnOrder);
    localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS));
    addQueueItem('addOrder', returnOrder);

    // 2. Cộng lại Tồn Kho
    returnCart.forEach(item => {
        let p = ALL_PRODUCTS.find(x => x['Mã SP'] == item.spId);
        if(p) {
            let keyTonKho = getKeyByKeyword(p, 'tồn kho') || 'Tồn kho';
            p[keyTonKho] = (Number(p[keyTonKho]) || 0) + item.qty;
            addQueueItem('updateProduct', p);
        }
    });
    localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS));

    // 3. Đồng bộ nợ nếu là khách lưu tên
    if(sdtKhach) syncCustomerStatsToSheet(sdtKhach);

    alert("✅ Xử lý phiếu Trả hàng thành công!");
    closeModal('returnModal');
    if(currentPage === 'orders') renderOrdersData();
    if(currentPage === 'dashboard') renderAdvancedDashboard();
}