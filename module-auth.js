let currentUser = safeParseObj('currentUser');

function checkInitialAuth() {
    let overlay = document.getElementById('loginOverlay');
    let ui = document.getElementById("loadingUI");
    
    if (currentUser && currentUser.success) {
        if(overlay) overlay.style.display = 'none';
        applyRoleUI();
        
        // KIỂM TRA BỘ NHỚ ĐỆM: NẾU ĐÃ CÓ DATA -> VÀO THẲNG APP TRONG 0.1 GIÂY
        if (typeof ALL_PRODUCTS !== 'undefined' && (ALL_PRODUCTS.length > 0 || ALL_ORDERS.length > 0)) {
            if(ui) ui.style.display = "none";
            if(typeof showPage === 'function') showPage(currentPage); // Bật giao diện ngay lập tức
            if(typeof syncData === 'function') syncData(false, true); // Chạy ngầm tải đơn mới phía sau
        } else {
            // Lần đầu tiên đăng nhập, máy trắng trơn mới phải hiện màn hình tải
            if(ui) ui.style.display = "flex";
            if(typeof syncData === 'function') syncData(true); 
        }
    } else {
        if(overlay) overlay.style.display = 'flex';
        if(ui) ui.style.display = "none";
    }
}

async function performLogin() {
    let u = document.getElementById('authUsername').value.trim();
    let p = document.getElementById('authPassword').value.trim();
    let err = document.getElementById('loginError');
    let btn = document.getElementById('btnLogin');
    
    if(!u || !p) { 
        err.innerText = "Vui lòng nhập đủ thông tin!"; 
        err.style.display = 'block'; 
        return; 
    }
    
    btn.innerText = "ĐANG KIỂM TRA..."; 
    btn.disabled = true; 
    err.style.display = 'none';
    
    try {
        let res = await fetch(API, { 
            method: "POST", 
            headers: { "Content-Type": "text/plain;charset=utf-8" }, 
            body: JSON.stringify({ action: "login", username: u, password: p }) 
        });
        
        let result = await res.json();
        
        if(result.success) {
            currentUser = result;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('loginOverlay').style.display = 'none';
            applyRoleUI();
            
            let ui = document.getElementById("loadingUI"); 
            
            // XỬ LÝ SIÊU TỐC KHI ĐĂNG NHẬP LẠI
            if (typeof ALL_PRODUCTS !== 'undefined' && ALL_PRODUCTS.length > 0) {
                if(ui) ui.style.display = "none";
                if(typeof showPage === 'function') showPage(currentPage);
                if(typeof syncData === 'function') syncData(false, true);
            } else {
                if(ui) ui.style.display = "flex";
                if(typeof syncData === 'function') syncData(true);
            }
        } else {
            err.innerText = result.error || "Sai tài khoản hoặc mật khẩu!";
            err.style.display = 'block';
        }
    } catch(e) {
        err.innerText = "Lỗi kết nối mạng, vui lòng thử lại!";
        err.style.display = 'block';
    } finally {
        btn.innerText = "ĐĂNG NHẬP"; 
        btn.disabled = false;
    }
}

function applyRoleUI() {
    if(!currentUser || !currentUser.success) return;
    
    let isAdmin = currentUser.role.toLowerCase() === 'admin';
    let g = document.getElementById('userGreeting');
    if(g) {
        g.innerText = "👋 Chào " + (currentUser.name || "bạn");
    }

    // Ẩn/hiện các phần tử dành riêng cho Admin (Dựa trên class CSS .admin-only)
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });

    // Nếu không phải admin mà lại đang ở trang dashboard thì đá sang trang tạo đơn
    if(!isAdmin && currentPage === 'dashboard') {
        if(typeof showPage === 'function') showPage('add'); 
    }
}

function handleLogout() {
    if(confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) { 
        localStorage.removeItem('currentUser');
        currentUser = null;
        document.getElementById('loginOverlay').style.display = 'flex';
        document.querySelectorAll('.view-section').forEach(el => {
            el.style.display = 'none';
        }); 
    } 
}