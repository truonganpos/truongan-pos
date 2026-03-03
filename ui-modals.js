const MODALS_UI = `
<div class='dropdown-content' id='inlineCatMenu'></div>

<div class='modal' id='settingsModal'>
  <div class='modal-content'>
    <button class='close-btn' onclick='closeModal("settingsModal")'>&#215;</button>
    <h2 style='margin-top:0; color:#3b82f6; font-size:18px;'>⚙️ CÀI ĐẶT HÓA ĐƠN & THANH TOÁN</h2>
    
    <div class='summary-box' style='margin-bottom:15px;'>
        <b style='display:block; margin-bottom:10px; color:inherit;'>THÔNG TIN IN TRÊN BILL</b>
        <label style='font-size:12px; opacity:0.8;'>Tên cửa hàng</label><input class='form-inp' id='setStoreName' placeholder='VD: TRƯỜNG AN STORE' type='text'>
        <label style='font-size:12px; opacity:0.8;'>Số điện thoại trên Bill</label><input class='form-inp' id='setStorePhone' placeholder='VD: 0987.xxx.xxx' type='text'>
        <label style='font-size:12px; opacity:0.8;'>Địa chỉ cửa hàng</label><input class='form-inp' id='setStoreAddress' placeholder='Tòa A, Khu B...' type='text'>
        <label style='font-size:12px; opacity:0.8;'>Lời cảm ơn cuối Bill</label><textarea class='form-inp' id='setBillNote' rows='2'></textarea>
    </div>

    <div class='auto-calc-box' style='display:block;'>
        <b style='display:block; margin-bottom:10px; color:#10b981;'>THIẾT LẬP MÃ QR NGÂN HÀNG</b>
        <p style='font-size:12px; opacity:0.8; margin-top:0;'>Điền chính xác để hệ thống tự tạo mã QR quét tự động điền số tiền trên hóa đơn.</p>
        <div class='form-grid-2'>
            <div><label style='font-size:12px;'>Ngân hàng (Tên viết tắt)</label><input class='form-inp' id='setBankId' placeholder='VD: MB, VCB, BIDV...' type='text'></div>
            <div><label style='font-size:12px;'>Số Tài Khoản</label><input class='form-inp' id='setAccNo' placeholder='VD: 123456789' type='text'></div>
            <div class='form-grid-full'><label style='font-size:12px;'>Tên Chủ Tài Khoản</label><input class='form-inp' id='setAccName' placeholder='VD: NGUYEN TRUONG AN' type='text'></div>
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
        <div class='form-grid-full'><label style='font-size:12px;opacity:0.8;'>Mã SP (Quét mã vạch) *</label><input class='form-inp' id='apId' type='text'></div>
        <div class='form-grid-full'><label style='font-size:12px;opacity:0.8;'>Tên Sản Phẩm *</label><input class='form-inp' id='apName' type='text'></div>
        <div><label style='font-size:12px;opacity:0.8;'>Tồn kho nhập vào</label><input class='form-inp' id='apStock' type='number' value='0'></div>
        <div><label style='font-size:12px;opacity:0.8;'>Loại - N</label><input class='form-inp' id='apCat' list='catDatalist' placeholder='Gõ để chọn hoặc tạo mới' type='text'></div>
        <div><label style='font-size:12px;opacity:0.8;'>Giá Gốc (Nhập)</label><input class='form-inp' id='apCost' type='number' value='0'></div>
        <div><label style='font-size:12px;opacity:0.8;'>Giá Sỉ (Nhập)</label><input class='form-inp' id='apWholesale' type='number' value='0'></div>
        <div class='form-grid-full'><label style='font-size:12px;color:#10b981;font-weight:bold;'>Giá Bán Lẻ</label><input class='form-inp' id='apRetail' type='number' value='0'></div>
    </div>
    <button class='action-btn green' onclick='saveNewProduct()' style='padding:12px; width:100%; margin-top:15px;'>LƯU VÀO KHO</button>
  </div>
</div>

<div class='modal' id='dupModal'><div class='modal-content'><button class='close-btn' onclick='closeModal("dupModal")'>&#215;</button><h2 style='margin-top:0; color:#ef4444; font-size:18px;'>CẢNH BÁO TRÙNG MÃ KHO</h2><div id='dupModalBody' style='max-height:400px; overflow-y:auto;'></div></div></div>
<div class='modal' id='syncLogModal'><div class='modal-content' style='max-width:400px;'><button class='close-btn' onclick='closeModal("syncLogModal")'>&#215;</button><h2 style='margin-top:0; color:#3b82f6; font-size:16px; border-bottom:1px solid #eee; padding-bottom:10px;'>📜 LỊCH SỬ ĐỒNG BỘ</h2><div id='syncLogBody' style='max-height: 400px; overflow-y:auto;'></div></div></div>

<div class='modal' id='customerModal'>
  <div class='modal-content'>
    <button class='close-btn' onclick='closeModal("customerModal")'>&#215;</button>
    <h2 id='cusModalTitle' style='margin-top:0; color:#3b82f6; font-size:18px;'>THÔNG TIN KHÁCH HÀNG</h2>
    <input id='cusOldPhone' type='hidden'>
    <label style='font-size:12px; opacity:0.8;'>Số điện thoại (Bắt buộc) *</label><input class='form-inp' id='cusEditPhone' placeholder='Nhập SĐT...' type='tel'>
    <label style='font-size:12px; opacity:0.8;'>Tên Khách Hàng</label><input class='form-inp' id='cusEditName' placeholder='Nhập Tên...' type='text'>
    <label style='font-size:12px; opacity:0.8;'>Nhóm Khách Hàng</label>
    <select class='form-inp' id='cusEditType'><option value='Khách Lẻ'>Khách Lẻ</option><option value='Khách Sỉ'>Khách Sỉ</option></select>
    <label style='font-size:12px; opacity:0.8;'>Địa chỉ</label><input class='form-inp' id='cusEditAddress' placeholder='Nhập Địa chỉ...' type='text'>
    <label style='font-size:12px; opacity:0.8;'>Link Facebook (Nếu có)</label><input class='form-inp' id='cusEditFB' placeholder='Dán link Facebook khách vào đây...' type='text'>
    <label style='font-size:12px; opacity:0.8;'>Nợ Đầu Kỳ (Chỉ nhập 1 lần)</label><input class='form-inp' id='cusEditDebt' placeholder='Nhập số tiền nợ...' type='number'>
    <button class='action-btn blue' onclick='saveCustomer()' style='padding:12px; width:100%; margin-top:10px;'>LƯU LẠI</button>
  </div>
</div>

<div class='modal' id='payDebtModal'>
  <div class='modal-content' style='max-width:400px;'>
    <button class='close-btn' onclick='closeModal("payDebtModal")'>&#215;</button>
    <h2 id='payDebtTitle' style='margin-top:0; color:#10b981; font-size:18px; border-bottom:1px solid #eee; padding-bottom:10px;'>💸 THANH TOÁN NỢ</h2>
    <input id='payDebtPhone' type='hidden'><input id='payDebtIsRefund' type='hidden' value='0'>
    <div style='margin-bottom:15px; font-size:14px;'>Khách hàng: <b id='payDebtName' style='color:#3b82f6;'>---</b><br><span id='payDebtLabel'>Tổng nợ hiện tại:</span> <b id='payDebtCurrent' style='color:#ef4444; font-size:16px;'>0 đ</b></div>
    <label id='payDebtInputLabel' style='font-size:12px; opacity:0.8; font-weight:bold; color:#10b981;'>Số tiền khách trả *</label>
    <input class='form-inp' id='payDebtAmount' placeholder='Nhập số tiền...' style='font-size:16px; font-weight:bold; color:#10b981;' type='number'>
    <button class='action-btn green' id='payDebtBtn' onclick='processPayDebt()' style='padding:12px; width:100%; margin-top:10px; font-size:14px;'>XÁC NHẬN THANH TOÁN</button>
  </div>
</div>

<div class='modal' id='orderModal'><div class='modal-content'><button class='close-btn' onclick='closeModal("orderModal")'>&#215;</button><h2 style='margin-top:0; color:#3b82f6; font-size:18px;'>CHI TIẾT ĐƠN HÀNG</h2><div id='orderModalBody'></div></div></div>

<div class='modal' id='editOrderModal'>
  <div class='modal-content'>
    <button class='close-btn' onclick='closeModal("editOrderModal")'>&#215;</button>
    <h2 style='margin-top:0; color:#3b82f6; font-size:18px; border-bottom:1px solid #eee; padding-bottom:10px;'>✏️ SỬA ĐƠN HÀNG</h2>
    <div style='position:relative; display:flex; gap:10px; flex-wrap:wrap;'>
        <select class='form-inp' id='eoCustomerType' onchange='changePriceType(true)' style='flex:1; margin:0; padding:10px; font-weight:bold; color:#0070f4;'><option value='Khách Lẻ'>💰 Giá Lẻ</option><option value='Khách Sỉ'>🏢 Giá Sỉ</option></select>
        <input class='form-inp' id='eoPhone' onkeyup='showCustomerSuggest(this, true, "cusSuggestEdit")' placeholder='SĐT Khách' style='flex:1; margin:0;' type='tel'>
        <input class='form-inp' id='eoName' onkeyup='showCustomerSuggest(this, true, "cusSuggestEdit")' placeholder='Tên khách hàng' style='flex:2; margin:0;' type='text'>
        <div class='suggest-box' id='cusSuggestEdit' style='top:42px; left:0; width:100%;'></div>
    </div>
    <input class='form-inp' id='eoAddress' placeholder='Địa chỉ' type='text' style='margin-top:10px;'>
    
    <div style='display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;'>
       <div style='display:flex; flex:1; gap:5px; margin:0;'>
           <select class='form-inp' id='eoShippingCarrier' style='flex:1; margin:0;'>
               <option value=''>Giao tại quầy</option><option value='GHTK'>Giao Hàng Tiết Kiệm</option><option value='Viettel Post'>Viettel Post</option>
               <option value='Shopee Xpress'>Shopee Xpress</option><option value='Gửi Xe Khách'>Gửi Xe Khách</option><option value='AhaMove'>AhaMove / Grab</option>
           </select>
           <button class='action-btn green' onclick='addNewCarrier(true)' style='margin:0; padding:0 12px; font-size:16px;' title='Thêm nhà xe mới'>+</button>
       </div>
       <input class='form-inp' id='eoShippingCode' placeholder='Mã vận đơn / Biển số...' style='flex:1.5; margin:0;' type='text'>
       <input class='form-inp' id='eoShippingFee' oninput='updateOrderSummary(true)' placeholder='Phí Ship (đ)' style='flex:1; margin:0;' type='number'>
    </div>

    <input id='eoOldDebt' type='hidden' value='0'>
    <textarea class='form-inp' id='eoNote' placeholder='Ghi chú...' rows='2' style='margin-top:10px;'></textarea>
    
    <label style='font-size:13px; font-weight:bold; color:inherit; margin-top:5px; display:block;'>Thêm mặt hàng (Nhập mã/tên rồi Enter):</label>
    <div style='display:flex; gap:5px; margin-bottom:15px;'>
        <input class='form-inp' id='productInputEdit' list='productDatalist' onkeypress='if(event.key==="Enter") { addTempItemToOrder(true); return false; }' placeholder='Gõ tìm SP...' style='flex:2; margin:0;' type='text'>
        <input class='form-inp' id='eoQty' min='1' onkeypress='if(event.key==="Enter") { addTempItemToOrder(true); return false; }' placeholder='SL' style='flex:1; margin:0;' type='number' value='1'>
        <button class='action-btn gray' onclick='addTempItemToOrder(true)' style='margin:0;'>+ Thêm SP</button>
    </div>
    
    <div id='eoItemsList' style='padding:10px; border-radius:8px; border:1px solid #444; margin-bottom:10px; max-height:250px; overflow-y:auto;'></div>

    <div style='display:flex; gap:15px; flex-wrap:wrap; margin-bottom:10px;'>
        <div style='flex:1;'><label style='font-size:12px;opacity:0.8;'>% Giảm giá đơn</label><input class='form-inp' id='eoDiscount' oninput='updateOrderSummary(true)' placeholder='VD: 5' type='number'></div>
        <div style='flex:1;'>
            <label style='font-size:12px;color:#3b82f6;font-weight:bold;'>Khách thanh toán</label>
            <div style='display:flex; gap:5px; margin-top:2px; margin-bottom:5px;'>
                <button class='action-btn gray' onclick='autoFillPaid("current", true)' style='padding:2px 5px; font-size:10px;'>Tiền đơn</button>
                <button class='action-btn gray' onclick='autoFillPaid("all", true)' style='padding:2px 5px; font-size:10px;'>Tất toán</button>
            </div>
            <input class='form-inp' id='eoPaid' oninput='updateOrderSummary(true)' placeholder='Nhập số tiền...' style='margin-top:0;' type='number'>
        </div>
    </div>
    <div class='summary-box' id='eoSummary'></div>
    <button class='action-btn green' onclick='saveEditOrder()' style='padding:12px; width:100%; font-size:15px;'>💾 LƯU ĐƠN HÀNG</button>
  </div>
</div>

<div class='modal' id='productModal'>
  <div class='modal-content'>
    <button class='close-btn' onclick='closeModal("productModal")'>&#215;</button>
    <h2 style='margin-top:0; color:#3b82f6; font-size:18px; margin-bottom:10px;'>SỬA SẢN PHẨM</h2>
    <div class='auto-calc-box'>
       <div style='width:100%; font-size:12px; color:#10b981; font-weight:bold; margin-bottom:2px;'>💡 Tính giá bán (Làm tròn hàng trăm):</div>
       <input class='form-inp' id='smartLoiNhuan' oninput='autoCalcRealtimePrice()' placeholder='% Lãi (VD: 20)' type='number'>
       <input class='form-inp' id='smartKM' oninput='autoCalcRealtimePrice()' placeholder='% Giảm (VD: 10)' type='number'>
    </div>
    <div class='form-grid-2' id='productModalBody'></div>
    <button class='action-btn blue' onclick='saveEditProduct()' style='padding:12px; width:100%; margin-top:15px;'>LƯU LẠI</button>
  </div>
</div>

<div class='modal' id='imageModal'><div class='modal-content img-zoom-content' style='padding:0; background:transparent; box-shadow:none;'><button class='close-btn' onclick='closeModal("imageModal")'>&#215;</button><img id='previewImgSrc' src='' style='max-width:100%; border-radius:12px;'></div></div>

<div class='modal' id='returnModal'>
  <div class='modal-content' style='max-width:700px;'>
    <button class='close-btn' onclick='closeModal("returnModal")'>&#215;</button>
    <h2 style='margin-top:0; color:#ef4444; font-size:18px; border-bottom:1px solid #eee; padding-bottom:10px;'>🔄 TRUNG TÂM TRẢ HÀNG</h2>
    <div class='return-zone-box'>
        <label style='font-size:13px; font-weight:bold; color:#ef4444;'>Quét / Tìm (Mã Đơn, SĐT, Tên KH, Mã SP):</label>
        <div style='display:flex; gap:10px; margin-top:5px;'>
            <input class='form-inp' id='returnSearchInput' onkeypress='if(event.key==="Enter") searchReturnItem()' placeholder='VD: 098... hoặc DH_... hoặc Mã SP' style='margin:0; flex:1;' type='text'>
            <button class='action-btn red' onclick='searchReturnItem()'>🔍 Tìm</button>
        </div>
        <div id='returnSearchInfo' style='font-size:12px; margin-top:5px; color:#555;'></div>
    </div>
    <label style='font-size:13px; font-weight:bold;'>Danh sách hàng hoàn trả:</label>
    <div class='return-list-box' id='returnCartList'><i style='opacity:0.6; font-size:12px;'>Chưa có sản phẩm nào...</i></div>
    <div class='return-total-box'>
        <span style='font-size:15px; font-weight:bold;'>TỔNG TIỀN HOÀN KHÁCH:</span>
        <span id='returnTotalDisplay' style='font-size:20px; font-weight:bold; color:#ef4444;'>0 đ</span>
    </div>
    <div style='display:flex; gap:10px;'>
        <textarea class='form-inp' id='returnNote' placeholder='Lý do trả hàng...' rows='1' style='margin:0; flex:2;'></textarea>
        <button class='action-btn red' onclick='processReturn()' style='flex:1; padding:12px; font-size:14px;'>XÁC NHẬN HOÀN TRẢ</button>
    </div>
  </div>
</div>
`;

document.addEventListener('DOMContentLoaded', () => {
    let div = document.createElement('div');
    div.innerHTML = MODALS_UI;
    document.body.appendChild(div);
});
