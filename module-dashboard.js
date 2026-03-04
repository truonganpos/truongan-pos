function renderAdvancedDashboard() {
    let tf = document.getElementById('dashTimeFilter');
    let filter = tf ? tf.value : '7days';

    let now = new Date();
    let startDate = new Date(0);
    let endDate = new Date();

    if (filter === 'today') { startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
    else if (filter === 'yesterday') { startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59); }
    else if (filter === '7days') { startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); startDate.setHours(0,0,0,0); }
    else if (filter === 'month') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (filter === 'lastmonth') { startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); }
    else if (filter === 'all') { startDate = new Date(0); } 

    let rev = 0; let cost = 0; let itemsCount = 0; let orderCount = 0; let codTotal = 0;

    // TÍNH TỔNG CÔNG NỢ TOÀN HỆ THỐNG
    let totalDebt = 0;
    if (typeof ALL_CUSTOMERS !== 'undefined') {
        ALL_CUSTOMERS.forEach(c => {
            let debt = Number(String(c[resolveKey(c, ['tổng nợ thực tế', 'còn nợ'], 'Tổng Nợ Thực Tế')]||0).replace(/[^0-9\-]/g,""));
            if(debt > 0) totalDebt += debt;
        });
    }

    let filteredOrds = ALL_ORDERS.filter(o => {
        let keyTime = getKeyByKeyword(o, 'thời gian') || 'Thời Gian';
        let dt = parseDateString(o[keyTime]);
        return dt >= startDate && dt <= endDate;
    });

    filteredOrds.forEach(o => {
        let keySt = getKeyByKeyword(o, 'trạng thái') || 'Trạng Thái';
        let st = String(o[keySt] || '').trim();
        
        let keyTotal = getKeyByKeyword(o, 'thành tiền') || getKeyByKeyword(o, 'tổng tiền') || 'Tổng Tiền';
        let keySP = getKeyByKeyword(o, 'tổng sp') || 'Tổng SP';
        let keyJSON = getKeyByKeyword(o, 'json') || 'Chi Tiết JSON';
        let keyNo = getKeyByKeyword(o, 'còn nợ') || 'Còn Nợ';

        if (st === 'Đã giao') {
            rev += Number(String(o[keyTotal]||0).replace(/[^0-9\-]/g,""));
            orderCount++;
            itemsCount += Number(o[keySP] || 0);

            if (o[keyJSON]) {
                try {
                    let items = JSON.parse(o[keyJSON]);
                    items.forEach(i => { cost += (Number(i.giaGoc) || 0) * (Number(i.soLuong) || 0); });
                } catch(e) {}
            }
        } 
        else if (st === 'Đang giao') {
            codTotal += Number(String(o[keyNo]||o[keyTotal]||0).replace(/[^0-9\-]/g,""));
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
    
    // GẮN TỔNG CÔNG NỢ VÀO GIAO DIỆN
    let elDebt = document.getElementById('dashTotalDebt'); 
    if(elDebt) {
        elDebt.innerText = formatMoney(totalDebt);
        elDebt.style.color = '#ef4444';
    }

    renderChart(filteredOrds, filter);
    renderTopLists(filteredOrds);
}

function renderChart(ords, filter) {
    let ctx = document.getElementById('revenueChart'); if(!ctx) return;
    if(myChart) myChart.destroy();
    
    let dates = {};
    let now = new Date();
    
    // TẠO THÙNG CHỨA RỖNG ĐỂ BIỂU ĐỒ KHÔNG BỊ ĐỨT QUÃNG
    if (filter === '7days') {
        for(let i = 6; i >= 0; i--) {
            let tempD = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            let label = `${String(tempD.getDate()).padStart(2,'0')}/${String(tempD.getMonth()+1).padStart(2,'0')}`;
            dates[label] = { rev: 0, sortVal: tempD.getTime() };
        }
    } else if (filter === 'month' || filter === 'lastmonth') {
        let mTarget = filter === 'month' ? now.getMonth() : now.getMonth() - 1;
        let yTarget = now.getFullYear();
        if(mTarget < 0) { mTarget = 11; yTarget--; }
        let daysInMonth = new Date(yTarget, mTarget + 1, 0).getDate();
        for(let i = 1; i <= daysInMonth; i++) {
            let label = `${String(i).padStart(2,'0')}/${String(mTarget+1).padStart(2,'0')}`;
            dates[label] = { rev: 0, sortVal: new Date(yTarget, mTarget, i).getTime() };
        }
    }

    ords.forEach(o => {
        let keySt = getKeyByKeyword(o, 'trạng thái') || 'Trạng Thái';
        let st = String(o[keySt] || '').trim();
        let keyTime = getKeyByKeyword(o, 'thời gian') || 'Thời Gian';
        let keyTotal = getKeyByKeyword(o, 'thành tiền') || getKeyByKeyword(o, 'tổng tiền') || 'Tổng Tiền';

        if(st === 'Đã giao') {
            let dt = parseDateString(o[keyTime]);
            let label = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`;
            
            if(!dates[label]) dates[label] = { rev: 0, sortVal: dt.getTime() };
            dates[label].rev += Number(String(o[keyTotal]||0).replace(/[^0-9\-]/g,""));
        }
    });

    let lbls = [];
    let dataPts = [];

    if(filter === 'today' || filter === 'yesterday') {
        lbls = []; let hourly = Array(24).fill(0);
        ords.forEach(o => {
            let keySt = getKeyByKeyword(o, 'trạng thái') || 'Trạng Thái';
            let st = String(o[keySt] || '').trim();
            let keyTime = getKeyByKeyword(o, 'thời gian') || 'Thời Gian';
            let keyTotal = getKeyByKeyword(o, 'thành tiền') || getKeyByKeyword(o, 'tổng tiền') || 'Tổng Tiền';

            if(st === 'Đã giao') {
                let dt = parseDateString(o[keyTime]);
                hourly[dt.getHours()] += Number(String(o[keyTotal]||0).replace(/[^0-9\-]/g,""));
            }
        });
        lbls = hourly.map((_, i) => String(i).padStart(2,'0') + ":00"); 
        dataPts = hourly; 
    } else {
        // Sắp xếp theo thời gian thực (sortVal) thay vì xếp theo bảng chữ cái
        let sortedKeys = Object.keys(dates).sort((a,b) => dates[a].sortVal - dates[b].sortVal);
        lbls = sortedKeys;
        dataPts = sortedKeys.map(k => dates[k].rev);
    }

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: lbls,
            datasets: [{ 
                label: 'Doanh thu (VNĐ)', 
                data: dataPts, 
                backgroundColor: 'rgba(59, 130, 246, 0.8)', 
                borderColor: '#2563eb', 
                borderWidth: 1, 
                borderRadius: 4 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { y: { beginAtZero: true, ticks: { callback: function(val) { return formatMoney(val).replace(' đ',''); } } } } 
        }
    });
}

function renderTopLists(ords) {
    let topP = document.getElementById('topProductsTable');
    let topC = document.getElementById('topCustomersTable');
    if(!topP || !topC) return;

    let pCount = {}; let cCount = {};
    ords.forEach(o => {
        let keySt = getKeyByKeyword(o, 'trạng thái') || 'Trạng Thái';
        let st = String(o[keySt] || '').trim();

        if(st !== 'Đã hủy' && st !== 'Nháp' && st !== 'Đã hoàn trả') {
            let keyCusName = getKeyByKeyword(o, 'tên khách') || getKeyByKeyword(o, 'khách hàng');
            let keyPhone = getKeyByKeyword(o, 'sdt') || getKeyByKeyword(o, 'điện thoại');
            
            let cName = (keyCusName && o[keyCusName]) ? o[keyCusName] : ((keyPhone && o[keyPhone]) ? o[keyPhone] : 'Khách lẻ');
            if(String(cName).trim() === '') cName = 'Khách lẻ';

            let keyTotal = getKeyByKeyword(o, 'thành tiền') || getKeyByKeyword(o, 'tổng tiền') || 'Tổng Tiền';
            
            if(!cCount[cName]) cCount[cName] = 0;
            cCount[cName] += Number(String(o[keyTotal]||0).replace(/[^0-9\-]/g,""));

            let keyJSON = getKeyByKeyword(o, 'json') || 'Chi Tiết JSON';
            if(o[keyJSON]) {
                try {
                    JSON.parse(String(o[keyJSON])).forEach(i => {
                        let tenSP = i.tenSP || 'SP Không tên';
                        if(!pCount[tenSP]) pCount[tenSP] = 0;
                        pCount[tenSP] += Number(i.soLuong);
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