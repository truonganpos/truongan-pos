function renderAdvancedDashboard() {
    let tf = document.getElementById('dashTimeFilter');
    let filter = tf ? tf.value : '7days';

    let now = new Date();
    let startDate = new Date(0);
    let endDate = new Date();

    if (filter === 'today') { startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
    else if (filter === 'yesterday') { startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59); }
    else if (filter === '7days') { startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); }
    else if (filter === 'month') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (filter === 'lastmonth') { startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); }
    else if (filter === 'all') { startDate = new Date(0); } 

    let rev = 0; let cost = 0; let itemsCount = 0; let orderCount = 0; let codTotal = 0;

    let filteredOrds = ALL_ORDERS.filter(o => {
        let dt = parseDateString(o['Thời Gian']);
        return dt >= startDate && dt <= endDate;
    });

    filteredOrds.forEach(o => {
        let st = String(o['Trạng Thái']).trim();
        if (st === 'Đã giao') {
            rev += Number(String(o['Thành Tiền Sau Chiết Khấu']||o['Tổng Tiền']||0).replace(/[^0-9\-]/g,""));
            orderCount++;
            itemsCount += Number(o['Tổng SP'] || 0);

            if (o['Chi Tiết JSON']) {
                try {
                    let items = JSON.parse(o['Chi Tiết JSON']);
                    items.forEach(i => { cost += (Number(i.giaGoc) || 0) * (Number(i.soLuong) || 0); });
                } catch(e) {}
            }
        } 
        else if (st === 'Đang giao') {
            codTotal += Number(String(o['Còn Nợ']||o['Thành Tiền Sau Chiết Khấu']||0).replace(/[^0-9\-]/g,""));
        }
    });

    let profit = rev - cost;
    let margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;

    let elRev = document.getElementById('dashRev'); if(elRev) elRev.innerText = formatMoney(rev);
    let elProfit = document.getElementById('dashProfit'); if(elProfit) elProfit.innerText = formatMoney(profit);
    let elMargin = document.getElementById('dashMargin'); if(elMargin) elMargin.innerText = `Biên lãi: ${margin}%`;
    let elCost = document.getElementById('dashCost'); if(elCost) elCost.innerText = formatMoney(cost);
    let elItems = document.getElementById('dashItems'); if(elItems) elItems.innerText = `${orderCount} / ${itemsCount}`;
    let elCod = document.getElementById('dashCOD'); if(elCod) elCod.innerText = formatMoney(codTotal);

    // GỌI HÀM VẼ BIỂU ĐỒ VÀ DANH SÁCH TOP (Đã fix lỗi)
    renderChart(filteredOrds, filter);
    renderTopLists(filteredOrds);
}

function renderChart(ords, filter) {
    let ctx = document.getElementById('revenueChart'); if(!ctx) return;
    if(myChart) myChart.destroy();
    
    let dates = {};
    ords.forEach(o => {
        if(String(o['Trạng Thái']).trim() === 'Đã giao') {
            let dStr = o['Thời Gian'].split(' ')[0];
            if(!dates[dStr]) dates[dStr] = 0;
            dates[dStr] += Number(String(o['Thành Tiền Sau Chiết Khấu']||o['Tổng Tiền']||0).replace(/[^0-9\-]/g,""));
        }
    });

    let sortedDates = Object.keys(dates).sort((a,b) => parseDateString(a) - parseDateString(b));
    let lbls = sortedDates;
    let dataPts = sortedDates.map(k => dates[k]);

    if(filter === 'today' || filter === 'yesterday') {
        lbls = []; let hourly = Array(24).fill(0);
        ords.forEach(o => {
            if(String(o['Trạng Thái']).trim() === 'Đã giao') {
                let dt = parseDateString(o['Thời Gian']);
                hourly[dt.getHours()] += Number(String(o['Thành Tiền Sau Chiết Khấu']||o['Tổng Tiền']||0).replace(/[^0-9\-]/g,""));
            }
        });
        lbls = hourly.map((_, i) => i + "h"); 
        dataPts = hourly; 
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: lbls,
            datasets: [{ label: 'Doanh thu (VNĐ)', data: dataPts, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, fill: true, tension: 0.3, pointBackgroundColor: '#3b82f6', pointRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: function(val) { return formatMoney(val).replace(' đ',''); } } } } }
    });
}

function renderTopLists(ords) {
    let topP = document.getElementById('topProductsTable');
    let topC = document.getElementById('topCustomersTable');
    if(!topP || !topC) return;

    let pCount = {}; let cCount = {};
    ords.forEach(o => {
        if(String(o['Trạng Thái']).trim() !== 'Đã hủy' && String(o['Trạng Thái']).trim() !== 'Nháp') {
            let cName = o['Tên Khách Hàng'] || 'Khách lẻ';
            if(!cCount[cName]) cCount[cName] = 0;
            cCount[cName] += Number(String(o['Thành Tiền Sau Chiết Khấu']||o['Tổng Tiền']||0).replace(/[^0-9\-]/g,""));

            if(o['Chi Tiết JSON']) {
                try {
                    JSON.parse(String(o['Chi Tiết JSON'])).forEach(i => {
                        if(!pCount[i.tenSP]) pCount[i.tenSP] = 0;
                        pCount[i.tenSP] += Number(i.soLuong);
                    });
                } catch(e){}
            }
        }
    });

    let sProd = Object.keys(pCount).sort((a,b)=>pCount[b]-pCount[a]).slice(0,10);
    let sCus = Object.keys(cCount).sort((a,b)=>cCount[b]-cCount[a]).slice(0,10);

    let htmlP = sProd.length === 0 ? '<i style="opacity:0.6;font-size:13px;">Chưa có dữ liệu.</i>' : sProd.map((p, idx) => `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed #eee; font-size:13px;"><span><b>#${idx+1}.</b> <span style="color:inherit;" title="${p}">${p.length > 25 ? p.substring(0,25)+'...' : p}</span></span> <b style="color:#10b981;">${pCount[p]}</b></div>`).join('');
    topP.innerHTML = htmlP;

    let htmlC = sCus.length === 0 ? '<i style="opacity:0.6;font-size:13px;">Chưa có dữ liệu.</i>' : sCus.map((c, idx) => `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed #eee; font-size:13px;"><span><b>#${idx+1}.</b> <span style="color:inherit;">${c}</span></span> <b style="color:#3b82f6;">${formatMoney(cCount[c])}</b></div>`).join('');
    topC.innerHTML = htmlC;
}
