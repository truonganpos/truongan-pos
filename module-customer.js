function renderCustomersData(resetLimit = false) {
    try {
        if(resetLimit) limitCus = 50;
        let sEl = document.getElementById("searchCustomers"); let s = sEl ? String(sEl.value).toLowerCase().trim() : '';
        let groupFilterEl = document.getElementById("customerGroupFilter"); let groupFilter = groupFilterEl ? groupFilterEl.value : "ALL";

        let filtered = ALL_CUSTOMERS.filter(c => {
            let matchSearch = true;
            if(s) {
                let name = String(c[resolveKey(c, ['tên khách hàng', 'tên kh'], 'Tên Khách Hàng')] || '').toLowerCase(); 
                let phone = cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]);
                matchSearch = name.includes(s) || phone.includes(s);
            }
            let matchGroup = true;
            if(groupFilter !== "ALL") { matchGroup = String(c[resolveKey(c, ['nhóm kh'], 'Nhóm KH')]).trim() === groupFilter; }
            return matchSearch && matchGroup;
        });

        filtered.sort((a,b) => {
            let noA = Number(String(a[resolveKey(a, ['tổng nợ thực tế', 'còn nợ'], 'Tổng Nợ Thực Tế')]||0).replace(/[^0-9\-]/g,""));
            let noB = Number(String(b[resolveKey(b, ['tổng nợ thực tế', 'còn nợ'], 'Tổng Nợ Thực Tế')]||0).replace(/[^0-9\-]/g,""));
            if(noB !== noA) return noB - noA;
            return Number(String(b[resolveKey(b, ['tổng mua'], 'Tổng mua')]||0).replace(/[^0-9\-]/g,"")) - Number(String(a[resolveKey(a, ['tổng mua'], 'Tổng mua')]||0).replace(/[^0-9\-]/g,""));
        });

        let countEl = document.getElementById('customerCountDisplay'); if (countEl) countEl.innerText = filtered.length;
        let sliced = filtered.slice(0, limitCus);
        
        // CĂN TRÁI TIÊU ĐỀ TÁC VỤ
        let html = viewMode === 'table' ? `<div class="table-responsive"><table><thead><tr><th class="col-check"><input type="checkbox" onclick="toggleAllCustomerChecks(this)"/></th><th class="th-cus-id">Mã KH</th><th class="th-cus-name">Khách Hàng</th><th class="th-cus-phone">SĐT</th><th class="th-cus-group">Nhóm</th><th class="th-cus-debt">Còn Nợ</th><th class="th-cus-order">Đơn</th><th class="th-cus-spent">Đã chi</th><th class="th-cus-action" style="text-align:left;">Tác vụ</th></tr></thead><tbody>` : `<div class="data-grid">`;

        sliced.forEach(c => {
            let k_id = resolveKey(c, ['mã khách hàng'], 'Mã khách hàng');
            let k_name = resolveKey(c, ['tên khách hàng', 'tên kh'], 'Tên Khách Hàng');
            let k_phone = resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại');
            let k_group = resolveKey(c, ['nhóm kh'], 'Nhóm KH');
            let k_debt = resolveKey(c, ['tổng nợ thực tế', 'còn nợ'], 'Tổng Nợ Thực Tế');
            let k_orders = resolveKey(c, ['tổng đơn hàng'], 'Tổng đơn hàng');
            let k_spent = resolveKey(c, ['tổng mua'], 'Tổng mua');

            let phone = cleanPhone(c[k_phone]); let isVIP = (phone.length >= 8 && vipPhones.has(phone));
            let totalSpent = Number(String(c[k_spent]||0).replace(/[^0-9\-]/g,""));
            let debt = Number(String(c[k_debt]||0).replace(/[^0-9\-]/g,""));
            let totalOrders = Number(c[k_orders] || 0);
            let maKH = String(c[k_id]||'').replace(/'/g, "\\'");

            if(viewMode === 'table') {
                html += `<tr>
                    <td class="col-check"><input type="checkbox" class="chk-customer-box" value="${maKH}"/></td>
                    <td class="th-cus-id"><b>${c[k_id]}</b></td>
                    <td class="th-cus-name" style="font-weight:bold; color:#0070f4; cursor:pointer;" onclick="filterOrdersByCustomer('${phone}')" title="Xem lịch sử đơn">
                        ${c[k_name]||'---'} ${isVIP ? '<span class="vip-badge">🌟 VIP</span>' : ''}
                    </td>
                    <td class="th-cus-phone">${phone||'---'}</td>
                    <td class="th-cus-group"><span class="cat-badge ${c[k_group]==='Khách Sỉ'?'si':''}">${c[k_group]||'Khách Lẻ'}</span></td>
                    <td class="th-cus-debt"><b style="color:${debt>0?'#ef4444':'#10b981'};">${formatMoney(debt)}</b></td>
                    <td class="th-cus-order">${totalOrders}</td>
                    <td class="th-cus-spent">${formatMoney(totalSpent)}</td>
                    <td class="th-cus-action actions" style="justify-content:flex-start;">
                        <button class="action-btn orange" onclick="openCustomerModal('${maKH}')">✏️ Sửa</button>
                        <button class="action-btn green" onclick="openPayDebtModal('${phone}')" ${debt<=0?'disabled title="Không có nợ"':'title="Thu tiền nợ"'}>💰 Thu nợ</button>
                    </td>
                </tr>`;
            } else {
                let avaName = String(c[k_name]||'?').charAt(0).toUpperCase();
                html += `<div class="cus-card">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px dashed #eee; padding-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div class="cus-avt-small">${avaName}</div>
                            <div>
                                <b style="color:#0070f4; font-size:15px; cursor:pointer;" onclick="filterOrdersByCustomer('${phone}')">${c[k_name]||'---'}</b> ${isVIP ? '<span class="vip-badge">VIP</span>' : ''}<br>
                                <span style="font-size:12px; color:#666;">📞 ${phone||'---'}</span>
                            </div>
                        </div>
                        <span class="cat-badge ${c[k_group]==='Khách Sỉ'?'si':''}" style="align-self:flex-start;">${c[k_group]||'Lẻ'}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:13px;"><span>Đã chi (${totalOrders} đơn):</span> <b style="color:#10b981;">${formatMoney(totalSpent)}</b></div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:13px;"><span>Nợ hiện tại:</span> <b style="color:#ef4444; font-size:15px;">${formatMoney(debt)}</b></div>
                    <div style="display:flex; gap:5px; margin-top:auto; justify-content:flex-start;">
                        <button class="action-btn orange" style="flex:1;" onclick="openCustomerModal('${maKH}')">✏️ Sửa</button>
                        <button class="action-btn green" style="flex:1;" onclick="openPayDebtModal('${phone}')" ${debt<=0?'disabled':''}>💰 Thu nợ</button>
                    </div>
                </div>`;
            }
        });

        if(viewMode === 'table') html += `</tbody></table></div>`; else html += `</div>`;
        if(filtered.length > limitCus) { html += `<div style="text-align:center; padding:15px; clear:both;"><button class="action-btn blue" onclick="loadMore('cus')">⬇️ Xem thêm khách hàng</button></div>`; }
        let cl = document.getElementById("customersList"); if(cl) cl.innerHTML = html;
    } catch(err) {}
}

function openCustomerModal(id = null) {
    let c = null;
    if(id) { c = ALL_CUSTOMERS.find(x => x[resolveKey(x, ['mã khách hàng'], 'Mã khách hàng')] === id); }
    
    document.getElementById('cusModalTitle').innerText = c ? 'SỬA KHÁCH HÀNG' : 'THÊM KHÁCH MỚI';
    document.getElementById('cusOldPhone').value = c ? cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) : '';
    document.getElementById('cusEditPhone').value = c ? (c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]||'') : '';
    document.getElementById('cusEditName').value = c ? (c[resolveKey(c, ['tên khách hàng', 'tên kh'], 'Tên Khách Hàng')]||'') : '';
    document.getElementById('cusEditType').value = c ? (c[resolveKey(c, ['nhóm kh'], 'Nhóm KH')]||'Khách Lẻ') : 'Khách Lẻ';
    document.getElementById('cusEditAddress').value = c ? (c[resolveKey(c, ['địa chỉ'], 'Địa Chỉ')]||'') : '';
    document.getElementById('cusEditFB').value = c ? (c[resolveKey(c, ['link fb'], 'Link FB')]||'') : '';
    
    let debtInput = document.getElementById('cusEditDebt');
    let k_dInit = resolveKey(c||ALL_CUSTOMERS[0]||{}, ['nợ đầu kỳ'], 'Nợ Đầu Kỳ');
    if(c && c[k_dInit]) { debtInput.value = c[k_dInit]; debtInput.disabled = true; } else { debtInput.value = ''; debtInput.disabled = false; }
    
    document.getElementById('customerModal').style.display = 'flex';
}

function saveCustomer() {
    let oldPhone = document.getElementById('cusOldPhone').value;
    let newPhone = cleanPhone(document.getElementById('cusEditPhone').value);
    if(!newPhone) return alert("Vui lòng nhập số điện thoại hợp lệ!");
    
    let isNew = !oldPhone;
    if(isNew && ALL_CUSTOMERS.find(c => cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) === newPhone)) return alert("Số điện thoại này đã tồn tại!");
    if(!isNew && oldPhone !== newPhone && ALL_CUSTOMERS.find(c => cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) === newPhone)) return alert("SĐT mới đã bị trùng với khách khác!");

    let cusObj = null;
    let sCus = ALL_CUSTOMERS.length > 0 ? ALL_CUSTOMERS[0] : {};
    let c_id = resolveKey(sCus, ['mã khách hàng'], 'Mã khách hàng');
    // FIX DÙNG CHỮ Tên Khách Hàng CỐ ĐỊNH, CHỐNG ĐẺ CỘT
    let c_name = resolveKey(sCus, ['tên khách hàng', 'tên kh'], 'Tên Khách Hàng');
    let c_phone = resolveKey(sCus, ['điện thoại', 'sdt'], 'Điện thoại');
    let c_addr = resolveKey(sCus, ['địa chỉ'], 'Địa Chỉ');
    let c_group = resolveKey(sCus, ['nhóm kh'], 'Nhóm KH');
    let c_dInit = resolveKey(sCus, ['nợ đầu kỳ'], 'Nợ Đầu Kỳ');
    let c_dReal = resolveKey(sCus, ['tổng nợ thực tế', 'còn nợ'], 'Tổng Nợ Thực Tế');
    let c_paid = resolveKey(sCus, ['đã thu nợ'], 'Đã Thu Nợ');
    let c_spent = resolveKey(sCus, ['tổng mua'], 'Tổng mua');
    let c_orders = resolveKey(sCus, ['tổng đơn hàng'], 'Tổng đơn hàng');
    let c_fb = resolveKey(sCus, ['link fb'], 'Link FB');

    if(isNew) {
        cusObj = { 
            [c_id]: generateCustomerId(), 
            [c_name]: document.getElementById('cusEditName').value, 
            [c_phone]: newPhone, 
            [c_addr]: document.getElementById('cusEditAddress').value, 
            [c_group]: document.getElementById('cusEditType').value, 
            [c_dInit]: Number(document.getElementById('cusEditDebt').value)||0, 
            [c_dReal]: 0, 
            [c_paid]: 0, 
            [c_spent]: 0, 
            [c_orders]: 0, 
            [c_fb]: document.getElementById('cusEditFB').value 
        };
        ALL_CUSTOMERS.unshift(cusObj);
    } else {
        cusObj = ALL_CUSTOMERS.find(c => cleanPhone(c[c_phone]) === oldPhone);
        if(cusObj) {
            cusObj[c_name] = document.getElementById('cusEditName').value;
            cusObj[c_phone] = newPhone;
            cusObj[c_addr] = document.getElementById('cusEditAddress').value;
            cusObj[c_group] = document.getElementById('cusEditType').value;
            cusObj[c_fb] = document.getElementById('cusEditFB').value;
            if(!cusObj[c_dInit] && document.getElementById('cusEditDebt').value) cusObj[c_dInit] = Number(document.getElementById('cusEditDebt').value)||0;
        }
    }
    
    if(cusObj) {
        localStorage.setItem('ALL_CUSTOMERS', JSON.stringify(ALL_CUSTOMERS));
        addQueueItem('updateCustomer', cusObj);
        syncCustomerStatsToSheet(newPhone);
    }
    closeModal('customerModal'); if(currentPage === 'customers') renderCustomersData();
}

function syncCustomerStatsToSheet(phoneClean) {
    if(!phoneClean) return;
    let c_phoneKey = resolveKey(ALL_CUSTOMERS[0]||{}, ['điện thoại', 'sdt'], 'Điện thoại');
    let cus = ALL_CUSTOMERS.find(c => cleanPhone(c[c_phoneKey]) === phoneClean); if(!cus) return;
    
    let totalOrd = 0; let totalSpent = 0; let totalDebtFromOrders = 0;
    
    ALL_ORDERS.forEach(o => {
        if(cleanPhone(o[resolveKey(o, ['sdt', 'điện thoại'], 'SDT')]) === phoneClean) {
            let st = String(o[resolveKey(o, ['trạng thái'], 'Trạng Thái')]).trim();
            if(st === 'Đã giao' || st === 'Đang giao') {
                totalOrd++;
                let k_fin = resolveKey(o, ['tt sau ck', 'thành tiền'], 'Thành Tiền Sau Chiết Khấu');
                let k_tot = resolveKey(o, ['tổng tiền'], 'Tổng Tiền');
                let k_debt = resolveKey(o, ['còn nợ'], 'Còn Nợ');

                if(st === 'Đã giao') totalSpent += Number(String(o[k_fin]||o[k_tot]||0).replace(/[^0-9\-]/g,""));
                totalDebtFromOrders += Number(String(o[k_debt]||0).replace(/[^0-9\-]/g,""));
            }
        }
    });

    let noDauKy = Number(cus[resolveKey(cus, ['nợ đầu kỳ'], 'Nợ Đầu Kỳ')] || 0);
    let daThu = Number(cus[resolveKey(cus, ['đã thu nợ'], 'Đã Thu Nợ')] || 0);
    let realDebt = noDauKy + totalDebtFromOrders - daThu;

    cus[resolveKey(cus, ['tổng đơn hàng'], 'Tổng đơn hàng')] = totalOrd;
    cus[resolveKey(cus, ['tổng mua'], 'Tổng mua')] = totalSpent;
    cus[resolveKey(cus, ['tổng nợ thực tế', 'còn nợ'], 'Tổng Nợ Thực Tế')] = realDebt;
    
    localStorage.setItem('ALL_CUSTOMERS', JSON.stringify(ALL_CUSTOMERS));
    addQueueItem('updateCustomer', cus);
    rebuildVipList();
}

function getRealtimeCustomerDebt(phoneClean) {
    let cus = ALL_CUSTOMERS.find(c => cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) === phoneClean);
    if(!cus) return 0; return Number(cus[resolveKey(cus, ['tổng nợ thực tế', 'còn nợ'], 'Tổng Nợ Thực Tế')] || 0);
}

function calcCustomerStats(phoneClean) { return { currentDebt: getRealtimeCustomerDebt(phoneClean) }; }

function rebuildVipList() {
    vipPhones.clear();
    ALL_CUSTOMERS.forEach(c => {
        let totalOrd = Number(c[resolveKey(c, ['tổng đơn hàng'], 'Tổng đơn hàng')] || 0);
        let totalSpent = Number(String(c[resolveKey(c, ['tổng mua'], 'Tổng mua')]||0).replace(/[^0-9\-]/g,""));
        if(totalOrd >= 10 || totalSpent >= 2000000) { let p = cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]); if(p.length>=8) vipPhones.add(p); }
    });
}

function openPayDebtModal(phone) {
    let phoneClean = cleanPhone(phone); let cus = ALL_CUSTOMERS.find(c => cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) === phoneClean);
    if(!cus) return;
    
    let currentDebt = getRealtimeCustomerDebt(phoneClean);
    if(currentDebt <= 0) return alert("Khách hàng này hiện không có nợ!");

    document.getElementById('payDebtPhone').value = phoneClean;
    document.getElementById('payDebtName').innerText = cus[resolveKey(cus, ['tên khách hàng', 'tên kh'], 'Tên Khách Hàng')] || '---';
    document.getElementById('payDebtCurrent').innerText = formatMoney(currentDebt);
    document.getElementById('payDebtAmount').value = currentDebt; 
    
    document.getElementById('payDebtModal').style.display = 'flex';
}

function processPayDebt() {
    let phoneClean = document.getElementById('payDebtPhone').value;
    let payVal = Number(document.getElementById('payDebtAmount').value) || 0;
    if(payVal <= 0) return alert("Số tiền thu phải lớn hơn 0");

    let cus = ALL_CUSTOMERS.find(c => cleanPhone(c[resolveKey(c, ['điện thoại', 'sdt'], 'Điện thoại')]) === phoneClean);
    if(!cus) return;

    let k_paid = resolveKey(cus, ['đã thu nợ'], 'Đã Thu Nợ');
    let daThuOld = Number(cus[k_paid] || 0);
    cus[k_paid] = daThuOld + payVal;
    
    localStorage.setItem('ALL_CUSTOMERS', JSON.stringify(ALL_CUSTOMERS));
    syncCustomerStatsToSheet(phoneClean);
    
    closeModal('payDebtModal');
    if(currentPage === 'customers') renderCustomersData();
    alert(`✅ Đã ghi nhận thu nợ thành công: ${formatMoney(payVal)}`);
}

function toggleAllCustomerChecks(el) { document.querySelectorAll('.chk-customer-box').forEach(c => c.checked = el.checked); }

document.addEventListener('DOMContentLoaded', () => { setTimeout(rebuildVipList, 2000); });