let isOrderProcessing = false;

function toggleAllOrderChecks(el) { 
    document.querySelectorAll('.chk-order-box').forEach(c => c.checked = el.checked); 
}

function filterOrdersByCustomer(phone) { 
    let searchInput = document.getElementById('searchOrders'); 
    if(searchInput) searchInput.value = phone; 
    renderOrdersData(true); 
}

function renderOrdersData(resetLimit = false) {
    try {
        if(resetLimit) limitOrd = 50;
        let sEl = document.getElementById("searchOrders"); 
        let s = sEl ? String(sEl.value).toLowerCase().trim() : '';
        let sfEl = document.getElementById("orderStatusFilter"); 
        let statusFilter = sfEl ? sfEl.value : "ALL";

        let isAdmin = false;
        try { isAdmin = (typeof currentUser !== 'undefined' && currentUser && currentUser.role.toLowerCase() === 'admin'); } catch(e){}
        
        let filtered = ALL_ORDERS.filter(o => {
            let matchSearch = true;
            if(s) {
                let keyCusName = resolveKey(o, ['tên kh', 'khách hàng'], 'Tên Khách Hàng');
                let name = String(o[keyCusName] || '').toLowerCase(); 
                let keySDT = resolveKey(o, ['sdt', 'điện thoại'], 'SDT');
                let phone = cleanPhone(o[keySDT]); 
                let orderId = String(o[resolveKey(o, ['mã đơn'], 'Mã Đơn')] || '').toLowerCase();
                matchSearch = name.includes(s) || phone.includes(s) || orderId.includes(s);
            }
            let keySt = resolveKey(o, ['trạng thái'], 'Trạng Thái');
            let matchStatus = statusFilter !== "ALL" ? String(o[keySt]).trim() === statusFilter : true;
            return matchSearch && matchStatus;
        });

        filtered.sort((a, b) => { 
            let kTimeA = resolveKey(a, ['thời gian'], 'Thời Gian'); 
            let kTimeB = resolveKey(b, ['thời gian'], 'Thời Gian'); 
            return parseDateString(b[kTimeB]).getTime() - parseDateString(a[kTimeA]).getTime(); 
        });
        
        let countEl = document.getElementById('orderCountDisplay'); 
        if (countEl) countEl.innerText = filtered.length;
        
        let sliced = filtered.slice(0, limitOrd);
        
        let html = viewMode === 'table' ? `<div class="table-responsive"><table>
            <thead>
                <tr>
                    <th class="col-check" style="width:30px;"><input type="checkbox" onclick="toggleAllOrderChecks(this)"/></th>
                    <th style="min-width: 140px;">Mã Đơn & Trạng Thái</th>
                    <th style="min-width: 200px;">Khách Hàng & Giao Hàng</th>
                    <th class="text-right" style="min-width: 130px;">Tài Chính</th>
                    <th class="text-right" style="min-width: 110px;">Thanh Toán</th>
                    <th class="col-action text-center" style="min-width:180px;">Tác vụ</th>
                </tr>
            </thead><tbody>` : `<div class="data-grid">`;

        sliced.forEach(o => {
          try {
              let keySt = resolveKey(o, ['trạng thái'], 'Trạng Thái');
              let status = String(o[keySt]).trim(); 
              let isDelivered = status === 'Đã giao' || status === 'Đã hoàn trả';
              let isDraft = status === 'Nháp'; 
              let isShipping = status === 'Đang giao'; 
              let isPending = status === 'Chờ xử lý';

              let keySDT = resolveKey(o, ['sdt', 'điện thoại'], 'SDT');
              let keyCusName = resolveKey(o, ['tên kh', 'khách hàng'], 'Tên Khách Hàng');
              let keyAddr = resolveKey(o, ['địa chỉ'], 'Địa Chỉ');
              let keyShipInfo = resolveKey(o, ['thông tin giao hàng'], 'Thông tin Giao hàng');
              let keyTotal = resolveKey(o, ['tổng tiền'], 'Tổng Tiền');
              let keyFinal = resolveKey(o, ['tt sau ck', 'thành tiền'], 'Thành Tiền Sau Chiết Khấu');
              let keyShipFee = resolveKey(o, ['phí ship'], 'Phí Ship');
              let keyPaid = resolveKey(o, ['khách thanh toán', 'thanh toán'], 'Khách Thanh Toán');
              let keyDebt = resolveKey(o, ['còn nợ'], 'Còn Nợ');
              let keyId = resolveKey(o, ['mã đơn'], 'Mã Đơn');

              let cName = o[keyCusName] || 'Khách lẻ'; 
              let sdtTrim = cleanPhone(o[keySDT]); 
              let address = o[keyAddr] || '';
              let isVIP = (sdtTrim.length >= 8 && vipPhones.has(sdtTrim)); 
              let vipBadge = isVIP ? `<span class="vip-badge">🌟 VIP</span>` : ''; 
              let maDon = String(o[keyId]||'').replace(/'/g, "\\'");

              let shipInfo = String(o[keyShipInfo] || '').trim();
              let isAtCounter = (shipInfo === '' || shipInfo.toLowerCase().includes('quầy'));

              let actionBtns = '';
              let inBtn = `<button class="action-btn gray" style="padding:6px; flex:1;" title="In" onclick="printOrder('${maDon}')">🖨️</button>`;
              
              if(isAdmin || isDraft || isPending) {
                  let editBtn = `<button class="action-btn orange" style="padding:6px; flex:1;" onclick="openEditOrderModal('${maDon}')">✏️</button>`;
                  
                  if(isDraft) { 
                      actionBtns += editBtn; 
                  } else if (isPending) {
                      actionBtns += editBtn;
                      if (isAtCounter) {
                          actionBtns += `<button class="action-btn orange" style="padding:6px; flex:1.5;" onclick="markDelivered('${maDon}')" title="Ghi Nợ">✔️ Giao Nợ</button>`;
                          actionBtns += `<button class="action-btn green" style="padding:6px; flex:1.5;" onclick="markCollectedCOD('${maDon}')" title="Thu Đủ 100%">✔️ Thu Đủ</button>`;
                      } else { 
                          actionBtns += `<button class="action-btn blue" style="padding:6px; flex:1.5;" onclick="markShipping('${maDon}')" title="Gửi hàng đi">🚚 Gửi đi</button>`; 
                      }
                  } else if (isShipping) { 
                      actionBtns += editBtn; 
                      actionBtns += `<button class="action-btn green" style="padding:6px; flex:1.5;" onclick="markCollectedCOD('${maDon}')" title="Thu tiền">💰 Thu COD</button>`; 
                  } else if (isDelivered) { 
                      actionBtns += editBtn; 
                  }
              } else {
                  actionBtns += `<button class="action-btn gray" style="padding:6px; flex:1;" disabled>🔒 Khóa</button>`;
                  if(isShipping) {
                      actionBtns += `<button class="action-btn green" style="padding:6px; flex:1.5;" onclick="markCollectedCOD('${maDon}')" title="Thu tiền">💰 Thu COD</button>`;
                  }
              }
              
              actionBtns = inBtn + actionBtns;
              if(!isDelivered && isAdmin) { 
                  actionBtns += `<button class="action-btn red" style="padding:6px; flex:1;" onclick="deleteOrder('${maDon}')">🗑️</button>`; 
              }

              let rawTotalVal = Number(String(o[keyTotal]||0).replace(/[^0-9\-]/g,""));
              let finalTotalVal = Number(String(o[keyFinal]||o[keyTotal]||0).replace(/[^0-9\-]/g,""));
              let paidVal = Number(String(o[keyPaid]||0).replace(/[^0-9\-]/g,""));
              let debtVal = Number(String(o[keyDebt]||0).replace(/[^0-9\-]/g,""));
              let shipFeeVal = Number(String(o[keyShipFee]||0).replace(/[^0-9\-]/g,""));

              let bg = isDelivered ? '#d1fae5' : (isShipping ? '#e0f2fe' : (isDraft ? '#fef3c7' : '#fce7f3'));
              let cl = isDelivered ? '#10b981' : (isShipping ? '#0284c7' : (isDraft ? '#f59e0b' : '#be185d'));
              let badgeHtml = `<span style="background:${bg}; color:${cl}; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; display:inline-block; margin-top:4px;">${status}</span>`;

              if(viewMode === 'table') {
                 html += `<tr>
                     <td class="col-check"><input type="checkbox" class="chk-order-box" value="${maDon}"/></td>
                     <td><span onclick="openOrderModal('${maDon}')" style="color:#3b82f6; font-weight:bold; cursor:pointer; text-decoration:underline; font-size:14px;">${o[keyId]}</span><br>${badgeHtml}</td>
                     <td>
                         <span onclick="filterOrdersByCustomer('${sdtTrim}')" style="color:inherit; font-weight:bold; cursor:pointer; font-size:14px;" title="Lọc đơn khách này">${cName}</span> ${vipBadge}<br>
                         <small style="color:#64748b; font-size:12px;">📞 ${sdtTrim||'---'}</small><br>
                         <small style="color:#64748b; font-size:12px; font-style:italic;" title="${address}">📍 ${address ? (address.length>25?address.substring(0,25)+'...':address) : (shipInfo ? 'Gửi xe: '+shipInfo : 'Giao tại quầy')}</small>
                     </td>
                     <td class="text-right">
                         <b class="price-text" style="color:#10b981; font-size:15px;">${formatMoney(finalTotalVal)}</b><br>
                         <small style="color:#64748b; font-size:11px;" title="Tổng tiền hàng">Gốc: ${formatMoney(rawTotalVal)}</small><br>
                         ${shipFeeVal > 0 ? `<small style="color:#f59e0b; font-size:11px;">Ship: +${formatMoney(shipFeeVal)}</small>` : ''}
                     </td>
                     <td class="text-right">
                         <span style="color:#10b981; font-weight:bold; font-size:13px;" title="Đã thanh toán">${formatMoney(paidVal)}</span><br>
                         <span style="color:#ef4444; font-weight:bold; font-size:13px;" title="Còn nợ">${formatMoney(debtVal)}</span>
                     </td>
                     <td class="col-action actions">${actionBtns}</td>
                 </tr>`;
              } else {
                 html += `<div class="card"><div class="card-header"><span onclick="openOrderModal('${maDon}')" style="color:#3b82f6; font-weight:bold; cursor:pointer; text-decoration:underline;">${o[keyId]}</span> ${badgeHtml}</div>`;
                 html += `<div class="card-row"><span class="lbl">Khách hàng:</span> <span class="val"><b onclick="filterOrdersByCustomer('${sdtTrim}')" style="color:#3b82f6; cursor:pointer;">${cName}</b> ${vipBadge}</span></div>`;
                 html += `<div class="card-row"><span class="lbl">Liên hệ:</span> <span class="val">${sdtTrim||'---'}</span></div>`;
                 html += `<div class="card-row"><span class="lbl">Thành tiền:</span> <span class="val"><b class="price-text" style="color:#10b981; font-size:16px;">${formatMoney(finalTotalVal)}</b></span></div>`;
                 html += `<div class="card-row"><span class="lbl">Còn nợ:</span> <span class="val"><b style="color:#ef4444;">${formatMoney(debtVal)}</b></span></div>`;
                 html += `<div class="btn-group" style="display:flex; gap:5px; margin-top:10px;">${actionBtns}</div></div>`;
              }
          } catch(ex) {}
        });
        
        if(viewMode === 'table') html += `</tbody></table></div>`; else html += `</div>`;
        if(filtered.length > limitOrd) { html += `<div style="text-align:center; padding:15px; clear:both;"><button class="action-btn blue" onclick="loadMore('ord')">⬇️ Xem thêm dữ liệu</button></div>`; }
        let ol = document.getElementById("ordersList"); if(ol) ol.innerHTML = html;
    } catch(err) {}
}

function markShipping(id) { 
    if(isOrderProcessing) return; isOrderProcessing = true; 
    let o = ALL_ORDERS.find(x => String(x[resolveKey(x, ['mã đơn'], 'Mã Đơn')]) === String(id)); 
    if(o) { 
        let keySt = resolveKey(o, ['trạng thái'], 'Trạng Thái'); o[keySt] = 'Đang giao'; 
        localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS)); 
        addQueueItem('updateOrder', o); 
        if(currentPage === 'orders') renderOrdersData(); if(currentPage === 'add') renderRecentDrafts(); 
    } 
    setTimeout(() => { isOrderProcessing = false; }, 500); 
}

function markCollectedCOD(id) {
    if(isOrderProcessing) return; isOrderProcessing = true; 
    let o = ALL_ORDERS.find(x => String(x[resolveKey(x, ['mã đơn'], 'Mã Đơn')]) === String(id));
    if(o) {
        let keyFinal = resolveKey(o, ['tt sau ck', 'thành tiền'], 'Thành Tiền Sau Chiết Khấu'); 
        let keyPaid = resolveKey(o, ['khách thanh toán', 'thanh toán'], 'Khách Thanh Toán'); 
        let keyDebt = resolveKey(o, ['còn nợ'], 'Còn Nợ'); 
        let keySt = resolveKey(o, ['trạng thái'], 'Trạng Thái');
        let keyJSON = resolveKey(o, ['json'], 'Chi Tiết JSON');
        let keySDT = resolveKey(o, ['sdt', 'điện thoại'], 'SDT');
        
        let finalTotal = Number(String(o[keyFinal]||0).replace(/[^0-9\-]/g,"")); 
        o[keyPaid] = finalTotal; o[keyDebt] = 0; o[keySt] = 'Đã giao';
        
        if(o[keyJSON]) { 
            try { 
                JSON.parse(String(o[keyJSON])).forEach(item => { 
                    let p = ALL_PRODUCTS.find(x => x[resolveKey(x, ['mã sp'], 'Mã SP')] == item.maSP); 
                    if(p) { 
                        let keyTonKho = resolveKey(p, ['tồn kho'], 'Tồn kho'); let keyDangDat = resolveKey(p, ['đang đặt'], 'Đang đặt'); 
                        p[keyTonKho] = (Number(p[keyTonKho]) || 0) - Number(item.soLuong); 
                        p[keyDangDat] = (Number(p[keyDangDat]) || 0) - Number(item.soLuong); 
                        if(p[keyDangDat] < 0) p[keyDangDat] = 0; addQueueItem('updateProduct', p); 
                    } 
                }); 
                localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS)); 
            } catch(e) {} 
        }
        
        localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS)); addQueueItem('updateOrder', o); 
        let cPhoneClean = cleanPhone(o[keySDT]); if(cPhoneClean) syncCustomerStatsToSheet(cPhoneClean);
        if(currentPage === 'orders') renderOrdersData(); if(currentPage === 'add') renderRecentDrafts(); 
        alert("✅ Giao dịch hoàn tất! Đã thu đủ tiền.");
    } 
    setTimeout(() => { isOrderProcessing = false; }, 500);
}

function markDelivered(id) { 
   if(isOrderProcessing) return; isOrderProcessing = true; 
   let o = ALL_ORDERS.find(x => String(x[resolveKey(x, ['mã đơn'], 'Mã Đơn')]) === String(id)); 
   if(o) { 
       let keySt = resolveKey(o, ['trạng thái'], 'Trạng Thái'); let keyJSON = resolveKey(o, ['json'], 'Chi Tiết JSON');
       o[keySt] = 'Đã giao'; 
       if(o[keyJSON]) { 
           try { 
               JSON.parse(String(o[keyJSON])).forEach(item => { 
                   let p = ALL_PRODUCTS.find(x => x[resolveKey(x, ['mã sp'], 'Mã SP')] == item.maSP); 
                   if(p) { 
                       let keyTonKho = resolveKey(p, ['tồn kho'], 'Tồn kho'); let keyDangDat = resolveKey(p, ['đang đặt'], 'Đang đặt'); 
                       p[keyTonKho] = (Number(p[keyTonKho]) || 0) - Number(item.soLuong); 
                       p[keyDangDat] = (Number(p[keyDangDat]) || 0) - Number(item.soLuong); 
                       if(p[keyDangDat] < 0) p[keyDangDat] = 0; addQueueItem('updateProduct', p); 
                   } 
               }); 
               localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS)); 
           } catch(e) {} 
       }
       localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS)); addQueueItem('updateOrder', o); 
       if(currentPage === 'orders') renderOrdersData(); if(currentPage === 'add') renderRecentDrafts(); 
   } 
   setTimeout(() => { isOrderProcessing = false; }, 500);
}

function deleteOrder(id) {
    let o = ALL_ORDERS.find(x => String(x[resolveKey(x, ['mã đơn'], 'Mã Đơn')]) === String(id)); if(!o) return; 
    if(!confirm("Xóa vĩnh viễn đơn hàng #" + id + "?")) return;
    
    let keySt = resolveKey(o, ['trạng thái'], 'Trạng Thái'); let keyJSON = resolveKey(o, ['json'], 'Chi Tiết JSON'); 
    let keySDT = resolveKey(o, ['sdt', 'điện thoại'], 'SDT'); let keyDebt = resolveKey(o, ['còn nợ'], 'Còn Nợ');
    
    if(String(o[keySt]).trim() !== 'Đã giao' && String(o[keySt]).trim() !== 'Đã hoàn trả' && String(o[keySt]).trim() !== 'Nháp' && o[keyJSON]) { 
        try { 
            JSON.parse(String(o[keyJSON])).forEach(item => { 
                let p = ALL_PRODUCTS.find(x => x[resolveKey(x, ['mã sp'], 'Mã SP')] == item.maSP); 
                if(p) { 
                    let keyDangDat = resolveKey(p, ['đang đặt'], 'Đang đặt'); 
                    p[keyDangDat] = (Number(p[keyDangDat]) || 0) - Number(item.soLuong); 
                    if(p[keyDangDat] < 0) p[keyDangDat] = 0; addQueueItem('updateProduct', p); 
                } 
            }); 
            localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS)); 
        } catch(e){} 
    }
    
    let debt = Number(o[keyDebt] || 0); let cPhoneClean = cleanPhone(o[keySDT]);
    if(debt > 0 && cPhoneClean) { 
        let cus = ALL_CUSTOMERS.find(c => cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) === cPhoneClean); 
        if(cus) { 
            let stats = calcCustomerStats(cPhoneClean); 
            cus[resolveKey(cus, ['tổng nợ thực tế', 'còn nợ'], 'Tổng Nợ Thực Tế')] = stats.currentDebt - debt; 
            addQueueItem('updateCustomer', cus); localStorage.setItem('ALL_CUSTOMERS', JSON.stringify(ALL_CUSTOMERS)); 
        } 
    }
    
    ALL_ORDERS = ALL_ORDERS.filter(x => String(x[resolveKey(x, ['mã đơn'], 'Mã Đơn')]) !== String(id)); 
    localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS)); addQueueItem('deleteOrder', { id: id });
    if(currentPage === 'orders') renderOrdersData(); if(currentPage === 'add') renderRecentDrafts();
}

function printOrder(id) {
    let o = ALL_ORDERS.find(x => String(x[resolveKey(x, ['mã đơn'], 'Mã Đơn')]) === String(id)); if(!o) return;
    let s = safeParseObj('truongan_settings');
    let sName = s.storeName || 'TRƯỜNG AN STORE';
    let sPhone = s.storePhone ? `SĐT: ${s.storePhone}<br>` : '';
    let sAddr = s.storeAddress ? `ĐC: ${s.storeAddress}<br>` : '';
    let sNote = s.billNote ? String(s.billNote).replace(/\n/g, '<br>') : 'Cảm ơn quý khách!<br>Hẹn gặp lại.';

    let keyCusName = resolveKey(o, ['tên kh', 'khách hàng'], 'Tên Khách Hàng');
    let keySDT = resolveKey(o, ['sdt', 'điện thoại'], 'SDT');
    let keyTotal = resolveKey(o, ['tổng tiền'], 'Tổng Tiền');
    let keyFinal = resolveKey(o, ['tt sau ck', 'thành tiền'], 'Thành Tiền Sau Chiết Khấu');
    let keyShipFee = resolveKey(o, ['phí ship'], 'Phí Ship');
    let keyPaid = resolveKey(o, ['khách thanh toán', 'thanh toán'], 'Khách Thanh Toán');
    let keyCK = resolveKey(o, ['ck %', 'chiết khấu'], 'Chiết Khấu %');
    let keyShipInfo = resolveKey(o, ['thông tin giao hàng'], 'Thông tin Giao hàng');
    let keyJSON = resolveKey(o, ['json'], 'Chi Tiết JSON');
    let keyId = resolveKey(o, ['mã đơn'], 'Mã Đơn');

    let finalTotal = Number(String(o[keyFinal]||o[keyTotal]||0).replace(/[^0-9\-]/g,"")); 
    let chietKhauPct = Number(o[keyCK] || 0); 
    let tongTienHang = Number(String(o[keyTotal]||0).replace(/[^0-9\-]/g,"")); 
    let tienGiam = tongTienHang - finalTotal;
    let paid = Number(String(o[keyPaid]||0).replace(/[^0-9\-]/g,"")); 
    let debtThisOrder = finalTotal - paid;
    let shipFee = Number(o[keyShipFee] || 0); 
    let shipInfo = o[keyShipInfo] || '';
    
    let cOldDebt = 0; let cPhoneClean = cleanPhone(o[keySDT]);
    if(cPhoneClean) { 
        let cus = ALL_CUSTOMERS.find(c => cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) === cPhoneClean); 
        if(cus) { let totalDebtNow = getRealtimeCustomerDebt(cPhoneClean); cOldDebt = totalDebtNow - debtThisOrder; } 
    }

    let printContent = `<div style="font-family: monospace; width: 100%; max-width: 300px; margin: 0 auto; color: #000;">
        <h2 style="text-align: center; margin-bottom: 5px;">${sName}</h2>
        <div style="text-align: center; font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">${sPhone}${sAddr}<b>HÓA ĐƠN BÁN HÀNG</b></div>
        <div style="font-size: 13px; line-height: 1.5;"><b>Mã đơn:</b> #${o[keyId]}<br><b>Khách:</b> ${o[keyCusName] || 'Khách lẻ'}<br><b>SĐT:</b> ${o[keySDT] || ''}</div>
        <div style="border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px;"><b style="font-size: 13px;">SẢN PHẨM:</b><br>`;
    
    if(o[keyJSON]) { 
        try { JSON.parse(String(o[keyJSON])).forEach(i => { printContent += `<div style="display:flex; justify-content:space-between; font-size:13px; margin-top:8px; border-bottom:1px dotted #eee; padding-bottom:5px;"><div style="flex:1; padding-right:5px;"><div>[${i.maSP}] ${i.tenSP}</div><div style="font-size:11px; color:#555;">${formatMoney(i.giaBan)} x ${i.soLuong}</div></div><div style="font-weight:bold; align-self:flex-end;">${formatMoney(i.thanhTien)}</div></div>`; }); } catch(e) {} 
    }

    printContent += `</div><div style="border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; text-align: right; font-size: 14px; line-height: 1.5;">`;
    if(chietKhauPct > 0) { printContent += `Tổng tiền hàng: ${formatMoney(tongTienHang)}<br>Chiết khấu (${chietKhauPct}%): <span style="font-weight:normal;">-${formatMoney(tienGiam)}</span><br>`; }
    if(shipFee > 0) printContent += `Phí vận chuyển: ${formatMoney(shipFee)}<br>`;
    printContent += `<b style="font-size:16px;">Thành tiền đơn này: ${formatMoney(finalTotal)}</b><br>`;
    if(cOldDebt > 0) printContent += `<span style="font-size:13px;">Nợ cũ: ${formatMoney(cOldDebt)}</span><br>`;
    
    let tongPhaiThu = finalTotal + cOldDebt; printContent += `<b style="font-size:18px;">TỔNG PHẢI THU: ${formatMoney(tongPhaiThu)}</b><br>`;
    printContent += `<span style="font-size:13px;">Khách thanh toán: ${formatMoney(paid)}</span><br>`;
    
    let conNo = tongPhaiThu - paid; printContent += `<span style="font-size:13px;">Còn nợ: ${formatMoney(conNo)}</span><br>`;
    if(shipInfo) printContent += `<div style="text-align:left; font-size:12px; margin-top:10px;"><i>Giao qua: ${shipInfo}</i></div>`;
    printContent += `</div>`;

    if (conNo > 0 && s.bankId && s.accNo) {
        let qrUrl = `https://img.vietqr.io/image/${s.bankId.trim()}-${s.accNo.trim()}-compact2.png?amount=${conNo}&addInfo=${o[keyId]}&accountName=${encodeURIComponent(s.accName || '')}`;
        printContent += `<div style="text-align:center; margin-top:15px; border-top:1px dashed #000; padding-top:10px;"><b>MÃ QR THANH TOÁN</b><br><img src="${qrUrl}" style="width:180px; height:180px; margin-top:5px; object-fit:contain;"/><br><span style="font-size:11px;">(Quét bằng App Ngân hàng)</span></div>`;
    }

    printContent += `<div style="text-align: center; font-size: 12px; margin-top: 20px;">${sNote}</div></div>`;
    let printWin = window.open('', '_blank', 'width=400,height=600'); 
    if(printWin){ printWin.document.write('<html><head><title>In Bill</title></head><body>' + printContent + '</body></html>'); printWin.document.close(); printWin.focus(); setTimeout(function() { printWin.print(); printWin.close(); }, 800); }
}

function openOrderModal(id) { 
    let o = ALL_ORDERS.find(x => String(x[resolveKey(x, ['mã đơn'], 'Mã Đơn')]) === String(id)); if(!o) return;

    let keySDT = resolveKey(o, ['sdt', 'điện thoại'], 'SDT');
    let keyCusName = resolveKey(o, ['tên kh', 'khách hàng'], 'Tên Khách Hàng');
    let keyAddr = resolveKey(o, ['địa chỉ'], 'Địa Chỉ');
    let keyShipInfo = resolveKey(o, ['thông tin giao hàng'], 'Thông tin Giao hàng');
    let keySt = resolveKey(o, ['trạng thái'], 'Trạng Thái');
    let keyNote = resolveKey(o, ['ghi chú'], 'Ghi Chú');
    let keyJSON = resolveKey(o, ['json'], 'Chi Tiết JSON');
    let keyId = resolveKey(o, ['mã đơn'], 'Mã Đơn');
    let keyTime = resolveKey(o, ['thời gian'], 'Thời Gian');

    let sdtTrim = cleanPhone(o[keySDT]); let isVIP = (sdtTrim.length >= 8 && vipPhones.has(sdtTrim));
    let statusColor = '#3b82f6';
    if(o[keySt] === 'Đã giao') statusColor = '#10b981'; else if(o[keySt] === 'Nháp') statusColor = '#f59e0b'; else if(o[keySt] === 'Đang giao') statusColor = '#0284c7'; else if(o[keySt] === 'Đã hoàn trả') statusColor = '#ef4444';

    let html = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;"><div><h3 style="margin:0; color:#3b82f6;">${o[keyId]}</h3><span style="font-size:12px; opacity:0.7;">${o[keyTime]}</span></div><div style="background:${statusColor}; color:#fff; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">${o[keySt]}</div></div>`;
    html += `<div class="order-detail-box"><div style="margin-bottom:5px;">👤 <b>Khách hàng:</b> ${o[keyCusName]||'---'} ${isVIP?'<span class="vip-badge">🌟 VIP</span>':''}</div><div style="margin-bottom:5px;">📞 <b>SĐT:</b> ${o[keySDT]||'---'}</div><div>📍 <b>Địa chỉ:</b> ${o[keyAddr]||'---'}</div>`;
    if(o[keyShipInfo]) html += `<div style="margin-top:5px; color:#f59e0b;">🚚 <b>Vận chuyển:</b> ${o[keyShipInfo]}</div>`; html += `</div>`;
    if(o[keyNote]) html += `<div class="order-detail-note"><b>Ghi chú:</b> ${o[keyNote]}</div>`;
    html += `<div style="font-weight:bold; margin-bottom:10px; color:inherit;">📦 Danh sách sản phẩm:</div><div style="max-height:250px; overflow-y:auto; border:1px solid #eee; border-radius:8px; padding:10px; margin-bottom:15px;">`;
    
    let rawTotal = 0;
    if(o[keyJSON]) { try { JSON.parse(String(o[keyJSON])).forEach(i => { rawTotal += i.thanhTien; html += `<div class="order-item-row"><div style="flex:1;"><b>[${i.maSP}] ${i.tenSP}</b> <br/><span style="font-size:12px; color:#64748b;">${formatMoney(i.giaBan)} x ${i.soLuong}</span></div><div style="font-weight:bold; color:#0070f4; display:flex; align-items:center;">${formatMoney(i.thanhTien)}</div></div>`; }); } catch(e) {} }
    
    let keyCK = resolveKey(o, ['ck %', 'chiết khấu'], 'Chiết Khấu %');
    let keyFinal = resolveKey(o, ['tt sau ck', 'thành tiền'], 'Thành Tiền Sau Chiết Khấu');
    let keyTotal = resolveKey(o, ['tổng tiền'], 'Tổng Tiền');
    let keyShipFee = resolveKey(o, ['phí ship'], 'Phí Ship');
    let keyPaid = resolveKey(o, ['khách thanh toán', 'thanh toán'], 'Khách Thanh Toán');
    let keyDebt = resolveKey(o, ['còn nợ'], 'Còn Nợ');

    let chietKhau = Number(o[keyCK]||0); let finalTotal = Number(String(o[keyFinal]||o[keyTotal]||0).replace(/[^0-9\-]/g,"")); let shipFee = Number(o[keyShipFee] || 0);

    html += `</div><div class="order-detail-box"><div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;"><span>Tổng tiền hàng:</span> <b>${formatMoney(rawTotal)}</b></div>`;
    if(chietKhau > 0) { let tienGiam = Math.abs(rawTotal) - Math.abs(finalTotal - shipFee); html += `<div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; color:#10b981;"><span>Được giảm giá (${chietKhau}%):</span> <b>-${formatMoney(tienGiam)}</b></div>`; }
    if(shipFee > 0) { html += `<div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; color:#f59e0b;"><span>Phí vận chuyển:</span> <b>+${formatMoney(shipFee)}</b></div>`; }
    html += `<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #cbd5e1; padding-top:10px; margin-top:5px;"><span style="font-size:15px; font-weight:bold;">THÀNH TIỀN:</span> <span style="font-size:18px; font-weight:bold; color:#d32f2f;">${formatMoney(finalTotal)}</span></div>`;

    let paid = Number(String(o[keyPaid]||0).replace(/[^0-9\-]/g,"")); let debt = Number(String(o[keyDebt]||0).replace(/[^0-9\-]/g,""));
    html += `<div style="display:flex; justify-content:space-between; background:var(--btn-bg, #f0fdf4); border:1px solid #bbf7d0; padding:10px; border-radius:6px; margin-top:10px;"><div style="text-align:center;"><span style="font-size:12px; opacity:0.7;">Đã thanh toán</span><br/><b style="color:#10b981;">${formatMoney(paid)}</b></div><div style="text-align:center;"><span style="font-size:12px; opacity:0.7;">Còn nợ</span><br/><b style="color:#ef4444;">${formatMoney(debt)}</b></div></div></div>`;
    
    let isAdmin = false; try { isAdmin = (typeof currentUser !== 'undefined' && currentUser && currentUser.role.toLowerCase() === 'admin'); } catch(e){}
    
    html += `<div style="display:flex; gap:10px; margin-top:15px;">`;
    if(isAdmin || o[keySt] === 'Nháp' || o[keySt] === 'Chờ xử lý') {
        html += `<button class="action-btn orange" style="flex:1; padding:12px; font-size:14px;" onclick="closeModal('orderModal'); openEditOrderModal('${id}')">✏️ SỬA ĐƠN NÀY</button>`;
    }
    html += `<button class="action-btn gray" style="flex:1; padding:12px; font-size:14px;" onclick="printOrder('${id}')">🖨️ IN HÓA ĐƠN</button></div>`;
    
    document.getElementById('orderModalBody').innerHTML = html; document.getElementById('orderModal').style.display = 'flex';
}

function openEditOrderModal(id) {
    let o = ALL_ORDERS.find(x => String(x[resolveKey(x, ['mã đơn'], 'Mã Đơn')]) === String(id)); if(!o) return; editingOrderId = id;

    let keyCusName = resolveKey(o, ['tên kh', 'khách hàng'], 'Tên Khách Hàng');
    let keySDT = resolveKey(o, ['sdt', 'điện thoại'], 'SDT');
    let keyAddr = resolveKey(o, ['địa chỉ'], 'Địa Chỉ');
    let keyNote = resolveKey(o, ['ghi chú'], 'Ghi Chú');
    let keyCK = resolveKey(o, ['ck %', 'chiết khấu'], 'Chiết Khấu %');
    let keyPaid = resolveKey(o, ['khách thanh toán', 'thanh toán'], 'Khách Thanh Toán');
    let keyShipFee = resolveKey(o, ['phí ship'], 'Phí Ship');
    let keyShipInfo = resolveKey(o, ['thông tin giao hàng'], 'Thông tin Giao hàng');

    let en = document.getElementById("eoName"); if(en) en.value = o[keyCusName] || ''; 
    let ep = document.getElementById("eoPhone"); if(ep) ep.value = o[keySDT] || '';
    let ea = document.getElementById("eoAddress"); if(ea) ea.value = o[keyAddr] || ''; 
    let eno = document.getElementById("eoNote"); if(eno) eno.value = o[keyNote] || '';
    let ed = document.getElementById("eoDiscount"); if(ed) ed.value = o[keyCK] || '';
    let epa = document.getElementById("eoPaid"); if(epa) epa.value = o[keyPaid] || 0;
    let eShipFee = document.getElementById("eoShippingFee"); if(eShipFee) eShipFee.value = o[keyShipFee] || '';
    
    let eShipCarr = document.getElementById("eoShippingCarrier"); let eShipCode = document.getElementById("eoShippingCode");
    let fullInfo = String(o[keyShipInfo] || '').trim();
    if(fullInfo.includes(' - ')) {
        let parts = fullInfo.split(' - ');
        if(eShipCarr) { let opts = Array.from(eShipCarr.options).map(opt => opt.value); if(opts.includes(parts[0])) { eShipCarr.value = parts[0]; if(eShipCode) eShipCode.value = parts.slice(1).join(' - '); } else { eShipCarr.value = 'Khác'; if(eShipCode) eShipCode.value = fullInfo; } }
    } else {
        if(eShipCarr) { let opts = Array.from(eShipCarr.options).map(opt => opt.value); if(opts.includes(fullInfo)) { eShipCarr.value = fullInfo; if(eShipCode) eShipCode.value = ''; } else { eShipCarr.value = fullInfo ? 'Khác' : ''; if(eShipCode) eShipCode.value = fullInfo; } }
    }

    let cOldDebt = 0; let cPhoneClean = cleanPhone(o[keySDT]);
    if(cPhoneClean) { 
        let cus = ALL_CUSTOMERS.find(c => cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) === cPhoneClean); 
        if(cus) { cOldDebt = getRealtimeCustomerDebt(cPhoneClean) - Number(String(o[resolveKey(o, ['còn nợ'], 'Còn Nợ')]||0).replace(/[^0-9\-]/g,"")); let ect = document.getElementById('eoCustomerType'); if(ect) ect.value = cus[resolveKey(cus, ['nhóm kh'], 'Nhóm KH')] || 'Khách Lẻ'; } 
    }
    let eod = document.getElementById("eoOldDebt"); if(eod) eod.value = cOldDebt;
    
    let keyJSON = resolveKey(o, ['json'], 'Chi Tiết JSON');
    currentOrderItems = []; 
    if(o[keyJSON]) { try { currentOrderItems = JSON.parse(String(o[keyJSON])); } catch(e){} }
    renderAddFormUI(); renderOrderItemsList(true); 
    let m = document.getElementById('editOrderModal'); if(m) m.style.display = 'flex';
}

function getProductPriceInfo(p, qty = 1, cusType = 'Khách Lẻ') {
    if(!p) return { price: 0, isWholesale: false, appliedKm: 0, basePrice: 0 };
    let giaSi = Number(String(p[resolveKey(p, ['giá bán sỉ'], 'Giá bán sỉ')]||0).replace(/[^0-9]/g,""));
    let siTu = Number(String(p[resolveKey(p, ['sỉ từ'], 'Sỉ từ')]||999999).replace(/[^0-9]/g,"")) || 999999;
    let giaLe = Number(String(p[resolveKey(p, ['giá bán lẻ'], 'Giá bán lẻ')]||0).replace(/[^0-9]/g,""));
    let pctKm = Number(String(p[resolveKey(p, ['khuyến mãi', 'km'], '% Khuyến mãi')]||0).replace(/[^0-9.]/g,""));
    let giaGoc = Number(String(p[resolveKey(p, ['giá gốc'], 'Giá gốc')]||0).replace(/[^0-9]/g,""));
    
    let basePrice = giaLe > 0 ? giaLe : giaGoc;
    let isSỉ = String(cusType).trim().toLowerCase().includes('sỉ');

    if (isSỉ || (giaSi > 0 && qty >= siTu)) { let finalSi = giaSi > 0 ? giaSi : basePrice; return { price: finalSi, isWholesale: true, basePrice: finalSi, appliedKm: 0 }; }
    let finalPrice = basePrice; 
    if (pctKm > 0) finalPrice = smartRound(basePrice * (1 - pctKm / 100));
    return { price: finalPrice, isWholesale: false, basePrice: basePrice, appliedKm: pctKm };
}

function changePriceType(isEditMode) {
    let pTypeEl = document.getElementById(isEditMode ? 'eoCustomerType' : 'cCustomerType'); 
    let pType = pTypeEl ? pTypeEl.value : 'Khách Lẻ';
    currentOrderItems.forEach(item => { 
        let p = ALL_PRODUCTS.find(x => x[resolveKey(x, ['mã sp'], 'Mã SP')] == item.maSP); 
        if(p) { let priceInfo = getProductPriceInfo(p, item.soLuong, pType); item.giaBan = priceInfo.price; item.ckPercent = priceInfo.appliedKm || ''; item.thanhTien = item.soLuong * item.giaBan; } 
    });
    renderOrderItemsList(isEditMode); renderAddFormUI(); 
}

function saveDraftLocal() {
    let n = document.getElementById('cName'); let p = document.getElementById('cPhone'); let a = document.getElementById('cAddress'); let no = document.getElementById('cNote'); let d = document.getElementById('cDiscount'); let pd = document.getElementById('cPaid'); let selT = document.getElementById('cCustomerType'); let sf = document.getElementById('cShippingFee'); let carr = document.getElementById('cShippingCarrier'); let code = document.getElementById('cShippingCode');
    let draft = { name: n ? n.value : '', phone: p ? p.value : '', address: a ? a.value : '', note: no ? no.value : '', discount: d ? d.value : '', paid: pd ? pd.value : '', cusType: selT ? selT.value : 'Khách Lẻ', sf: sf ? sf.value : '', carr: carr ? carr.value : '', code: code ? code.value : '', items: currentOrderItems };
    localStorage.setItem('draftOrderData', JSON.stringify(draft));
}

function restoreDraftLocal() {
    let draftStr = localStorage.getItem('draftOrderData');
    if(draftStr) {
        try {
            let draft = JSON.parse(draftStr);
            let n = document.getElementById('cName'); if(n) n.value = draft.name || ''; let p = document.getElementById('cPhone'); if(p) p.value = draft.phone || '';
            let a = document.getElementById('cAddress'); if(a) a.value = draft.address || ''; let no = document.getElementById('cNote'); if(no) no.value = draft.note || '';
            let d = document.getElementById('cDiscount'); if(d) d.value = draft.discount || ''; let pd = document.getElementById('cPaid'); if(pd) pd.value = draft.paid || '';
            let sf = document.getElementById('cShippingFee'); if(sf) sf.value = draft.sf || ''; 
            let carr = document.getElementById('cShippingCarrier'); if(carr) carr.value = draft.carr || '';
            let code = document.getElementById('cShippingCode'); if(code) code.value = draft.code || '';
            let cst = document.getElementById('cCustomerType'); if(cst && draft.cusType) cst.value = draft.cusType;
            currentOrderItems = draft.items || [];
        } catch(e){}
    }
}

function clearDraftLocal() {
    localStorage.removeItem('draftOrderData'); 
    let ids = ['cName', 'cPhone', 'cAddress', 'cNote', 'cDiscount', 'cPaid', 'cShippingFee', 'cShippingCode'];
    ids.forEach(id => { let el = document.getElementById(id); if(el) el.value = ''; });
    let carr = document.getElementById('cShippingCarrier'); if(carr) carr.value = '';
    let od = document.getElementById('cOldDebt'); if(od) od.value = 0; 
    let cst = document.getElementById('cCustomerType'); if(cst) { cst.value = 'Khách Lẻ'; changePriceType(false); }
    currentOrderItems = []; renderAddFormUI();
}

function buildCustomerList() {
    let list = [...ALL_CUSTOMERS];
    let sample = ALL_ORDERS.length > 0 ? ALL_ORDERS[0] : {};
    let keySDT = resolveKey(sample, ['sdt', 'điện thoại'], 'SDT');
    let keyCusName = resolveKey(sample, ['tên kh', 'khách hàng'], 'Tên Khách Hàng');
    let keyAddr = resolveKey(sample, ['địa chỉ'], 'Địa Chỉ');
    let c_phoneKey = resolveKey(ALL_CUSTOMERS[0]||{}, ['điện thoại', 'sdt'], 'Điện thoại');

    ALL_ORDERS.forEach(o => {
        let phone = cleanPhone(o[keySDT]); let name = String(o[keyCusName]||'').trim(); let addr = String(o[keyAddr]||'');
        if(phone && !list.find(c => cleanPhone(c[c_phoneKey]) === phone)) { 
            let cusObj = { 'Mã khách hàng': '', 'Tên KH': name, 'Điện thoại': phone, 'Địa Chỉ': addr, 'Nhóm KH': 'Khách Lẻ', 'Nợ Đầu Kỳ': 0, 'Tổng Nợ Thực Tế': 0, 'Đã Thu Nợ': 0, 'Tổng mua': 0, 'Tổng đơn hàng': 0, 'Link FB': '' };
            if (ALL_CUSTOMERS.length > 0) { let formatted = {}; for(let k in cusObj) { formatted[resolveKey(ALL_CUSTOMERS[0], [k], k)] = cusObj[k]; } list.push(formatted); } else { list.push(cusObj); }
        }
    });
    return list;
}

function showCustomerSuggest(inputEl, isEditMode, boxIdOverride) {
    let valClean = cleanPhone(inputEl.value); let valRaw = String(inputEl.value).toLowerCase().trim();
    let boxId = boxIdOverride || (isEditMode ? 'cusSuggestEdit' : 'cusSuggestAdd'); let menu = document.getElementById(boxId); if(!menu) return;
    
    let list = buildCustomerList();
    if(valRaw) {
        let isPhoneSearch = /\d/.test(valRaw);
        list = list.filter(c => {
            let cPhone = cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]);
            let cName = String(c[resolveKey(c, ['tên kh', 'khách hàng'], 'Tên KH')] || '').toLowerCase();
            if (isPhoneSearch) return cPhone.includes(valClean);
            return cName.includes(valRaw) || cPhone.includes(valClean);
        });
    }
    
    list = list.slice(0, 10);
    if(list.length === 0) { menu.style.display = 'none'; return; }
    
    let html = list.map(c => {
        let phone = cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]); let stats = calcCustomerStats(phone); let cType = c[resolveKey(c, ['nhóm kh'], 'Nhóm KH')] || 'Khách Lẻ'; let debtVal = Number(stats.currentDebt) || 0; let noStr = (debtVal > 0) ? `<span class="debt-badge">Nợ cũ: ${formatMoney(debtVal)}</span>` : '';
        let cName = c[resolveKey(c, ['tên kh', 'khách hàng'], 'Tên KH')] || '---'; let cAddr = c[resolveKey(c, ['địa chỉ'], 'Địa Chỉ')] || '';
        let safeName = String(cName).replace(/'/g,"\\'"); let safeAddress = String(cAddr).replace(/'/g,"\\'");
        
        return `<div class="suggest-item" onmousedown="selectCustomer('${safeName}', '${phone}', '${safeAddress}', ${debtVal}, '${cType}', ${isEditMode}, '${boxId}')">
            <b>${cName}</b> - <span style="color:#3b82f6;">${phone}</span> [${cType}] ${noStr}<br/>
            <small style="opacity:0.7;">${cAddr}</small>
        </div>`;
    }).join('');
    menu.innerHTML = html; menu.style.display = 'block';
}

function selectCustomer(name, phone, address, oldDebt, cusType, isEditMode, boxId) {
    if(isEditMode) {
        let en = document.getElementById('eoName'); if(en) en.value = name; let ep = document.getElementById('eoPhone'); if(ep) ep.value = phone;
        let ea = document.getElementById('eoAddress'); if(ea) ea.value = address; let eod = document.getElementById('eoOldDebt'); if(eod) eod.value = oldDebt;
        let ctSel = document.getElementById('eoCustomerType'); if(ctSel) { ctSel.value = cusType; changePriceType(true); } updateOrderSummary(true);
    } else {
        let cn = document.getElementById('cName'); if(cn) cn.value = name; let cp = document.getElementById('cPhone'); if(cp) cp.value = phone;
        let ca = document.getElementById('cAddress'); if(ca) ca.value = address; let cod = document.getElementById('cOldDebt'); if(cod) cod.value = oldDebt;
        let ctSel = document.getElementById('cCustomerType'); if(ctSel) { ctSel.value = cusType; changePriceType(false); } updateOrderSummary(false); saveDraftLocal();
        
        setTimeout(() => {
            let sample = ALL_ORDERS[0] || {}; let k_sdt = resolveKey(sample, ['sdt', 'điện thoại'], 'SDT'); let k_st = resolveKey(sample, ['trạng thái'], 'Trạng Thái');
            let draft = ALL_ORDERS.find(o => cleanPhone(o[k_sdt]) === cleanPhone(phone) && String(o[k_st]).trim() === 'Nháp');
            if(draft) { if(confirm(`💡 Phát hiện khách hàng [${name}] đang có 1 Đơn Nháp chưa chốt.\n\nBạn có muốn mở Đơn Nháp đó lên để gộp thêm đồ chơi vào không?`)) { showPage('orders'); openEditOrderModal(draft[resolveKey(sample, ['mã đơn'], 'Mã Đơn')]); } }
        }, 300);
    }
    let box = document.getElementById(boxId); if(box) box.style.display = 'none';
}

function renderOrderItemsList(isEditMode) {
    let html = '';
    currentOrderItems.forEach((i, idx) => {
       if(i.giaGoc === undefined) i.giaGoc = i.giaBan;
       html += `<div style="padding:10px; border-bottom:1px dashed #e2e8f0; font-size:13px;" id="${isEditMode?'eoItem_':'item_'}${i.maSP}">
         <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><b style="color:#3b82f6;">${i.maSP} - ${i.tenSP}</b><button class="action-btn red" style="width:auto;padding:2px 8px;" onclick="removeOrderItem(${idx}, ${isEditMode})">X</button></div>
         <div style="display:flex; gap:8px; align-items:center;">
            <div style="flex:1"><label style="font-size:10px;opacity:0.7;">SL</label><input type="number" class="item-edit-input" value="${i.soLuong}" onchange="updateItem(${idx}, 'qty', this.value, ${isEditMode})"/></div>
            <div style="flex:2"><label style="font-size:10px;opacity:0.7;">Đơn giá</label><input type="number" class="item-edit-input" value="${i.giaBan}" oninput="updateItem(${idx}, 'price', this.value, ${isEditMode})"/></div>
            <div style="flex:1"><label style="font-size:10px;opacity:0.7;">% CK</label><input type="number" class="item-edit-input" value="${i.ckPercent||''}" placeholder="%" oninput="updateItem(${idx}, 'discount', this.value, ${isEditMode})"/></div>
         </div>
         <div style="text-align:right; font-weight:bold; color:#f87171; margin-top:6px;">= ${formatMoney(i.thanhTien)}</div>
       </div>`;
    });
    if(isEditMode) { let el = document.getElementById("eoItemsList"); if(el) el.innerHTML = html || '<i style="opacity:0.6;font-size:12px;">Đơn hàng rỗng.</i>'; }
    else { let el = document.getElementById("tempOrderItems"); if(el) el.innerHTML = html; }
    updateOrderSummary(isEditMode); 
}

function updateItem(idx, field, val, isEditMode) {
    let item = currentOrderItems[idx]; val = Number(val);
    if(field === 'qty') { 
        let p = ALL_PRODUCTS.find(x => x[resolveKey(x, ['mã sp'], 'Mã SP')] == item.maSP);
        if(p) {
            let validStock = (Number(p[resolveKey(p, ['tồn kho'], 'Tồn kho')])||0) - (Number(p[resolveKey(p, ['đang đặt'], 'Đang đặt')])||0);
            if (val > validStock) { alert(`❌ Kho không đủ! Chỉ còn lại ${validStock} sản phẩm khả dụng.`); val = validStock; }
            let pTypeEl = document.getElementById(isEditMode ? "eoCustomerType" : "cCustomerType"); let pType = pTypeEl ? pTypeEl.value : 'Khách Lẻ';
            let priceInfo = getProductPriceInfo(p, val, pType); item.giaBan = priceInfo.price; item.ckPercent = priceInfo.appliedKm || '';
        }
        item.soLuong = val > 0 ? val : 1; 
    } 
    else if (field === 'price') { item.giaBan = val >= 0 ? val : 0; item.ckPercent = ''; } 
    else if (field === 'discount') { item.ckPercent = val; item.giaBan = smartRound(item.giaGoc * (1 - val/100)); } 
    item.thanhTien = item.soLuong * item.giaBan; renderOrderItemsList(isEditMode);
}

function removeOrderItem(idx, isEditMode) { currentOrderItems.splice(idx, 1); renderOrderItemsList(isEditMode); }

function updateOrderSummary(isEditMode) {
    let prefix = isEditMode ? 'eo' : 'c';
    let sumId = isEditMode ? 'eoSummary' : 'addOrderSummary';
    
    let dEl = document.getElementById(prefix + 'Discount');
    let pEl = document.getElementById(prefix + 'Paid');
    let odEl = document.getElementById(prefix + 'OldDebt');
    let sfEl = document.getElementById(prefix + 'ShippingFee');
    let sumDiv = document.getElementById(sumId); 
    
    // BẢO VỆ CHỐNG LỖI TRẮNG TRANG NẾU GIAO DIỆN CHƯA VẼ XONG
    if (!dEl || !pEl || !odEl || !sfEl || !sumDiv) return; 
    
    let disc = Number(dEl.value) || 0; 
    let paid = Number(pEl.value) || 0;
    let oldDebt = Number(odEl.value) || 0;
    let shipFee = Number(sfEl.value) || 0;
    
    if(currentOrderItems.length === 0) { sumDiv.style.display = 'none'; return; }
    
    let rawTotal = currentOrderItems.reduce((sum, item) => sum + item.thanhTien, 0);
    let finalTotal = disc > 0 ? smartRound(rawTotal * (1 - disc/100)) : rawTotal;
    let discVal = rawTotal - finalTotal;
    
    finalTotal += shipFee; 
    let tongCong = finalTotal + oldDebt; let debt = tongCong - paid;
    
    let html = `<div class="summary-row"><span>Tổng tiền hàng:</span> <span>${formatMoney(rawTotal)}</span></div>`;
    if(discVal > 0) html += `<div class="summary-row discount"><span>Đã giảm giá (${disc}%):</span> <span>-${formatMoney(discVal)}</span></div>`;
    if(shipFee > 0) html += `<div class="summary-row" style="color:#f59e0b;"><span>Phí Giao Hàng:</span> <span>+${formatMoney(shipFee)}</span></div>`;
    
    html += `<div class="summary-row final"><span>Thành tiền đơn này:</span> <span>${formatMoney(finalTotal)}</span></div>`;
    
    if(oldDebt > 0) html += `<div class="summary-row" style="color:#ef4444; font-weight:bold; margin-top:5px;"><span>Nợ cũ:</span> <span>${formatMoney(oldDebt)}</span></div>`;
    html += `<div class="summary-row tong-cong"><span>TỔNG PHẢI THU:</span> <span>${formatMoney(tongCong)}</span></div>`;
    html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding-top:10px; border-top:1px dashed #444;">`;
    html += `<div style="flex:1;"><span style="font-size:12px;opacity:0.8;">Khách thanh toán:</span><br/><b style="color:#3b82f6; font-size:16px;">${formatMoney(paid)}</b></div>`;
    html += `<div style="flex:1; text-align:right;"><span style="font-size:12px;opacity:0.8;">Còn nợ:</span><br/><b style="color:#f59e0b; font-size:16px;">${formatMoney(debt)}</b></div></div>`;
    sumDiv.innerHTML = html; sumDiv.style.display = 'block';
    if(!isEditMode) saveDraftLocal();
}

function autoFillPaid(type, isEditMode = false) {
    if (currentOrderItems.length === 0) return alert("Vui lòng thêm sản phẩm vào đơn trước!");
    let prefix = isEditMode ? 'eo' : 'c'; let dEl = document.getElementById(prefix + 'Discount'); let sfEl = document.getElementById(prefix + 'ShippingFee'); let pEl = document.getElementById(prefix + 'Paid'); let odEl = document.getElementById(prefix + 'OldDebt');
    if (!dEl || !sfEl || !pEl || !odEl) return;
    
    let disc = Number(dEl.value) || 0; let shipFee = Number(sfEl.value) || 0;
    let rawTotal = currentOrderItems.reduce((sum, item) => sum + item.thanhTien, 0);
    let finalTotal = disc > 0 ? smartRound(rawTotal * (1 - disc/100)) : rawTotal; finalTotal += shipFee;
    
    let amountToFill = 0;
    if (type === 'current') { amountToFill = finalTotal; } else if (type === 'all') { let oldDebt = Number(odEl.value) || 0; amountToFill = finalTotal + oldDebt; }
    pEl.value = amountToFill; updateOrderSummary(isEditMode); if(!isEditMode) saveDraftLocal(); 
}

function renderAddFormUI() { 
    let pTypeEl = document.getElementById('cCustomerType'); let pType = pTypeEl ? pTypeEl.value : 'Khách Lẻ';
    let opts = ALL_PRODUCTS.map(p => {
        let validStock = (Number(p[resolveKey(p, ['tồn kho'], 'Tồn kho')])||0) - (Number(p[resolveKey(p, ['đang đặt'], 'Đang đặt')])||0); 
        let priceInfo = getProductPriceInfo(p, 1, pType);
        let k_name = resolveKey(p, ['tên sp'], 'Tên SP'); let k_id = resolveKey(p, ['mã sp'], 'Mã SP');
        let textStr = `${p[k_name]} | Giá: ${formatMoney(priceInfo.price)} | Tồn: ${validStock}`;
        if (validStock <= 0) return `<option value="${p[k_id]}" disabled>❌ HẾT HÀNG - ${textStr}</option>`; 
        return `<option value="${p[k_id]}">${textStr}</option>`;
    }).join('');
    let dl = document.getElementById("productDatalist"); if(dl) dl.innerHTML = opts; renderOrderItemsList(false); renderRecentDrafts();
}

function renderRecentDrafts() {
    let drafts = ALL_ORDERS.filter(o => { let st = String(o[resolveKey(o, ['trạng thái'], 'Trạng Thái')]).trim(); return st === 'Nháp' || st === 'Chờ xử lý'; });
    let zone = document.getElementById('recentDraftsZone'); let list = document.getElementById('recentDraftsList');
    if(!zone || !list) return;

    if(drafts.length === 0) { zone.style.display = 'none'; return; }
    zone.style.display = 'block';
    
    let isAdmin = false;
    try { isAdmin = (typeof currentUser !== 'undefined' && currentUser && currentUser.role.toLowerCase() === 'admin'); } catch(e){}

    let html = drafts.map(o => {
        let keySt = resolveKey(o, ['trạng thái'], 'Trạng Thái');
        let keyCusName = resolveKey(o, ['tên kh', 'khách hàng'], 'Tên Khách Hàng');
        let keyShipInfo = resolveKey(o, ['thông tin giao hàng'], 'Thông tin Giao hàng');
        let keyFinal = resolveKey(o, ['tt sau ck', 'thành tiền'], 'Thành Tiền Sau Chiết Khấu');
        let keySP = resolveKey(o, ['tổng sp'], 'Tổng SP');
        let keyId = resolveKey(o, ['mã đơn'], 'Mã Đơn');

        let st = o[keySt]; let cardClass = st === 'Nháp' ? 'draft-card' : 'pending-card'; let borderColor = st === 'Nháp' ? '#f59e0b' : '#3b82f6';
        let shipInfo = String(o[keyShipInfo] || '').trim(); let isAtCounter = shipInfo === '' || shipInfo.toLowerCase().includes('quầy');
        let actBtn = '';
        if(isAtCounter) {
            actBtn = `<button class="action-btn orange" style="flex:1.5; padding:8px 2px; font-size:11px;" onclick="markDelivered('${o[keyId]}')" title="Ghi Nợ">✔️ Giao (Nợ)</button><button class="action-btn green" style="flex:1.5; padding:8px 2px; font-size:11px;" onclick="markCollectedCOD('${o[keyId]}')" title="Thu Đủ 100%">✔️ Thu Đủ</button>`;
        } else {
            actBtn = `<button class="action-btn blue" style="flex:1.5; padding:8px 5px;" onclick="markShipping('${o[keyId]}')">🚚 Gửi Xe</button>`;
        }

        let editBtn = (st === 'Nháp' || st === 'Chờ xử lý' || isAdmin) 
                      ? `<button class="action-btn orange" style="flex:1.5; padding:8px 5px;" onclick="showPage('orders'); openEditOrderModal('${o[keyId]}')">✏️ Sửa</button>` 
                      : `<button class="action-btn gray" style="flex:1.5; padding:8px 5px;" disabled>🔒</button>`;

        return `<div class="${cardClass}" style="width:100%; padding:12px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05); color:inherit; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div><b style="font-size:15px; color:${borderColor};">${o[keyCusName] || 'Khách Lẻ'}</b> <span style="font-size:11px; opacity:0.6;">(${o[keyId]})</span><br/><span style="font-size:12px; opacity:0.7;">(${o[keySP]} SP) - ${st}</span></div>
                <div style="text-align:right;"><span style="font-size:16px; font-weight:bold; color:#ef4444;">${formatMoney(o[keyFinal])}</span></div>
            </div>
            <div style="display:flex; gap:8px;"><button class="action-btn gray" style="flex:1; padding:8px 5px;" title="In hóa đơn" onclick="printOrder('${o[keyId]}')">🖨️ In</button>${editBtn}${actBtn}</div>
        </div>`;
    }).join('');
    list.innerHTML = html;
}

function addTempItemToOrder(isEditMode) {
    let inputId = isEditMode ? "productInputEdit" : "productInputAdd"; let prodEl = document.getElementById(inputId); let valId = prodEl ? String(prodEl.value).trim().toUpperCase() : ''; 
    let qtyEl = document.getElementById(isEditMode ? "eoQty" : "qty"); let qty = qtyEl ? (Number(qtyEl.value) || 1) : 1;
    let pTypeEl = document.getElementById(isEditMode ? "eoCustomerType" : "cCustomerType"); let pType = pTypeEl ? pTypeEl.value : 'Khách Lẻ';
    
    if(!valId) return;
    let p = ALL_PRODUCTS.find(x => String(x[resolveKey(x, ['mã sp'], 'Mã SP')]).toUpperCase() === valId || String(x[resolveKey(x, ['tên sp'], 'Tên SP')]).toUpperCase() === valId); 
    if(!p) return alert("Không tìm thấy Sản phẩm với mã hoặc tên này!");

    let priceInfo = getProductPriceInfo(p, qty, pType); 
    let validStock = (Number(p[resolveKey(p, ['tồn kho'], 'Tồn kho')])||0) - (Number(p[resolveKey(p, ['đang đặt'], 'Đang đặt')])||0);
    let k_id = resolveKey(p, ['mã sp'], 'Mã SP'); let k_name = resolveKey(p, ['tên sp'], 'Tên SP');
    let existing = currentOrderItems.find(i => i.maSP == p[k_id]); let currentTempQty = existing ? existing.soLuong : 0;
    
    if (currentTempQty + qty > validStock) return alert(`❌ Vượt quá số lượng trong kho! \nTồn kho khả dụng: ${validStock} \nBạn đã chọn: ${currentTempQty}`);

    if(existing) { existing.soLuong += qty; let np = getProductPriceInfo(p, existing.soLuong, pType); existing.giaBan = np.price; existing.ckPercent = np.appliedKm || ''; existing.thanhTien = existing.soLuong * existing.giaBan; } else { currentOrderItems.push({ maSP: p[k_id], tenSP: p[k_name], soLuong: qty, giaGoc: priceInfo.basePrice, giaBan: priceInfo.price, ckPercent: priceInfo.appliedKm || '', thanhTien: priceInfo.price * qty }); }
    
    if(prodEl) prodEl.value = ''; if(qtyEl) qtyEl.value = 1; renderOrderItemsList(isEditMode);
    setTimeout(() => { let rowId = isEditMode ? 'eoItem_'+p[k_id] : 'item_'+p[k_id]; let rowEl = document.getElementById(rowId); if(rowEl) { rowEl.style.backgroundColor = '#d1fae5'; setTimeout(() => rowEl.style.backgroundColor = 'transparent', 500); } }, 50);
}

// KHỞI TẠO ĐƠN CHUẨN TÊN DÀI
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
    let shipInfo = ''; if (carr && cCode) { shipInfo = `${carr} - ${cCode}`; } else if (carr) { shipInfo = carr; } else if (cCode) { shipInfo = cCode; }

    let rawTotal = currentOrderItems.reduce((sum, item) => sum + item.thanhTien, 0); 
    let totalItems = currentOrderItems.reduce((sum, item) => sum + Number(item.soLuong), 0);
    let finalTotal = discountPct > 0 ? smartRound(rawTotal * (1 - discountPct/100)) : rawTotal; 
    finalTotal += shipFee;
    let tongCong = finalTotal + oldDebt; let debt = tongCong - paid;

    let mockId = (orderStatus === 'Nháp' ? "NHAP_" : "DH_") + Date.now().toString().slice(-5); 
    let createTime = new Date().toLocaleString('vi-VN'); 
    let aEl = document.getElementById("cAddress"); let noEl = document.getElementById("cNote");
    let selT = document.getElementById('cCustomerType'); let cusType = selT ? selT.value : 'Khách Lẻ'; let loaiDon = "APP - " + cusType;

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

    ALL_ORDERS.unshift(newOrder); localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS));
    
    if(orderStatus !== 'Nháp') {
        currentOrderItems.forEach(item => { 
            let p = ALL_PRODUCTS.find(x => x[resolveKey(x, ['mã sp'], 'Mã SP')] == item.maSP); 
            if(p) { let keyDangDat = resolveKey(p, ['đang đặt'], 'Đang đặt'); p[keyDangDat] = (Number(p[keyDangDat]) || 0) + item.soLuong; addQueueItem('updateProduct', p); } 
        });
        localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS));
        
        if (cPhoneClean) {
            let cusIdx = ALL_CUSTOMERS.findIndex(c => cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) === cPhoneClean);
            if(cusIdx === -1) { 
                let cus = { "Mã khách hàng": generateCustomerId(), "Tên KH": cName, "Điện thoại": cPhoneClean, "Địa Chỉ": aEl ? aEl.value : '', "Nhóm KH": cusType, "Nợ Đầu Kỳ": 0, "Tổng Nợ Thực Tế": 0, "Đã Thu Nợ": 0, "Tổng mua": 0, "Tổng đơn hàng": 0, "Link FB": "" };
                ALL_CUSTOMERS.push(cus); addQueueItem('updateCustomer', cus);
            } else {
                let cus = ALL_CUSTOMERS[cusIdx]; let changed = false;
                let c_nameKey = resolveKey(cus, ['tên kh', 'khách hàng'], 'Tên KH'); let c_addrKey = resolveKey(cus, ['địa chỉ'], 'Địa Chỉ'); let c_groupKey = resolveKey(cus, ['nhóm kh'], 'Nhóm KH');
                if(!cus[c_nameKey] && cName) { cus[c_nameKey] = cName; changed = true; }
                if(!cus[c_addrKey] && aEl ? aEl.value : '') { cus[c_addrKey] = aEl.value; changed = true; }
                if(cus[c_groupKey] !== cusType) { cus[c_groupKey] = cusType; changed = true; }
                if(changed) addQueueItem('updateCustomer', cus);
            }
            localStorage.setItem('ALL_CUSTOMERS', JSON.stringify(ALL_CUSTOMERS));
        }
    }
    
    addQueueItem('addOrder', newOrder); if (cPhoneClean && orderStatus !== 'Nháp') syncCustomerStatsToSheet(cPhoneClean);
    localStorage.removeItem('draftOrderData'); 
    if(nEl) nEl.value = ''; if(pEl) pEl.value = ''; if(aEl) aEl.value = ''; if(noEl) noEl.value = ''; if(dEl) dEl.value = ''; if(paidEl) paidEl.value = ''; if(odEl) odEl.value = 0; if(sfEl) sfEl.value = ''; if(carrEl) carrEl.value = ''; if(cCodeEl) cCodeEl.value = '';
    let sumEl = document.getElementById("addOrderSummary"); if(sumEl) sumEl.style.display = 'none'; currentOrderItems = []; renderAddFormUI(); if(currentPage === 'dashboard') renderAdvancedDashboard(); if(currentPage === 'orders') renderOrdersData();
}

function saveEditOrder() {
    if(currentOrderItems.length === 0) return alert("Đơn hàng không thể rỗng!");
    let o = ALL_ORDERS.find(x => String(x[resolveKey(x, ['mã đơn'], 'Mã Đơn')]) === String(editingOrderId)); if(!o) return;

    if(String(o[resolveKey(o, ['trạng thái'], 'Trạng Thái')]).trim() !== 'Nháp') {
        let oldItems = []; try { oldItems = JSON.parse(String(o[resolveKey(o, ['json'], 'Chi Tiết JSON')] || '[]')); } catch(e){}
        oldItems.forEach(item => { let p = ALL_PRODUCTS.find(x => x[resolveKey(x, ['mã sp'], 'Mã SP')] == item.maSP); if(p) { let keyDangDat = resolveKey(p, ['đang đặt'], 'Đang đặt'); p[keyDangDat] = (Number(p[keyDangDat]) || 0) - item.soLuong; if(p[keyDangDat] < 0) p[keyDangDat] = 0; } });
        currentOrderItems.forEach(item => { let p = ALL_PRODUCTS.find(x => x[resolveKey(x, ['mã sp'], 'Mã SP')] == item.maSP); if(p) { let keyDangDat = resolveKey(p, ['đang đặt'], 'Đang đặt'); p[keyDangDat] = (Number(p[keyDangDat]) || 0) + item.soLuong; addQueueItem('updateProduct', p); } });
        localStorage.setItem('ALL_PRODUCTS', JSON.stringify(ALL_PRODUCTS));
    }

    let nEl = document.getElementById("eoName"); let pEl = document.getElementById("eoPhone"); let aEl = document.getElementById("eoAddress"); let noEl = document.getElementById("eoNote"); let dEl = document.getElementById("eoDiscount"); let disc = dEl ? (Number(dEl.value) || 0) : 0; let paEl = document.getElementById("eoPaid"); let paid = paEl ? (Number(paEl.value) || 0) : 0; let odEl = document.getElementById("eoOldDebt"); let oldDebtRecord = odEl ? (Number(odEl.value) || 0) : 0; let ctSel = document.getElementById('eoCustomerType'); let cusType = ctSel ? ctSel.value : 'Khách Lẻ'; let shipFeeEl = document.getElementById("eoShippingFee"); let shipFee = shipFeeEl ? (Number(shipFeeEl.value) || 0) : 0; let carrEl = document.getElementById("eoShippingCarrier"); let cCodeEl = document.getElementById("eoShippingCode"); let carr = carrEl ? carrEl.value : ''; let cCode = cCodeEl ? cCodeEl.value.trim() : ''; let shipInfo = ''; if (carr && cCode) { shipInfo = `${carr} - ${cCode}`; } else if (carr) { shipInfo = carr; } else if (cCode) { shipInfo = cCode; }
    let rawTotal = currentOrderItems.reduce((sum, item) => sum + item.thanhTien, 0); let totalItems = currentOrderItems.reduce((sum, item) => sum + Number(item.soLuong), 0); let finalTotal = disc > 0 ? smartRound(rawTotal * (1 - disc/100)) : rawTotal; finalTotal += shipFee; let tongCong = finalTotal + oldDebtRecord; let newDebt = tongCong - paid;

    if(nEl) o['Tên Khách Hàng'] = nEl.value; if(pEl) o['SDT'] = cleanPhone(pEl.value); if(aEl) o['Địa Chỉ'] = aEl.value; 
    o['Ghi Chú'] = noEl ? noEl.value : ''; o['Loại Đơn'] = "APP - " + cusType; o['Chiết Khấu %'] = disc; o['Tổng SP'] = totalItems; o['Tổng Tiền'] = rawTotal; o['Thành Tiền Sau Chiết Khấu'] = finalTotal; o['Phí Ship'] = shipFee; o['Thông tin Giao hàng'] = shipInfo; o['Khách Thanh Toán'] = paid; o['Còn Nợ'] = newDebt; o['Chi Tiết JSON'] = JSON.stringify(currentOrderItems);
    
    let keySt = resolveKey(o, ['trạng thái'], 'Trạng Thái');
    if(String(o[keySt]).trim() === 'Nháp') o[keySt] = 'Chờ xử lý';

    let cPhoneClean = cleanPhone(pEl ? pEl.value : '');
    if (cPhoneClean) {
       let cusIdx = ALL_CUSTOMERS.findIndex(c => cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) === cPhoneClean);
       if(cusIdx === -1) { 
           let cus = { "Mã khách hàng": generateCustomerId(), "Tên KH": nEl.value, "Điện thoại": cPhoneClean, "Địa Chỉ": aEl.value, "Nhóm KH": cusType, "Nợ Đầu Kỳ": 0, "Tổng Nợ Thực Tế": 0, "Đã Thu Nợ": 0, "Tổng mua": 0, "Tổng đơn hàng": 0, "Link FB": "" };
           ALL_CUSTOMERS.push(cus); addQueueItem('updateCustomer', cus);
       } else {
           let cus = ALL_CUSTOMERS[cusIdx]; let changed = false;
           let c_nameKey = resolveKey(cus, ['tên kh', 'khách hàng'], 'Tên KH'); let c_addrKey = resolveKey(cus, ['địa chỉ'], 'Địa Chỉ'); let c_groupKey = resolveKey(cus, ['nhóm kh'], 'Nhóm KH');
           if(!cus[c_nameKey] && nEl.value) { cus[c_nameKey] = nEl.value; changed = true; } if(!cus[c_addrKey] && aEl.value) { cus[c_addrKey] = aEl.value; changed = true; } if(cus[c_groupKey] !== cusType) { cus[c_groupKey] = cusType; changed = true; } if(changed) addQueueItem('updateCustomer', cus);
       }
       localStorage.setItem('ALL_CUSTOMERS', JSON.stringify(ALL_CUSTOMERS));
    }

    localStorage.setItem('ALL_ORDERS', JSON.stringify(ALL_ORDERS)); addQueueItem('updateOrder', o); if(cPhoneClean) syncCustomerStatsToSheet(cPhoneClean);
    closeModal('editOrderModal'); if(currentPage === 'orders') renderOrdersData(); if(currentPage === 'add') renderRecentDrafts();
}
