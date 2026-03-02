const PRODUCTS_UI = `
  <input class='tab-search-bar' id='searchProducts' onkeyup='renderProductsData(true)' placeholder='🔍 Tìm Tên hoặc Mã Sản phẩm...' type='text'>
  <div class='sub-toolbar'>
    <div style='display:flex; gap:10px; align-items:center; flex-wrap:wrap;'>
        <b style='font-size:16px;'>📦 KHO HÀNG (<span id='prodCountDisplay'>0</span>)</b>
        <button class='action-btn green' onclick='openAddProductModal()'>+ Thêm SP</button>
        <button class='action-btn orange' id='btnCheckDup' onclick='checkDuplicatesFromSheet()'>🔄 Check Trùng</button>
        <div class='dropdown'>
            <button class='icon-btn' onclick='toggleDropdown(event, "colMenuProducts")'>&#9881;&#65039; Cột hiển thị</button>
            <div class='dropdown-content' id='colMenuProducts'></div>
        </div>
    </div>
    <div class='view-toggle'>
      <button class='vbtn active' onclick='setViewMode("card")'>Thẻ</button><button class='vbtn' onclick='setViewMode("table")'>Bảng</button>
    </div>
  </div>
  <div class='cat-filter-bar' id='catFilterBar'></div>
  
  <div class='bulk-bar' id='bulkEditBar'>
     <div style='display:flex; justify-content:space-between; width:100%; border-bottom:1px solid #ccc; padding-bottom:10px; margin-bottom:10px; flex-wrap:wrap; gap:10px;'>
        <b style='color:inherit;font-size:14px; display:flex; align-items:center;'>&#9999;&#65039; Sửa nhanh (<span id='selCount' style='color:#0070f4;font-weight:bold; margin:0 4px;'>0</span> SP đang chọn)</b>
        <div style='display:flex; gap:10px;'>
            <button class='action-btn red' onclick='deleteSelectedProducts()' style='padding:6px 15px;'>🗑&#65039; Xóa SP Đã Chọn</button>
            <button class='action-btn blue' onclick='applyBulkEdit()' style='padding:6px 15px;'>💾 Lưu Áp Dụng</button>
        </div>
     </div>
     <div style='font-size:12px; opacity:0.8; margin-bottom:10px;'>Chỉ điền vào ô bạn muốn thay đổi. Các ô để trống sẽ giữ nguyên.</div>
     <div class='bulk-grid' id='bulkFormGrid'></div>
  </div>
  <div id='productsList'></div>
`;

document.addEventListener('DOMContentLoaded', () => {
    let el = document.getElementById('view-products');
    if(el) el.innerHTML = PRODUCTS_UI;
});