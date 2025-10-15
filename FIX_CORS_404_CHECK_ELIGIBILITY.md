# 🔧 FIX: CORS 404 Error cho Endpoint `check-eligibility`

## ❌ LỖI
```
127.0.0.1 - - [15/Oct/2025 09:46:05] "OPTIONS /api/tests/1/check-eligibility?user_id=S00000001 HTTP/1.1" 404 -
```

## 🔍 NGUYÊN NHÂN

1. **Flask-CORS không tự động thêm OPTIONS handler** cho mọi route
2. Browser gửi **preflight OPTIONS request** trước khi gửi GET request thực sự
3. Route `/<int:test_id>/check-eligibility` không có OPTIONS trong methods list ban đầu
4. Flask trả về 404 cho OPTIONS request → CORS preflight fail

## ✅ GIẢI PHÁP ĐÃ APPLY

### **1. Thêm OPTIONS method vào route (test_route.py)**

```python
@test_bp.route("/<int:test_id>/check-eligibility", methods=["GET", "OPTIONS"])
def check_test_eligibility(test_id):
    """Kiểm tra xem user có thể làm bài test này không (giới hạn 2 lần)"""
    # Handle OPTIONS preflight request
    if request.method == "OPTIONS":
        return "", 200
    
    # ... rest of code
```

### **2. Thêm global OPTIONS handler (__init__.py)**

```python
from flask import Flask, request

# ... trong create_app():

# Thêm handler để đảm bảo OPTIONS request được xử lý
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        return response
```

### **3. Cải thiện CORS config (__init__.py)**

```python
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://localhost:5174",
                # ...
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "expose_headers": ["Content-Type", "Authorization"],
        }
    },
    supports_credentials=True,
    send_wildcard=False,
    always_send=True,  # ✨ Quan trọng: Luôn gửi CORS headers
)
```

## 🔄 CÁCH RESTART FLASK SERVER

### **Option 1: Trong Terminal đang chạy Flask**
```bash
# Nhấn Ctrl+C để stop
# Sau đó chạy lại:
flask run
```

### **Option 2: Kill và Start lại**
```powershell
# Tìm process
Get-Process | Where-Object {$_.ProcessName -like "*python*"}

# Hoặc đơn giản là đóng terminal và mở lại
cd D:\ToiecCenterManagerment\backend-for-lms
flask run
```

### **Option 3: Sử dụng auto-reload (nếu đã enable)**
```bash
# Flask có thể tự động reload nếu chạy với debug mode:
# Trong .env hoặc config:
FLASK_DEBUG=1
FLASK_ENV=development

# Hoặc chạy với flag:
flask run --debug --reload
```

## 🧪 CÁCH TEST SAU KHI RESTART

### **1. Test với curl (Terminal)**
```bash
# Test OPTIONS request
curl -X OPTIONS http://127.0.0.1:5000/api/tests/1/check-eligibility?user_id=S00000001 -v

# Should return 200 OK with CORS headers

# Test GET request
curl -X GET "http://127.0.0.1:5000/api/tests/1/check-eligibility?user_id=S00000001" \
  -H "Authorization: Bearer YOUR_TOKEN" -v
```

### **2. Test từ Frontend**
```javascript
// Trong console của browser (F12)
fetch('http://localhost:5000/api/tests/1/check-eligibility?user_id=S00000001', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
  .then(r => r.json())
  .then(d => console.log('SUCCESS:', d))
  .catch(e => console.error('ERROR:', e));
```

### **3. Kiểm tra Network tab**
- Mở DevTools (F12) → Network tab
- Reload trang Tests.jsx
- Tìm request `check-eligibility`
- **Expected:**
  - OPTIONS request: Status 200 (hoặc 204)
  - GET request: Status 200 với data

## 📊 EXPECTED RESPONSES

### **OPTIONS Preflight Response:**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
```

### **GET Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "success",
  "data": {
    "can_attempt": true,
    "attempt_count": 0,
    "max_attempts": 2,
    "remaining_attempts": 2,
    "message": "Bạn còn 2 lần làm bài"
  }
}
```

## 🐛 TROUBLESHOOTING

### **Vẫn còn lỗi 404?**
1. **Check Flask đã restart chưa:**
   ```bash
   # Trong terminal Flask, nên thấy:
   # * Restarting with stat
   # * Debugger is active!
   ```

2. **Check route đã được đăng ký:**
   ```python
   # Chạy script test_routes.py đã tạo:
   python test_routes.py
   
   # Nên thấy:
   # GET                  /api/tests/<int:test_id>/check-eligibility
   ```

3. **Check import trong __init__.py:**
   ```python
   from .routes.test_route import test_bp
   app.register_blueprint(test_bp)
   ```

### **Vẫn còn CORS error?**
1. **Check browser console** cho error chi tiết
2. **Check Flask logs** xem request có đến không
3. **Clear browser cache** và hard reload (Ctrl+Shift+R)
4. **Check port:** Frontend và Backend phải khác port

### **405 Method Not Allowed?**
- Nghĩa là route tồn tại nhưng method không được phép
- Check lại `methods=["GET", "OPTIONS"]` trong decorator

## 📝 FILES MODIFIED

1. `backend-for-lms/app/__init__.py`
   - Added `request` import
   - Enhanced CORS config with `always_send=True`
   - Added `@app.before_request` handler for OPTIONS

2. `backend-for-lms/app/routes/test_route.py`
   - Added `"OPTIONS"` to `methods` list
   - Added early return for OPTIONS requests

## ✅ CHECKLIST AFTER RESTART

- [ ] Flask server restarted successfully
- [ ] No errors in Flask console
- [ ] OPTIONS request returns 200
- [ ] GET request returns data
- [ ] Frontend Tests.jsx loads without CORS errors
- [ ] Badge "Đã làm: 0/2" hiển thị
- [ ] Nút "Bắt đầu" clickable

## 🎯 NEXT STEPS

Sau khi fix CORS:
1. Test flow: Tests.jsx → TestRunner.jsx
2. Verify eligibility check hoạt động
3. Test với user đã làm 1 lần, 2 lần
4. Verify nút disabled khi hết lượt

---

**📅 Fix Date**: October 15, 2025  
**🐛 Issue**: CORS 404 for OPTIONS preflight  
**✅ Status**: Fixed - Waiting for Flask restart
