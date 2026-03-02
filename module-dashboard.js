function renderAdvancedDashboard() {
    let filter = document.getElementById('dashTimeFilter').value;
    let now = new Date();
    let startDate = new Date(0);
    let endDate = new Date();

    if (filter === 'today') startDate = new Date(now.setHours(0,0,0,0));
    else if (filter === '7days') startDate = new Date(now.setDate(now.getDate() - 7));
    else if (filter === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    let rev = 0; let cost = 0; let items = 0; let orders = 0; let cod = 0;

    ALL_ORDERS.forEach(o => {
        let dt = parseDateString(o['Thời Gian']);
        let st = String(o['Trạng Thái']).trim();
        
        if (st === 'Đã giao' && dt >= startDate && dt <= endDate) {
            let total = Number(String(o['Thành Tiền Sau Chiết Khấu'] || o['Tổng Tiền']).replace(/[^0-9\-]/g, ""));
            rev += total;
            orders++;
            items += Number(o['Tổng SP'] || 0);
            // Tính giá vốn
            try {
                if(o['Chi Tiết JSON']) {
                    JSON.parse(o['Chi Tiết JSON']).forEach(i => { cost += (Number(i.giaGoc) || 0) * i.soLuong; });
                }
            } catch(e){}
        } else if (st === 'Đang giao') {
            // TIỀN COD ĐANG ĐI VẮNG
            cod += Number(String(o['Còn Nợ'] || o['Thành Tiền Sau Chiết Khấu']).replace(/[^0-9\-]/g, ""));
        }
    });

    document.getElementById('dashRev').innerText = formatMoney(rev);
    document.getElementById('dashProfit').innerText = formatMoney(rev - cost);
    document.getElementById('dashCOD').innerText = formatMoney(cod);
    document.getElementById('dashCost').innerText = formatMoney(cost);
    document.getElementById('dashItems').innerText = `${orders} / ${items}`;

    renderChart(rev); // Gọi hàm vẽ biểu đồ từ thư viện Chart.js
}