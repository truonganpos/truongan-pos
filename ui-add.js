const ADD_UI = `
  <div class='card' style='display:block; max-width:700px; margin:0 auto; padding:25px; border:none; box-shadow:none; background:transparent;'>
    <h3 style='margin-top:0;text-align:center;color:#0070f4;padding-bottom:10px;'>TẠO ĐƠN HÀNG MỚI</h3>
    
    <div style='position:relative; display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px; align-items:center;'>
        <select class='form-inp' id='cCustomerType' onchange='changePriceType(false); saveDraftLocal()' style='flex:1; margin:0; padding:10px; font-weight:bold; color:#0070f4;'>
            <option value='Khách Lẻ'>💰 Giá Lẻ</option><option value='Khách Sỉ'>🏢 Giá Sỉ</option>
        </select>
        <input class='form-inp' id='cPhone' onchange='saveDraftLocal()' onfocus='showCustomerSuggest(this, false, "cusSuggestAdd")' onclick='showCustomerSuggest(this, false, "cusSuggestAdd")' onkeyup='showCustomerSuggest(this, false, "cusSuggestAdd"); saveDraftLocal();' placeholder='SĐT (Gõ để tìm)' style='flex:1; margin:0;' type='tel'>
        <input class='form-inp' id='cName' onchange='saveDraftLocal()' onfocus='showCustomerSuggest(this, false, "cusSuggestAdd")' onclick='showCustomerSuggest(this, false, "cusSuggestAdd")' onkeyup='showCustomerSuggest(this, false, "cusSuggestAdd"); saveDraftLocal();' placeholder='Tên khách hàng *' style='flex:2; margin:0;' type='text'>
        <div class='suggest-box' id='cusSuggestAdd'></div>
    </div>
    
    <input class='form-inp' id='cAddress' onchange='saveDraftLocal()' onkeyup='saveDraftLocal()' placeholder='Địa chỉ giao hàng' type='text'>
    
    <div style='display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;'>
       <div style='display:flex; flex:1; gap:5px; margin:0;'>
           <select class='form-inp' id='cShippingCarrier' onchange='saveDraftLocal()' style='flex:1; margin:0;'>
               <option value=''>Giao tại quầy</option><option value='GHTK'>Giao Hàng Tiết Kiệm</option><option value='Viettel Post'>Viettel Post</option>
               <option value='Shopee Xpress'>Shopee Xpress</option><option value='Gửi Xe Khách'>Gửi Xe Khách</option><option value='AhaMove'>AhaMove / Grab</option>
           </select>
           <button class='action-btn green' onclick='addNewCarrier(false)' style='margin:0; padding:0 12px; font-size:16px;' title='Thêm nhà xe mới'>+</button>
       </div>
       <input class='form-inp' id='cShippingCode' onchange='saveDraftLocal()' placeholder='Mã vận đơn / Biển số...' style='flex:1; margin:0;' type='text'>
       <input class='form-inp' id='cShippingFee' oninput='updateOrderSummary(false); saveDraftLocal();' placeholder='Phí Ship (đ)' style='flex:1; margin:0;' type='number'>
    </div>

    <input id='cOldDebt' type='hidden' value='0'>
    
    <label style='font-size:13px; font-weight:bold; color:inherit; margin-top:10px; display:block;'>Tìm VÀ Thêm sản phẩm (Gõ Tên/Mã rồi nhấn Enter):</label>
    <div style='display:flex; gap:10px; margin-bottom:10px;'>
        <input class='form-inp' id='productInputAdd' list='productDatalist' onkeypress='if(event.key==="Enter") { addTempItemToOrder(false); return false; }' placeholder='Gõ tìm SP...' style='flex:2; margin:0;' type='text'>
        <datalist id='productDatalist'></datalist>
        <input class='form-inp' id='qty' min='1' onkeypress='if(event.key==="Enter") { addTempItemToOrder(false); return false; }' placeholder='Số lượng' style='flex:1; margin:0;' type='number' value='1'>
        <button class='action-btn gray' onclick='addTempItemToOrder(false)' style='margin:0;'>+ Thêm</button>
    </div>

    <div id='tempOrderItems' style='margin-bottom:15px;'></div>

    <div style='display:flex; gap:15px; flex-wrap:wrap; margin-bottom:10px;'>
        <div style='flex:1;'><label style='font-size:12px;opacity:0.8;'>% Giảm giá Hóa đơn</label><input class='form-inp' id='cDiscount' oninput='updateOrderSummary(false); saveDraftLocal();' placeholder='VD: 5' type='number'></div>
        <div style='flex:1;'>
            <label style='font-size:12px;color:#3b82f6;font-weight:bold;'>Khách trả trước</label>
            <div style='display:flex; gap:5px; margin-top:2px; margin-bottom:5px;'>
               <button class='action-btn gray' onclick='autoFillPaid("current", false)' style='padding:2px 5px; font-size:10px;'>Tiền đơn này</button>
               <button class='action-btn gray' onclick='autoFillPaid("all", false)' style='padding:2px 5px; font-size:10px;'>Tất toán</button>
            </div>
            <input class='form-inp' id='cPaid' oninput='updateOrderSummary(false); saveDraftLocal();' placeholder='Nhập số tiền...' style='margin-top:0;' type='number'>
        </div>
    </div>

    <div class='summary-box' id='addOrderSummary' style='display:none;'></div>
    <textarea class='form-inp' id='cNote' onchange='saveDraftLocal()' onkeyup='saveDraftLocal()' placeholder='Ghi chú thêm...' rows='2'></textarea>
    
    <div style='display:flex; gap:10px; margin-top:10px;'>
        <button class='action-btn gray' onclick='clearDraftLocal()' style='padding:14px; font-size:14px; flex:1;'>🗑️ Bỏ nháp</button>
        <button class='action-btn orange' onclick='handleAddOrder("Nháp")' style='padding:14px; font-size:14px; flex:1;'>💾 LƯU NHÁP</button>
        <button class='action-btn blue' onclick='handleAddOrder("Chờ xử lý")' style='padding:14px; font-size:14px; flex:2;'>XÁC NHẬN TẠO ĐƠN</button>
    </div>

    <div id='recentDraftsZone' style='margin-top:30px; border-top:2px dashed #ccc; padding-top:20px; display:none;'>
        <h4 style='margin:0 0 10px 0; color:#f59e0b;'>🕒 CÁC ĐƠN ĐANG CHỜ GỘP / CHƯA GIAO:</h4>
        <div id='recentDraftsList' style='display:flex; flex-direction:column; gap:12px; max-height:400px; overflow-y:auto; padding-right:5px;'></div>
    </div>
  </div>
`;

document.addEventListener('DOMContentLoaded', () => { let el = document.getElementById('view-add'); if(el) el.innerHTML = ADD_UI; });
