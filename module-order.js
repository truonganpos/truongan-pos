// HÀM TẠO ĐƠN CHUẨN 100% CẤU TRÚC DÀI
function handleAddOrder(orderStatus = 'Chờ xử lý') {
    if(currentOrderItems.length === 0) return alert("Đơn hàng chưa có sản phẩm nào!");
    
    let nEl = document.getElementById("cName"); let cName = nEl ? nEl.value : ''; 
    let pEl = document.getElementById("cPhone"); let cPhoneClean = cleanPhone(pEl ? pEl.value : '');
    
    if(orderStatus !== 'Nháp' && !cName) return alert("Vui lòng điền Tên khách hàng!");

    let dEl = document.getElementById("cDiscount"); let discountPct = dEl ? (Number(dEl.value) || 0) : 0;
    let paidEl = document.getElementById("cPaid"); let paid = paidEl ? (Number(paidEl.value) || 0) : 0;
    let odEl = document.getElementById("cOldDebt"); let oldDebt = odEl ? (Number(odEl.value) || 0) : 0;
    let sfEl = document.getElementById("cShippingFee"); let shipFee = sfEl ? (Number(sfEl.value) || 0) : 0;
    
    let carrEl = document.getElementById("cShippingCarrier"); let cCodeEl = document.getElementById("cShippingCode");
    let carr = carrEl ? carrEl.value : ''; let cCode = cCodeEl ? cCodeEl.value.trim() : '';
    let shipInfo = ''; 
    if (carr && cCode) { shipInfo = `${carr} - ${cCode}`; } 
    else if (carr) { shipInfo = carr; } 
    else if (cCode) { shipInfo = cCode; }

    let rawTotal = currentOrderItems.reduce((sum, item) => sum + item.thanhTien, 0); 
    let totalItems = currentOrderItems.reduce((sum, item) => sum + Number(item.soLuong), 0);
    let finalTotal = discountPct > 0 ? smartRound(rawTotal * (1 - discountPct/100)) : rawTotal; 
    finalTotal += shipFee;
    let tongCong = finalTotal + oldDebt; 
    let debt = tongCong - paid;

    let mockId = (orderStatus === 'Nháp' ? "NHAP_" : "DH_") + Date.now().toString().slice(-5); 
    let createTime = new Date().toLocaleString('vi-VN'); 
    let aEl = document.getElementById("cAddress"); 
    let noEl = document.getElementById("cNote");
    let selT = document.getElementById('cCustomerType'); 
    let cusType = selT ? selT.value : 'Khách Lẻ'; 
    let loaiDon = "APP - " + cusType;

    // ĐÃ FIX: Dùng tên cột dài như mong muốn
    let newOrder = { 
        "Mã Đơn": mockId, 
        "Thời Gian": createTime, 
        "Tên Khách Hàng": cName || 'Đơn Nháp', 
        "SDT": cPhoneClean, 
        "Địa Chỉ": aEl ? aEl.value : '', 
        "Ghi Chú": noEl ? noEl.value : '', 
        "Tổng SP": totalItems, 
        "Tổng Tiền": rawTotal, 
        "Chiết Khấu %": discountPct, 
        "Thành Tiền Sau Chiết Khấu": finalTotal, 
        "Chi Tiết JSON": JSON.stringify(currentOrderItems), 
        "Trạng Thái": orderStatus, 
        "Khách Thanh Toán": paid, 
        "Còn Nợ": debt, 
        "Loại Đơn": loaiDon,
        "Phí Ship": shipFee, 
        "Thông tin Giao hàng": shipInfo
    };

    ALL_ORDERS.unshift(newOrder); 
    localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS));
    
    if(orderStatus !== 'Nháp') {
        currentOrderItems.forEach(item => { 
            let p = ALL_PRODUCTS.find(x => x['Mã SP'] == item.maSP); 
            if(p) { 
                let keyDangDat = resolveKey(p, ['đang đặt'], 'Đang đặt'); 
                p[keyDangDat] = (Number(p[keyDangDat]) || 0) + item.soLuong; 
                addQueueItem('updateProduct', p); 
            } 
        });
        localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS));
        
        if (cPhoneClean) {
            let cusIdx = ALL_CUSTOMERS.findIndex(c => cleanPhone(c['Điện thoại']) === cPhoneClean);
            if(cusIdx === -1) { 
                let cus = { 
                    "Mã khách hàng": generateCustomerId(), 
                    "Tên KH": cName, // Giữ nguyên Tên KH cho tab khách hàng theo ảnh 1
                    "Điện thoại": cPhoneClean, 
                    "Địa Chỉ": aEl ? aEl.value : '', 
                    "Nhóm KH": cusType, 
                    "Nợ Đầu Kỳ": 0, 
                    "Tổng Nợ Thực Tế": 0, 
                    "Đã Thu Nợ": 0, 
                    "Tổng mua": 0, 
                    "Tổng đơn hàng": 0, 
                    "Link FB": "" 
                };
                ALL_CUSTOMERS.push(cus); 
                addQueueItem('updateCustomer', cus);
            } else {
                let cus = ALL_CUSTOMERS[cusIdx]; let changed = false;
                if(!cus['Tên KH'] && cName) { cus['Tên KH'] = cName; changed = true; }
                if(!cus['Địa Chỉ'] && aEl.value) { cus['Địa Chỉ'] = aEl.value; changed = true; }
                if(cus['Nhóm KH'] !== cusType) { cus['Nhóm KH'] = cusType; changed = true; }
                if(changed) addQueueItem('updateCustomer', cus);
            }
            localStorage.setItem('ALL_CUSTOMERS', JSON.stringify(ALL_CUSTOMERS));
        }
    }
    
    addQueueItem('addOrder', newOrder); 
    if (cPhoneClean && orderStatus !== 'Nháp') syncCustomerStatsToSheet(cPhoneClean);
    
    localStorage.removeItem('draftOrderData'); 
    if(nEl) nEl.value = ''; if(pEl) pEl.value = ''; if(aEl) aEl.value = ''; if(noEl) noEl.value = ''; 
    if(dEl) dEl.value = ''; if(paidEl) paidEl.value = ''; if(odEl) odEl.value = 0; if(sfEl) sfEl.value = ''; 
    if(carrEl) carrEl.value = ''; if(cCodeEl) cCodeEl.value = '';
    
    let sumEl = document.getElementById("addOrderSummary"); if(sumEl) sumEl.style.display = 'none';
    currentOrderItems = []; renderAddFormUI(); 
    if(currentPage === 'dashboard') renderAdvancedDashboard(); 
    if(currentPage === 'orders') renderOrdersData();
}

// HÀM LƯU SỬA ĐƠN CHUẨN 100% CẤU TRÚC DÀI
function saveEditOrder() {
    if(currentOrderItems.length === 0) return alert("Đơn hàng không thể rỗng!");
    let o = ALL_ORDERS.find(x => String(x[resolveKey(x, ['mã đơn'], 'Mã Đơn')]) === String(editingOrderId)); if(!o) return;

    if(String(o['Trạng Thái']).trim() !== 'Nháp') {
        let oldItems = []; try { oldItems = JSON.parse(String(o['Chi Tiết JSON'] || o['json'] || '[]'))); } catch(e){}
        oldItems.forEach(item => { let p = ALL_PRODUCTS.find(x => x['Mã SP'] == item.maSP); if(p) { let keyDangDat = resolveKey(p, ['đang đặt'], 'Đang đặt'); p[keyDangDat] = (Number(p[keyDangDat]) || 0) - item.soLuong; if(p[keyDangDat] < 0) p[keyDangDat] = 0; } });
        currentOrderItems.forEach(item => { let p = ALL_PRODUCTS.find(x => x['Mã SP'] == item.maSP); if(p) { let keyDangDat = resolveKey(p, ['đang đặt'], 'Đang đặt'); p[keyDangDat] = (Number(p[keyDangDat]) || 0) + item.soLuong; addQueueItem('updateProduct', p); } });
        localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS));
    }

    let nEl = document.getElementById("eoName"); 
    let pEl = document.getElementById("eoPhone"); 
    let aEl = document.getElementById("eoAddress"); 
    let noEl = document.getElementById("eoNote"); 
    let dEl = document.getElementById("eoDiscount"); let disc = dEl ? (Number(dEl.value) || 0) : 0; 
    let paEl = document.getElementById("eoPaid"); let paid = paEl ? (Number(paEl.value) || 0) : 0;
    let odEl = document.getElementById("eoOldDebt"); let oldDebtRecord = odEl ? (Number(odEl.value) || 0) : 0;
    let ctSel = document.getElementById('eoCustomerType'); let cusType = ctSel ? ctSel.value : 'Khách Lẻ';
    let shipFeeEl = document.getElementById("eoShippingFee"); let shipFee = shipFeeEl ? (Number(shipFeeEl.value) || 0) : 0;
    let carrEl = document.getElementById("eoShippingCarrier"); let cCodeEl = document.getElementById("eoShippingCode");
    let carr = carrEl ? carrEl.value : ''; let cCode = cCodeEl ? cCodeEl.value.trim() : '';
    let shipInfo = ''; if (carr && cCode) { shipInfo = `${carr} - ${cCode}`; } else if (carr) { shipInfo = carr; } else if (cCode) { shipInfo = cCode; }

    let rawTotal = currentOrderItems.reduce((sum, item) => sum + item.thanhTien, 0); 
    let totalItems = currentOrderItems.reduce((sum, item) => sum + Number(item.soLuong), 0);
    let finalTotal = disc > 0 ? smartRound(rawTotal * (1 - disc/100)) : rawTotal; 
    finalTotal += shipFee; 
    let tongCong = finalTotal + oldDebtRecord; 
    let newDebt = tongCong - paid;

    // ĐÃ FIX: Ghi trực tiếp vào tên dài
    if(nEl) o['Tên Khách Hàng'] = nEl.value; 
    if(pEl) o['SDT'] = cleanPhone(pEl.value); 
    if(aEl) o['Địa Chỉ'] = aEl.value; 

    o['Ghi Chú'] = noEl ? noEl.value : '';
    o['Loại Đơn'] = "APP - " + cusType; 
    o['Chiết Khấu %'] = disc; 
    o['Tổng SP'] = totalItems; 
    o['Tổng Tiền'] = rawTotal; 
    o['Thành Tiền Sau Chiết Khấu'] = finalTotal; 
    o['Phí Ship'] = shipFee; 
    o['Thông tin Giao hàng'] = shipInfo;
    o['Khách Thanh Toán'] = paid; 
    o['Còn Nợ'] = newDebt; 
    o['Chi Tiết JSON'] = JSON.stringify(currentOrderItems);

    if(String(o['Trạng Thái']).trim() === 'Nháp') o['Trạng Thái'] = 'Chờ xử lý';

    let cPhoneClean = cleanPhone(pEl ? pEl.value : '');
    if (cPhoneClean) {
       let cusIdx = ALL_CUSTOMERS.findIndex(c => cleanPhone(c['Điện thoại']) === cPhoneClean);

       if(cusIdx === -1) { 
           let cus = { 
               "Mã khách hàng": generateCustomerId(), 
               "Tên KH": nEl.value, 
               "Điện thoại": cPhoneClean, 
               "Địa Chỉ": aEl.value, 
               "Nhóm KH": cusType, 
               "Nợ Đầu Kỳ": 0, 
               "Tổng Nợ Thực Tế": 0, 
               "Đã Thu Nợ": 0, 
               "Tổng mua": 0, 
               "Tổng đơn hàng": 0, 
               "Link FB": "" 
           };
           ALL_CUSTOMERS.push(cus); addQueueItem('updateCustomer', cus);
       } else {
           let cus = ALL_CUSTOMERS[cusIdx]; let changed = false;
           if(!cus['Tên KH'] && nEl.value) { cus['Tên KH'] = nEl.value; changed = true; }
           if(!cus['Địa Chỉ'] && aEl.value) { cus['Địa Chỉ'] = aEl.value; changed = true; }
           if(cus['Nhóm KH'] !== cusType) { cus['Nhóm KH'] = cusType; changed = true; }
           if(changed) addQueueItem('updateCustomer', cus);
       }
       localStorage.setItem('ALL_CUSTOMERS', JSON.stringify(ALL_CUSTOMERS));
    }

    localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS)); 
    addQueueItem('updateOrder', o); 
    if(cPhoneClean) syncCustomerStatsToSheet(cPhoneClean);
    
    closeModal('editOrderModal'); 
    if(currentPage === 'orders') renderOrdersData();
    if(currentPage === 'add') renderRecentDrafts();
}
