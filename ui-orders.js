const ORDERS_UI = `
  <div class='sub-toolbar'>
    <div style='display:flex; gap:10px; align-items:center;'>
        <b style='font-size:16px;'>🧾 ĐƠN HÀNG (<span id='orderCountDisplay'>0</span>)</b>
        <div class='dropdown'>
            <button class='icon-btn' onclick='toggleDropdown(event, "colMenuOrders")'>&#9881;&#65039; Cột</button>
            <div class='dropdown-content' id='colMenuOrders'></div>
        </div>
    </div>
    <div style='display:flex; gap:10px; align-items:center;'>
        <select class='form-inp' id='orderStatusFilter' onchange='renderOrdersData(true)' style='width:auto; margin:0; padding:4px 8px; font-weight:600; font-size:12px;'>
            <option value='ALL'>Lọc: Tất cả</option>
            <option value='Nháp'>Nháp</option>
            <option value='Chờ xử lý'>Chờ xử lý</option>
            <option value='Đang giao'>Đang giao (Chờ COD)</option>
            <option value='Đã giao'>Đã giao</option>
            <option value='Đã hoàn trả'>Đã hoàn trả</option>
        </select>
        <div class='view-toggle'>
          <button class='vbtn active' onclick='setViewMode("card")'>Thẻ</button><button class='vbtn' onclick='setViewMode("table")'>Bảng</button>
        </div>
    </div>
  </div>
  <div style='display:flex; gap:10px; margin-bottom:15px;'>
     <input class='tab-search-bar' id='searchOrders' onkeyup='renderOrdersData(true)' placeholder='🔍 Tìm SĐT, Tên khách, Mã đơn...' style='margin-bottom:0; flex:1;' type='text'>
  </div>
  <div id='ordersList'></div>
`;

document.addEventListener('DOMContentLoaded', () => {
    let el = document.getElementById('view-orders');
    if(el) el.innerHTML = ORDERS_UI;
});