let returnCart = [];

function searchReturnItem() {
    let s = document.getElementById('returnSearchInput').value.trim();
    if (!s) return;
    let order = ALL_ORDERS.find(o => o['Mã Đơn'] === s || cleanPhone(o['SDT']) === cleanPhone(s));
    if (order) {
        let items = JSON.parse(order['Chi Tiết JSON'] || '[]');
        let html = items.map((i, idx) => `
            <div class="order-item-row">
                <span>${i.tenSP} (x${i.soLuong})</span>
                <button class="action-btn red" onclick="addToReturnCart('${order['Mã Đơn']}', ${idx})">Chọn trả</button>
            </div>
        `).join('');
        document.getElementById('returnSearchInfo').innerHTML = `<b>Đơn: ${order['Mã Đơn']}</b><br>${html}`;
    } else {
        alert("Không tìm thấy đơn hàng!");
    }
}

function processReturn() {
    if (returnCart.length === 0) return alert("Chưa có hàng trả!");
    if (!confirm("Xác nhận hoàn trả hàng và cập nhật lại tiền nợ/kho?")) return;

    returnCart.forEach(item => {
        let p = ALL_PRODUCTS.find(x => x['Mã SP'] == item.maSP);
        if (p) {
            let kTk = getKeyByKeyword(p, 'tồn kho');
            p[kTk] = (Number(p[kTk]) || 0) + item.soLuong;
            addQueueItem('updateProduct', p);
        }
    });

    // Tạo đơn trả hàng âm tiền để cân đối Sheet
    let returnOrder = {
        "Mã Đơn": "TRA_" + Date.now().toString().slice(-5),
        "Thời Gian": new Date().toLocaleString('vi-VN'),
        "Trạng Thái": "Đã hoàn trả",
        "Tổng Tiền": -returnTotal // Tiền âm
    };
    addQueueItem('addOrder', returnOrder);
    alert("✅ Đã xử lý trả hàng xong!");
    closeModal('returnModal');
}