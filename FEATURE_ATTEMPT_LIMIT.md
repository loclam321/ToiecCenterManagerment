# 🔒 TÍNH NĂNG GIỚI HẠN SỐ LẦN LÀM BÀI KIỂM TRA

## 🎯 MỤC ĐÍCH

Ngăn chặn tình trạng **spam kết quả** khi học viên liên tục làm lại bài kiểm tra để tìm kiếm điểm cao. Hệ thống giới hạn **tối đa 2 lần** làm bài cho mỗi test.

---

## 🔧 IMPLEMENTATION

### **1. Backend API - Kiểm Tra Quyền Làm Bài**

#### **Endpoint mới:** `GET /api/tests/{test_id}/check-eligibility`

**Request:**
```http
GET /api/tests/1/check-eligibility?user_id=SV001
Authorization: Bearer {token}
```

**Response thành công:**
```json
{
  "status": "success",
  "data": {
    "can_attempt": true,
    "attempt_count": 1,
    "max_attempts": 2,
    "remaining_attempts": 1,
    "message": "Bạn còn 1 lần làm bài"
  }
}
```

**Response khi đã hết lượt:**
```json
{
  "status": "success",
  "data": {
    "can_attempt": false,
    "attempt_count": 2,
    "max_attempts": 2,
    "remaining_attempts": 0,
    "message": "Bạn đã làm đủ 2/2 lần"
  }
}
```

#### **Code Implementation:**
```python
@test_bp.route("/<int:test_id>/check-eligibility", methods=["GET"])
def check_test_eligibility(test_id):
    """Kiểm tra xem user có thể làm bài test này không (giới hạn 2 lần)"""
    user_id = request.args.get("user_id")
    
    # Đếm số lần đã làm với status COMPLETED
    attempt_count = Attempt.query.filter(
        Attempt.user_id == user_id,
        Attempt.test_id == test_id,
        Attempt.att_status == "COMPLETED"
    ).count()
    
    max_attempts = 2
    can_attempt = attempt_count < max_attempts
    remaining_attempts = max(0, max_attempts - attempt_count)
    
    return success_response({
        "can_attempt": can_attempt,
        "attempt_count": attempt_count,
        "max_attempts": max_attempts,
        "remaining_attempts": remaining_attempts,
        "message": ...
    })
```

---

### **2. Backend API - Chặn Submit Khi Hết Lượt**

#### **Modified:** `POST /api/tests/{test_id}/submit`

**Thêm validation trước khi xử lý submit:**

```python
@test_bp.route("/<int:test_id>/submit", methods=["POST"])
def submit_test(test_id):
    payload = request.get_json() or {}
    user_id = payload.get("user_id")
    
    # ====== KIỂM TRA GIỚI HẠN SỐ LẦN LÀM BÀI ======
    if user_id:
        existing_attempts = Attempt.query.filter(
            Attempt.user_id == user_id,
            Attempt.test_id == test_id,
            Attempt.att_status == "COMPLETED"
        ).count()
        
        max_attempts = 2
        if existing_attempts >= max_attempts:
            return error_response(
                f"Bạn đã làm đủ {max_attempts} lần cho bài kiểm tra này. Không thể làm thêm.",
                403  # HTTP 403 Forbidden
            )
    
    # Tiếp tục xử lý submit như bình thường...
```

**Response khi bị chặn:**
```json
{
  "status": "error",
  "message": "Bạn đã làm đủ 2 lần cho bài kiểm tra này. Không thể làm thêm."
}
```

---

### **3. Frontend Service - testService.js**

#### **Function mới:**
```javascript
export const checkTestEligibility = async (testId, userId) => {
  const url = `${BASE_URL}/${encodeURIComponent(testId)}/check-eligibility?user_id=${encodeURIComponent(userId)}`;
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể kiểm tra quyền làm bài');
  return data.data || { can_attempt: false, attempt_count: 0, max_attempts: 2 };
};
```

---

### **4. Frontend - Tests.jsx (Danh Sách Bài Test)**

#### **Tính năng:**
- Load eligibility cho mỗi test
- Hiển thị số lần đã làm: `Đã làm: 1/2`
- Hiển thị badge cảnh báo nếu đã hết lượt
- Disable nút "Bắt đầu" nếu `can_attempt = false`

#### **UI Changes:**

```jsx
// Load eligibility khi fetch tests
const [attemptsData, eligibilityData] = await Promise.all([
  getTestAttempts(t.test_id, user.user_id),
  checkTestEligibility(t.test_id, user.user_id)
]);

summaries[t.test_id] = {
  count: attemptsData.count,
  best_score: attemptsData.best_score,
  can_attempt: eligibilityData.can_attempt,
  remaining_attempts: eligibilityData.remaining_attempts,
  max_attempts: eligibilityData.max_attempts,
};
```

**Hiển thị:**

```jsx
{/* Hiển thị số lần đã làm */}
<span className="badge text-bg-light me-2">
  Đã làm: {attemptSummaries[t.test_id].count}/{attemptSummaries[t.test_id].max_attempts}
</span>

{/* Cảnh báo đã hết lượt */}
{!attemptSummaries[t.test_id].can_attempt && (
  <div className="mt-2">
    <span className="badge bg-danger">
      ⚠️ Đã hết lượt làm bài (tối đa {attemptSummaries[t.test_id].max_attempts} lần)
    </span>
  </div>
)}

{/* Hiển thị số lượt còn lại */}
{attemptSummaries[t.test_id].can_attempt && attemptSummaries[t.test_id].remaining_attempts > 0 && (
  <div className="mt-1">
    <span className="badge bg-warning text-dark">
      Còn {attemptSummaries[t.test_id].remaining_attempts} lần làm bài
    </span>
  </div>
)}

{/* Nút Bắt đầu - disabled nếu hết lượt */}
{attemptSummaries[t.test_id] && !attemptSummaries[t.test_id].can_attempt ? (
  <button 
    className="btn btn-secondary" 
    disabled
    title="Bạn đã hết lượt làm bài kiểm tra này"
  >
    Đã hết lượt
  </button>
) : (
  <Link
    className="btn btn-primary"
    to={`/student/tests/${t.test_id}`}
    state={{ freshStart: true }}
  >
    Bắt đầu
  </Link>
)}
```

---

### **5. Frontend - TestRunner.jsx (Màn Hình Làm Bài)**

#### **Tính năng:**
- Kiểm tra eligibility ngay khi load test
- Hiển thị thông báo lượt còn lại trong header
- Chặn không cho vào test nếu đã hết lượt
- Hiển thị màn hình error với nút quay lại

#### **Load và Check Eligibility:**

```jsx
const [eligibility, setEligibility] = useState(null);

useEffect(() => {
  // Kiểm tra quyền làm bài trước
  if (user?.user_id) {
    const eligibilityCheck = await checkTestEligibility(testId, user.user_id);
    setEligibility(eligibilityCheck);
    
    // Nếu đã hết lượt, dừng lại
    if (!eligibilityCheck.can_attempt) {
      setError(`Bạn đã hết lượt làm bài này (${eligibilityCheck.attempt_count}/${eligibilityCheck.max_attempts} lần).`);
      setLoading(false);
      return; // Không load questions
    }
  }
  
  // Tiếp tục load test như bình thường
  const [metaResp, qs] = await Promise.all([...]);
}, [testId, user?.user_id]);
```

#### **Hiển thị Error Screen:**

```jsx
if (error) {
  return (
    <div className="card p-3">
      <div className="alert alert-danger mb-3">
        <h5 className="alert-heading">⚠️ Không thể làm bài</h5>
        <p className="mb-0">{error}</p>
      </div>
      <button 
        className="btn btn-primary" 
        onClick={() => navigate('/student/tests')}
      >
        ← Quay lại danh sách bài kiểm tra
      </button>
    </div>
  );
}
```

#### **Hiển thị Warning Header:**

```jsx
{/* Hiển thị số lượt còn lại */}
{eligibility && eligibility.remaining_attempts !== undefined && (
  <div className="mt-2">
    <div className={`alert ${eligibility.remaining_attempts <= 1 ? 'alert-warning' : 'alert-info'} py-2 px-3 mb-0`}>
      <strong>📊 Lượt làm bài:</strong> Đây là lần thứ {eligibility.attempt_count + 1}/{eligibility.max_attempts} của bạn
      {eligibility.remaining_attempts > 1 && ` (còn ${eligibility.remaining_attempts - 1} lượt sau lần này)`}
      {eligibility.remaining_attempts === 1 && ' (⚠️ Đây là lượt cuối cùng!)'}
    </div>
  </div>
)}
```

---

## 📸 UI/UX FLOW

### **Scenario 1: Chưa làm bài (0/2)**

**Tests.jsx:**
```
┌─────────────────────────────────────────────────┐
│ TOEIC Test 1                                    │
│ Thời lượng: 120 phút • Tổng câu: 100          │
│                                                 │
│ [Đã làm: 0/2] [Còn 2 lần làm bài]             │
│                                        [Bắt đầu]│
└─────────────────────────────────────────────────┘
```

**TestRunner.jsx Header:**
```
┌─────────────────────────────────────────────────┐
│ 📊 Lượt làm bài: Đây là lần thứ 1/2 của bạn    │
│    (còn 1 lượt sau lần này)                     │
└─────────────────────────────────────────────────┘
```

---

### **Scenario 2: Đã làm 1 lần (1/2)**

**Tests.jsx:**
```
┌─────────────────────────────────────────────────┐
│ TOEIC Test 1                                    │
│ Thời lượng: 120 phút • Tổng câu: 100          │
│                                                 │
│ [Đã làm: 1/2] [Điểm cao nhất: 25]             │
│ [Còn 1 lần làm bài]                            │
│                                        [Bắt đầu]│
└─────────────────────────────────────────────────┘
```

**TestRunner.jsx Header (Lượt 2):**
```
┌─────────────────────────────────────────────────┐
│ ⚠️ 📊 Lượt làm bài: Đây là lần thứ 2/2 của bạn │
│    (⚠️ Đây là lượt cuối cùng!)                  │
└─────────────────────────────────────────────────┘
```

---

### **Scenario 3: Đã hết lượt (2/2)**

**Tests.jsx:**
```
┌─────────────────────────────────────────────────┐
│ TOEIC Test 1                                    │
│ Thời lượng: 120 phút • Tổng câu: 100          │
│                                                 │
│ [Đã làm: 2/2] [Điểm cao nhất: 28]             │
│ [⚠️ Đã hết lượt làm bài (tối đa 2 lần)]        │
│                                [Đã hết lượt] ❌ │
└─────────────────────────────────────────────────┘
```

**Nếu cố vào link trực tiếp:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Không thể làm bài                            │
│                                                 │
│ Bạn đã hết lượt làm bài này (2/2 lần).         │
│ Vui lòng liên hệ giáo viên nếu cần làm thêm.  │
│                                                 │
│                      [← Quay lại danh sách]    │
└─────────────────────────────────────────────────┘
```

---

## 🔐 SECURITY & VALIDATION

### **1. Backend Validation (Double Check)**

- ✅ Check trong `check-eligibility` endpoint
- ✅ Check lại trong `submit` endpoint (quan trọng!)
- ✅ Chỉ đếm attempts với `att_status = "COMPLETED"`
- ✅ HTTP 403 Forbidden khi vượt giới hạn

### **2. Frontend Validation**

- ✅ Check trước khi load test
- ✅ Disable button trong danh sách
- ✅ Hiển thị error screen nếu bypass
- ✅ Warning header khi đang làm bài

### **3. Bypass Prevention**

**Người dùng KHÔNG THỂ bypass bằng cách:**
- ❌ Xóa localStorage (backend vẫn check)
- ❌ Dùng Incognito mode (backend check theo user_id)
- ❌ Gọi trực tiếp API submit (backend validate lần nữa)
- ❌ Sửa state frontend (backend là source of truth)

---

## 📊 DATABASE QUERIES

### **Query kiểm tra số lần làm:**
```sql
SELECT COUNT(*) 
FROM attempts 
WHERE user_id = 'SV001' 
  AND test_id = 1 
  AND att_status = 'COMPLETED';
```

### **Optimization với Index:**
```sql
CREATE INDEX idx_attempts_user_test_status 
ON attempts(user_id, test_id, att_status);
```

---

## 🎛️ CONFIGURATION

### **Thay đổi giới hạn số lần (hiện tại hardcode = 2):**

**Backend:** `test_route.py`
```python
max_attempts = 2  # Thay đổi số này để điều chỉnh
```

**Nên chuyển sang config file:**
```python
# config.py
MAX_TEST_ATTEMPTS = int(os.getenv('MAX_TEST_ATTEMPTS', 2))

# test_route.py
from app.config import MAX_TEST_ATTEMPTS
max_attempts = MAX_TEST_ATTEMPTS
```

**Hoặc lưu trong database (flexible hơn):**
```sql
ALTER TABLE tests 
ADD COLUMN test_max_attempts INT DEFAULT 2;
```

---

## 🧪 TESTING CHECKLIST

### **Backend Tests:**
- [ ] Test `check-eligibility` với user chưa làm
- [ ] Test `check-eligibility` với user đã làm 1 lần
- [ ] Test `check-eligibility` với user đã làm 2 lần
- [ ] Test `submit` bị reject khi đã làm 2 lần
- [ ] Test với multiple users cùng test
- [ ] Test với user làm nhiều tests khác nhau

### **Frontend Tests:**
- [ ] Test danh sách hiển thị đúng số lần
- [ ] Test button disabled khi hết lượt
- [ ] Test không vào được TestRunner khi hết lượt
- [ ] Test hiển thị warning header đúng
- [ ] Test với user chưa làm bài nào
- [ ] Test reload page không bypass check

### **Integration Tests:**
- [ ] Test flow hoàn chỉnh: 0 → 1 → 2 lần
- [ ] Test submit lần 1 thành công
- [ ] Test submit lần 2 thành công
- [ ] Test submit lần 3 bị reject
- [ ] Test error handling khi API fail
- [ ] Test concurrent submissions (race condition)

---

## 🚀 FUTURE ENHANCEMENTS

### **1. Admin Override**
- Giáo viên có thể reset số lần làm cho học viên
- Endpoint: `POST /api/tests/{test_id}/reset-attempts`

### **2. Time-based Limit**
- Cho phép làm lại sau X ngày
- Ví dụ: 2 lần/tuần thay vì 2 lần/mãi mãi

### **3. Grade-based Unlock**
- Nếu điểm < 50%, cho làm thêm 1 lần
- Điều chỉnh động dựa trên kết quả

### **4. Purchase Additional Attempts**
- Học viên mua thêm lượt làm bài
- Integration với payment system

### **5. Configurable per Test**
- Mỗi test có giới hạn riêng
- Lưu trong database: `test_max_attempts`

---

## 📝 NOTES

### **Tại sao chọn 2 lần?**
- Lần 1: Làm quen với format
- Lần 2: Cơ hội cải thiện điểm
- 3+ lần: Dễ nhớ đáp án, mất tính đánh giá

### **Alternative: Unlimited với Cooling Period**
- Không giới hạn số lần
- Nhưng phải đợi 7 ngày giữa các lần
- Code:
  ```python
  last_attempt = Attempt.query.filter(...).order_by(desc(att_submitted_at)).first()
  if last_attempt:
      days_since = (datetime.now() - last_attempt.att_submitted_at).days
      if days_since < 7:
          return error_response("Bạn phải đợi 7 ngày kể từ lần làm trước")
  ```

---

## 📚 FILES MODIFIED

1. **Backend:**
   - `backend-for-lms/app/routes/test_route.py` (2 functions modified/added)

2. **Frontend:**
   - `frontend-for-lms/src/services/testService.js` (1 function added)
   - `frontend-for-lms/src/pages/student/Tests.jsx` (UI + logic updated)
   - `frontend-for-lms/src/pages/student/TestRunner.jsx` (validation added)

---

**📅 Feature Version**: 1.0  
**👤 Author**: AI Assistant  
**🗓️ Date**: October 15, 2025  
**🎯 Status**: ✅ Implemented & Ready for Testing
