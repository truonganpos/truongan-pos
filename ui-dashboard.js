const DASHBOARD_UI = `
  <div class='sub-toolbar'>
     <b style='font-size:16px;'>📊 TỔNG QUAN</b>
     <select class='form-inp' id='dashTimeFilter' onchange='renderAdvancedDashboard()' style='width:auto; margin:0; padding:6px; font-weight:bold; color:#0070f4;'>
        <option value='today'>Hôm nay</option><option value='yesterday'>Hôm qua</option><option selected='selected' value='7days'>7 Ngày qua</option>
        <option value='month'>Tháng này</option><option value='lastmonth'>Tháng trước</option><option value='all'>Tất cả</option>
     </select>
  </div>
  <div class='dashboard-grid' id='dashGrid'>
     <div class='dashboard-metric'>
        <span style='font-size:30px;'>💰</span><br>
        <span style='font-weight:600; font-size:13px; opacity:0.8;'>DOANH THU THỰC</span><br>
        <span id='dashRev' style='font-size:24px; font-weight:bold; color:#3b82f6; display:block; margin-top:8px;'>0 đ</span>
     </div>
     <div class='dashboard-metric'>
        <span style='font-size:30px;'>📈</span><br>
        <span style='font-weight:600; font-size:13px; opacity:0.8;'>LỢI NHUẬN TẠM TÍNH</span><br>
        <span id='dashProfit' style='font-size:24px; font-weight:bold; color:#10b981; display:block; margin-top:8px;'>0 đ</span>
        <span id='dashMargin' style='font-size:12px; opacity:0.8; margin-top:5px;'>Biên lãi: 0%</span>
     </div>
     <div class='dashboard-metric cod-card'>
        <span style='font-size:30px;'>🚚</span><br>
        <span style='font-weight:600; font-size:13px; color:#f59e0b;'>CHỜ THU COD (ĐI VẮNG)</span><br>
        <span id='dashCOD' style='font-size:24px; font-weight:bold; color:#f59e0b; display:block; margin-top:8px;'>0 đ</span>
     </div>
     <div class='dashboard-metric'>
        <span style='font-size:30px;'>📉</span><br>
        <span style='font-weight:600; font-size:13px; opacity:0.8;'>CHI PHÍ VỐN</span><br>
        <span id='dashCost' style='font-size:24px; font-weight:bold; color:#ef4444; display:block; margin-top:8px;'>0 đ</span>
     </div>
     <div class='dashboard-metric'>
        <span style='font-size:30px;'>📦</span><br>
        <span style='font-weight:600; font-size:13px; opacity:0.8;'>ĐƠN HÀNG / SP BÁN</span><br>
        <span id='dashItems' style='font-size:24px; font-weight:bold; color:#64748b; display:block; margin-top:8px;'>0 / 0</span>
     </div>
  </div>
  <div class='chart-container'><canvas id='revenueChart'></canvas></div>
  <div style='display:flex; flex-wrap:wrap; gap:15px; margin-top:20px;'>
     <div class='card dash-col'><h3 style='margin-top:0; font-size:15px; border-bottom:1px dashed #eee; padding-bottom:10px;'>🏆 Top 10 Sản Phẩm Bán Chạy</h3><div id='topProductsTable'></div></div>
     <div class='card dash-col'><h3 style='margin-top:0; font-size:15px; border-bottom:1px dashed #eee; padding-bottom:10px;'>💎 Top 10 Khách VIP</h3><div id='topCustomersTable'></div></div>
  </div>
`;

document.addEventListener('DOMContentLoaded', () => {
    let el = document.getElementById('view-dashboard');
    if(el) el.innerHTML = DASHBOARD_UI;
});