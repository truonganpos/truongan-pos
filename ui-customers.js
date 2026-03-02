const CUSTOMERS_UI = `
  <div class='sub-toolbar'>
      <div style='display:flex; gap:10px; align-items:center;'>
          <b style='font-size:16px;'>👥 KHÁCH HÀNG (<span id='customerCountDisplay'>0</span>)</b>
          <button class='action-btn blue' onclick='openCustomerModal()'>+ Thêm Mới</button>
      </div>
      <div class='view-toggle'>
          <button class='vbtn active' onclick='setViewMode("card")'>Thẻ</button>
          <button class='vbtn' onclick='setViewMode("table")'>Bảng</button>
      </div>
  </div>
  <div style='display:flex; gap:10px; margin-bottom:15px;'>
      <input class='tab-search-bar' id='searchCustomers' onkeyup='renderCustomersData(true)' placeholder='🔍 Tìm Mã KH, Tên, Số điện thoại...' style='margin-bottom:0; flex:1;' type='text'>
  </div>
  <div id='customersList'></div>
`;

document.addEventListener('DOMContentLoaded', () => {
    let el = document.getElementById('view-customers');
    if(el) el.innerHTML = CUSTOMERS_UI;
});