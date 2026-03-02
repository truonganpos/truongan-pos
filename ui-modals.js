const ALL_MODALS_UI = `
<div class='dropdown-content' id='inlineCatMenu'></div>

<div class='modal' id='settingsModal'>
  <div class='modal-content'>
    <button class='close-btn' onclick='closeModal("settingsModal")'>&#215;</button>
    <h2 style='margin-top:0; color:#3b82f6; font-size:18px;'>&#9881;&#65039; CÀI ĐẶT HÓA ĐƠN & THANH TOÁN</h2>
    <div style='background:var(--btn-bg, #f8fafc); padding:15px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:15px;'>
        <b style='display:block; margin-bottom:10px; color:inherit;'>THÔNG TIN IN TRÊN BILL</b>
        <label style='font-size:12px; opacity:0.8;'>Tên cửa hàng</label><input class='form-inp' id='setStoreName' type='text'>
        <label style='font-size:12px; opacity:0.8;'>Số điện thoại trên Bill</label><input class='form-inp' id='setStorePhone' type='text'>
        <label style='font-size:12px; opacity:0.8;'>Địa chỉ cửa hàng</label><input class='form-inp' id='setStoreAddress' type='text'>
        <label style='font-size:12px; opacity:0.8;'>Lời cảm ơn cuối Bill</label><textarea class='form-inp' id='setBillNote' rows='2'></textarea>
    </div>
    <div style='background:var(--btn-bg, #f0fdf4); padding:15px; border-radius:8px; border:1px solid #bbf7d0;'>
        <b style='display:block; margin-bottom:10px; color:#10b981;'>THIẾT LẬP MÃ QR NGÂN HÀNG</b>
        <div class='form-grid-2'>
            <div><label style='font-size:12px;'>Ngân hàng (Mã viết tắt)</label><input class='form-inp' id='setBankId' type='text'></div>
            <div><label style='font-size:12px;'>Số Tài Khoản</label><input class='form-inp' id='setAccNo' type='text'></div>
            <div class='form-grid-full'><label style='font-size:12px;'>Tên Chủ Tài Khoản</label><input class='form-inp' id='setAccName' type='text'></div>
        </div>
    </div>
    <button class='action-btn blue' onclick='saveSettingsInfo()' style='padding:12px; width:100%; margin-top:15px;'>💾 LƯU CÀI ĐẶT</button>
  </div>
</div>

<div class='modal' id='addSpModal'>
  <div class='modal-content'>
    <button class='close-btn' onclick='closeModal("addSpModal")'>&#215;</button>
    <h2 style='margin-top:0; color:#10b981; font-size:18px;'>THÊM SẢN PHẨM VÀO KHO</h2>
    <div class='form-grid-2'>
        <div class='form-grid-full'><label style='font-size:12px;opacity:0.8;'>Mã SP *</label><input class='form-inp' id='apId' type='text'></div>
        <div class='form-grid-full'><label style='font-size:12px;opacity:0.8;'>Tên Sản Phẩm *</label><input class='form-inp' id='apName' type='text'></div>
        <div><label style='font-size:12px;opacity:0.8;'>Tồn kho nhập vào</label><input class='form-inp' id='apStock' type='number' value='0'></div>
        <div><label style='font-size:12px;opacity:0.8;'>Loại - N</label><input class='form-inp' id='apCat' list='catDatalist' type='text'></div>
        <div><label style='font-size:12px;opacity:0.8;'>Giá Gốc</label><input class='form-inp' id='apCost' type='number' value='0'></div>
        <div><label style='font-size:12px;opacity:0.8;'>Giá Sỉ</label><input class='form-inp' id='apWholesale' type='number' value='0'></div>
        <div class='form-grid-full'><label style='font-size:12px;color:#10b981;font-weight:bold;'>Giá Bán Lẻ</label><input class='form-inp' id='apRetail' type='number' value='0'></div>
    </div>
    <button class='action-btn green' onclick='saveNewProduct()' style='padding:12px; width:100%; margin-top:15px;'>LƯU VÀO KHO</button>
  </div>
</div>

<div class='modal' id='dupModal'><div class='modal-content'><button class='close-btn' onclick='closeModal("dupModal")'>&#215;</button><h2 style='margin-top:0; color:#ef4444; font-size:18px;'>CẢNH BÁO TRÙNG MÃ KHO</h2><div id='dupModalBody'></div></div></div>
<div class='modal' id='syncLogModal'><div class='modal-content' style='max-width:400px;'><button class='close-btn' onclick='closeModal("syncLogModal")'>&#215;</button><h2 style='margin-top:0; color:#3b82f6; font-size:16px;'>📜 LỊCH SỬ ĐỒNG BỘ</h2><div id='syncLogBody'></div></div></div>

<div class='modal' id='customerModal'>
  <div class='modal-content'>
    <button class='close-btn' onclick='closeModal("customerModal")'>&#215;</button>
    <h2 id='cusModalTitle' style='margin-top:0; color:#3b82f6; font-size:18px;'>THÔNG TIN KHÁCH HÀNG</h2>
    <input id='cusOldPhone' type='hidden'>
    <label style='font-size:12px; opacity:0.8;'>Số điện thoại *</label><input class='form-inp' id='cusEditPhone' type='tel'>
    <label style='font-size:12px; opacity:0.8;'>Tên Khách Hàng</label><input class='form-inp' id='cusEditName' type='text'>
    <label style='font-size:12px; opacity:0.8;'>Nhóm</label><select class='form-inp' id='cusEditType'><option value='Khách Lẻ'>Khách Lẻ</option><option value='Khách Sỉ'>Khách Sỉ</option></select>
    <label style='font-size:12px; opacity:0.8;'>Địa chỉ</label><input class='form-inp' id='cusEditAddress' type='text'>
    <label style='font-size:12px; opacity:0.8;'>Link Facebook</label><input class='form-inp' id='cusEditFB' type='text'>
    <label style='font-size:12px; opacity:0.8;'>Nợ Đầu Kỳ</label><input class='form-inp' id='cusEditDebt' type='number'>
    <button class='action-btn blue' onclick='saveCustomer()' style='padding:12px; width:100%; margin-top:10px;'>LƯU LẠI</button>
  </div>
</div>

<div class='modal' id='payDebtModal'>
  <div class='modal-content' style='max-width:400px;'>
    <button class='close-btn' onclick='closeModal("payDebtModal")'>&#215;</button>
    <h2 id='payDebtTitle' style='margin-top:0; color:#10b981; font-size:18px;'>💸 THANH TOÁN NỢ</h2>
    <input id='payDebtPhone' type='hidden'><input id='payDebtIsRefund' type='hidden' value='0'>
    <div style='margin-bottom:15px; font-size:14px;'>Khách: <b id='payDebtName'></b><br><span id='payDebtLabel'>Tổng nợ:</span> <b id='payDebtCurrent' style='color:#ef4444; font-size:16px;'>0 đ</b></div>
    <label style='font-size:12px; font-weight:bold; color:#10b981;'>Số tiền khách trả *</label><input class='form-inp' id='payDebtAmount' type='number'>
    <button class='action-btn green' id='payDebtBtn' onclick='processPayDebt()' style='padding:12px; width:100%;'>XÁC NHẬN</button>
  </div>
</div>

<div class='modal' id='orderModal'><div class='modal-content'><button class='close-btn' onclick='closeModal("orderModal")'>&#215;</button><h2 style='margin-top:0; color:#3b82f6; font-size:18px;'>CHI TIẾT ĐƠN HÀNG</h2><div id='orderModalBody'></div></div></div>

<div class='modal' id='editOrderModal'>
  <div class='modal-content'>
    <button class='close-btn' onclick='closeModal("editOrderModal")'>&#215;</button>
    <h2 style='margin-top:0; color:#3b82f6; font-size:18px;'>&#9999;&#65039; SỬA ĐƠN HÀNG</h2>
    <div style='position:relative; display:flex; gap:10px; flex-wrap:wrap;'>
        <select class='form-inp' id='eoCustomerType' onchange='changePriceType(true)' style='flex:1; margin:0;'><option value='Khách Lẻ'>Giá Lẻ</option><option value='Khách Sỉ'>Giá Sỉ</option></select>
        <input class='form-inp' id='eoPhone' onkeyup='showCustomerSuggest(this, true, "cusSuggestEdit")' placeholder='SĐT Khách' style='flex:1; margin:0;' type='tel'>
        <input class='form-inp' id='eoName' onkeyup='showCustomerSuggest(this, true, "cusSuggestEdit")' placeholder='Tên khách' style='flex:2; margin:0;' type='text'>
        <div class='suggest-box' id='cusSuggestEdit'></div>
    </div>
    <input class='form-inp' id='eoAddress' placeholder='Địa chỉ' type='text' style='margin-top:10px;'>
    
    <div style='display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;'>
       <div style='display:flex; flex:1; gap:5px; margin:0;'>
           <select class='form-inp' id='eoShippingCarrier' style='flex:1; margin:0;'>
               <option value=''>Giao tại quầy</option><option value='GHTK'>Giao Hàng Tiết Kiệm</option>
               <option value='Viettel Post'>Viettel Post</option><option value='Shopee Xpress'>Shopee Xpress</option>
               <option value='Gửi Xe Khách'>Gửi Xe Khách</option><option value='AhaMove'>AhaMove / Grab</option>
           </select>
           <button class='action-btn green' onclick='addNewCarrier(true)' style='margin:0; padding:0 12px; font-size:16px;'>+</button>
       </div>
       <input class='form-inp' id='eoShippingCode' placeholder='Mã vận đơn / Biển số...' style='flex:1; margin:0;' type='text'>
       <input class='form-inp' id='eoShippingFee' oninput='updateOrderSummary(true)' placeholder='Phí Ship (đ)' style='flex:1; margin:0;' type='number'>
    </div>

    <input id='eoOldDebt' type='hidden' value='0'>
    <div style='display:flex; gap:5px; margin:15px 0;'>
        <input class='form-inp' id='productInputEdit' list='productDatalist' onkeypress='if(event.key==="Enter") { addTempItemToOrder(true); return false; }' placeholder='Gõ tìm SP...' style='flex:2; margin:0;' type='text'>
        <input class='form-inp' id='eoQty' min='1' onkeypress='if(event.key==="Enter") { addTempItemToOrder(true); return false; }' placeholder='SL' style='flex:1; margin:0;' type='number' value='1'>
        <button class='action-btn gray' onclick='addTempItemToOrder(true)' style='margin:0;'>+ Thêm SP</button>
    </div>
    <div id='eoItemsList' style='padding:10px; border-radius:8px; border:1px solid #444; margin-bottom:10px; max-height:250px; overflow-y:auto;'></div>
    <div style='display:flex; gap:15px; flex-wrap:wrap; margin-bottom:10px;'>
        <div style='flex:1;'><label style='font-size:12px;opacity:0.8;'>% Giảm giá</label><input class='form-inp' id='eoDiscount' oninput='updateOrderSummary(true)' type='number'></div>
        <div style='flex:1;'><label style='font-size:12px;color:#3b82f6;font-weight:bold;'>Khách thanh toán</label><input class='form-inp' id='eoPaid' oninput='updateOrderSummary(true)' type='number'></div>
    </div>
    <div class='summary-box' id='eoSummary'></div>
    <button class='action-btn green' onclick='saveEditOrder()' style='padding:12px; width:100%; font-size:15px;'>💾 LƯU ĐƠN HÀNG</button>
  </div>
</div>

<div class='modal' id='productModal'><div class='modal-content'><button class='close-btn' onclick='closeModal("productModal")'>&#215;</button><h2 style='margin-top:0; color:#3b82f6; font-size:18px;'>SỬA SẢN PHẨM</h2><div class='auto-calc-box'><input class='form-inp' id='smartLoiNhuan' oninput='autoCalcRealtimePrice()' placeholder='% Lãi (VD: 20)' type='number'><input class='form-inp' id='smartKM' oninput='autoCalcRealtimePrice()' placeholder='% Giảm (VD: 10)' type='number'></div><div class='form-grid-2' id='productModalBody'></div><button class='action-btn blue' onclick='saveEditProduct()' style='padding:12px; width:100%; margin-top:15px;'>LƯU LẠI</button></div></div>
<div class='modal' id='imageModal'><div class='modal-content img-zoom-content' style='padding:0; background:transparent; box-shadow:none;'><button class='close-btn' onclick='closeModal("imageModal")'>&#215;</button><img id='previewImgSrc' src='' style='max-width:100%; border-radius:12px;'></div></div>
<div class='modal' id='returnModal'><div class='modal-content' style='max-width:700px;'><button class='close-btn' onclick='closeModal("returnModal")'>&#215;</button><h2 style='margin-top:0; color:#ef4444; font-size:18px;'>🔄 TRUNG TÂM TRẢ HÀNG</h2><div class='return-zone-box'><label style='font-size:13px; font-weight:bold; color:#ef4444;'>Quét / Tìm:</label><div style='display:flex; gap:10px; margin-top:5px;'><input class='form-inp' id='returnSearchInput' onkeypress='if(event.key==="Enter") searchReturnItem()' placeholder='Mã Đơn, SĐT...' style='margin:0; flex:1;' type='text'><button class='action-btn red' onclick='searchReturnItem()'>🔍 Tìm</button></div><div id='returnSearchInfo' style='font-size:12px; margin-top:5px; color:#555;'></div></div><div class='return-list-box' id='returnCartList'></div><div class='return-total-box'><span style='font-size:15px; font-weight:bold;'>TỔNG TIỀN HOÀN:</span><span id='returnTotalDisplay' style='font-size:20px; font-weight:bold; color:#ef4444;'>0 đ</span></div><div style='display:flex; gap:10px;'><textarea class='form-inp' id='returnNote' placeholder='Lý do trả hàng...' rows='1' style='margin:0; flex:2;'></textarea><button class='action-btn red' onclick='processReturn()' style='flex:1; padding:12px;'>XÁC NHẬN</button></div></div></div>
`;

document.addEventListener('DOMContentLoaded', () => {
    let div = document.createElement('div');
    div.innerHTML = ALL_MODALS_UI;
    document.body.appendChild(div);
});