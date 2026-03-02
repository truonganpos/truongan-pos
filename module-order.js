// --- QUY TRÌNH XỬ LÝ ĐƠN 3 BƯỚC ---
function markShipping(id) {
    if (isOrderProcessing) return;
    isOrderProcessing = true;
    let o = ALL_ORDERS.find(x => x['Mã Đơn'] === id);
    if (o) {
        o['Trạng Thái'] = 'Đang giao';
        localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS));
        addQueueItem('updateOrder', o);
        renderOrdersData();
        renderRecentDrafts();
    }
    setTimeout(() => { isOrderProcessing = false; }, 500);
}

function markCollectedCOD(id) {
    let o = ALL_ORDERS.find(x => x['Mã Đơn'] === id);
    if (!o) return;
    let finalTotal = Number(String(o['Thành Tiền Sau Chiết Khấu'] || o['Tổng Tiền'] || 0).replace(/[^0-9\-]/g, ""));
    o['Khách Thanh Toán'] = finalTotal;
    o['Còn Nợ'] = 0;
    o['Trạng Thái'] = 'Đã giao';

    // Cập nhật kho khi đơn hoàn tất
    if (o['Chi Tiết JSON']) {
        try {
            JSON.parse(o['Chi Tiết JSON']).forEach(item => {
                let p = ALL_PRODUCTS.find(x => x['Mã SP'] == item.maSP);
                if (p) {
                    let kTk = getKeyByKeyword(p, 'tồn kho');
                    let kDd = getKeyByKeyword(p, 'đang đặt');
                    p[kTk] = (Number(p[kTk]) || 0) - item.soLuong;
                    p[kDd] = (Number(p[kDd]) || 0) - item.soLuong;
                    if (p[kDd] < 0) p[kDd] = 0;
                    addQueueItem('updateProduct', p);
                }
            });
        } catch (e) { }
    }
    localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS));
    localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS));
    addQueueItem('updateOrder', o);
    renderOrdersData();
    alert("💰 Thu COD thành công!");
}

// --- TÍNH TOÁN & GIỎ HÀNG ---
function updateOrderSummary(isEdit) {
    let prefix = isEdit ? 'eo' : 'c';
    let disc = Number(document.getElementById(prefix + 'Discount').value) || 0;
    let ship = Number(document.getElementById(prefix + 'ShippingFee').value) || 0;
    let paid = Number(document.getElementById(prefix + 'Paid').value) || 0;
    let oldDebt = Number(document.getElementById(prefix + 'OldDebt').value) || 0;

    let rawTotal = currentOrderItems.reduce((sum, i) => sum + i.thanhTien, 0);
    let finalTotal = disc > 0 ? smartRound(rawTotal * (1 - disc / 100)) : rawTotal;
    finalTotal += ship;
    let tongPhaiThu = finalTotal + oldDebt;
    let conNo = tongPhaiThu - paid;

    let html = `
        <div class="summary-row"><span>Tiền hàng:</span> <b>${formatMoney(rawTotal)}</b></div>
        ${ship > 0 ? `<div class="summary-row" style="color:#f59e0b;"><span>Phí Ship:</span> <b>+${formatMoney(ship)}</b></div>` : ''}
        <div class="summary-row final"><span>Thành tiền đơn:</span> <b>${formatMoney(finalTotal)}</b></div>
        <div class="summary-row tong-cong"><span>TỔNG PHẢI THU:</span> <b>${formatMoney(tongPhaiThu)}</b></div>
        <div class="summary-row"><span>Còn nợ:</span> <b style="color:#ef4444;">${formatMoney(conNo)}</b></div>
    `;
    let div = document.getElementById(isEdit ? 'eoSummary' : 'addOrderSummary');
    if (div) { div.innerHTML = html; div.style.display = 'block'; }
    if (!isEdit) saveDraftLocal();
}