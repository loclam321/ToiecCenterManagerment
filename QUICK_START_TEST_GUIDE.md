# 🚀 Quick Start Guide - Test Ngày Mai

## ⏰ Timeline Tóm Tắt

```
08:00 ━━━━━━━━━━━━ Chuẩn bị & Backup
08:30 ━━━━━━━━━━━━ Seed dữ liệu
09:30 ━━━━━━━━━━━━ Test cơ bản
13:00 ━━━━━━━━━━━━ Test chi tiết (Lịch học)
14:00 ━━━━━━━━━━━━ Test bài kiểm tra
15:30 ━━━━━━━━━━━━ Test edge cases
16:30 ━━━━━━━━━━━━ Test mobile
19:00 ━━━━━━━━━━━━ Fix bugs & tổng kết
```

---

## 📝 Checklist Nhanh

### Bước 1: Chuẩn Bị (5 phút)
```bash
# 1. Pull code mới nhất
cd D:\ToiecCenterManagerment
git pull origin Dev-B

# 2. Backup database
cd backend-for-lms
python scripts/backup_db.py

# 3. Check services đang chạy
# Terminal 1: Backend
flask run --debug

# Terminal 2: Frontend
cd ../frontend-for-lms
npm run dev
```

- [ ] Git pull xong
- [ ] Database đã backup
- [ ] Backend running (port 5000)
- [ ] Frontend running (port 5173)

---

### Bước 2: Seed Data (10 phút)
```bash
cd backend-for-lms

# Chạy seed script
python scripts/seed_realistic_test_data.py
# → Type: yes

# Verify data
python scripts/verify_seeded_data.py
```

**Expected Output:**
```
✅ Created 9 courses
✅ Created 9 rooms
✅ Created 12 teachers
✅ Created ~36 classes
✅ Created 150 students
✅ Created ~200 enrollments
✅ Created ~400 schedules
```

- [ ] Seed script chạy thành công
- [ ] Verify script pass tất cả checks
- [ ] Note login credentials:
  - Teacher: `teacher1@toeic.edu.vn` / `teacher123`
  - Student: `student1@toeic.edu.vn` / `student123`

---

### Bước 3: Test Lịch Học (30 phút)

#### 3.1 Login & Navigate
```
1. Mở browser → http://localhost:5173
2. Login với student1@toeic.edu.vn / student123
3. Click "Lịch Học" trong menu
```

#### 3.2 Test Filters
```javascript
// Open Browser Console (F12)
console.time('filter');
// Select a course from dropdown
console.timeEnd('filter');
// Should be < 500ms
```

**Test Cases:**
- [ ] **Filter by Course**
  - Chọn "TOEIC 450" → Hiển thị đúng các lớp TOEIC 450
  - Chọn "TOEIC 900+" → Hiển thị đúng các lớp TOEIC 900+
  - Chọn "All" → Hiển thị tất cả
  - ✅ PASS / ❌ FAIL: ______

- [ ] **Filter by Class**
  - Chọn course → Class dropdown update
  - Chọn class → Lịch filter đúng
  - ✅ PASS / ❌ FAIL: ______

- [ ] **Week Navigation**
  - "Tuần trước" → Load đúng tuần trước
  - "Tuần sau" → Load đúng tuần sau
  - "Tuần này" → Reset về tuần hiện tại
  - ✅ PASS / ❌ FAIL: ______

#### 3.3 Test Status Colors
- [ ] Buổi đã học → Màu xám (gray), opacity 0.85
- [ ] Buổi hôm nay → Màu vàng/đỏ, có animation pulse
- [ ] Buổi sắp tới → Màu xanh/tím
- [ ] Status badge hiển thị: "✓ Đã học", "● Hôm nay", "○ Sắp tới"
- ✅ PASS / ❌ FAIL: ______

#### 3.4 Test Performance
```javascript
// Browser Console
performance.mark('load-start');
// Click "Lịch Học"
performance.mark('load-end');
performance.measure('page-load', 'load-start', 'load-end');
console.table(performance.getEntriesByType('measure'));
```

**Targets:**
- [ ] Initial load < 2s
- [ ] Filter change < 500ms
- [ ] Week navigation < 300ms
- [ ] No console errors
- ✅ PASS / ❌ FAIL: ______

---

### Bước 4: Test Edge Cases (30 phút)

#### 4.1 Empty State
```
1. Tạo student mới không có enrollment
2. Login với student đó
3. Vào "Lịch Học"
```
- [ ] Hiển thị empty state với message
- [ ] Filters bị disabled hoặc empty
- [ ] Không có lỗi console
- ✅ PASS / ❌ FAIL: ______

#### 4.2 Many Classes
```
1. Login với student có nhiều enrollments (3+)
2. Check lịch học load time
```
- [ ] Load time vẫn < 2s
- [ ] UI không bị vỡ
- [ ] Filters hoạt động bình thường
- ✅ PASS / ❌ FAIL: ______

#### 4.3 Missing Data
```python
# Backend console
from app.models import Room, Schedule
# Xóa 1 room đang được dùng
room = Room.query.first()
room_id = room.room_id
db.session.delete(room)
db.session.commit()
# Reload trang lịch học
```
- [ ] Schedule vẫn hiển thị (fallback)
- [ ] Không crash
- [ ] Console có warning (không phải error)
- ✅ PASS / ❌ FAIL: ______

---

### Bước 5: Test Mobile (20 phút)

```
Open DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M)
Test trên:
- iPhone SE (375x667)
- iPhone 12 (390x844)
- iPad (768x1024)
```

**Check:**
- [ ] Schedule table → Horizontal scroll
- [ ] Filters → Full width, dễ tap
- [ ] Buttons → Touch-friendly size
- [ ] Text readable (không quá nhỏ)
- [ ] No overlap/overflow
- [ ] Session cards → Tap để xem tooltip
- ✅ PASS / ❌ FAIL: ______

---

### Bước 6: Performance Test (Optional)

```bash
# Cài locust nếu chưa có
pip install locust

# Tạo file test
# (đã có sẵn trong TEST_PLAN_TOMORROW.md)

# Run test
locust -f scripts/locustfile.py --host=http://localhost:5000
```

**Open:** http://localhost:8089
- Users: 50
- Spawn rate: 5/s
- Duration: 2 minutes

**Check:**
- [ ] API p95 < 500ms
- [ ] No 500 errors
- [ ] Success rate > 95%
- ✅ PASS / ❌ FAIL: ______

---

## 🐛 Bug Report Template

Khi phát hiện bug, ghi vào file `BUGS_FOUND.md`:

```markdown
### Bug #1 - [Severity: Critical/High/Medium/Low]
**Date**: 2025-10-17
**Module**: Schedule / Tests / Enrollment / etc.
**Description**: Mô tả ngắn gọn

**Steps to Reproduce**:
1. Login với student1
2. Vào "Lịch Học"
3. Chọn filter "TOEIC 450"
4. Kết quả sai

**Expected**: Hiển thị 3 lớp TOEIC 450
**Actual**: Hiển thị 5 lớp (gồm cả TOEIC 550)

**Screenshot**: (nếu có)

**Console Errors**:
```
TypeError: Cannot read property 'course_id' of undefined
```

**Priority**: High (ảnh hưởng chức năng chính)
**Status**: To Fix
```

---

## 📊 End of Day Report Template

File: `TEST_REPORT_2025_10_17.md`

```markdown
# 📊 Test Report - 17/10/2025

## ✅ Summary
- Total Tests: __
- Passed: __
- Failed: __
- Skipped: __
- Success Rate: __%

## ✅ Passed Features
- [x] Schedule filters (Course/Class)
- [x] Week navigation
- [x] Status colors
- [x] Mobile responsive
- [x] ...

## ❌ Failed Tests / Bugs Found
1. Bug #1: Filter không hoạt động với course "EMAIL"
2. Bug #2: Animation pulse không smooth trên Safari
3. ...

## 📈 Performance Metrics
- Schedule page load: __ms
- Filter response: __ms
- Week navigation: __ms
- API p95: __ms

## 🔧 Fixes Applied
- [x] Fixed Bug #1: Thêm fallback cho course_id
- [x] Added index on schedule_date
- [ ] Bug #2: Chưa fix (low priority)

## 📝 Next Steps
1. [ ] Fix remaining bugs
2. [ ] Optimize query X
3. [ ] Add feature Y
4. [ ] Update documentation

## 💡 Notes & Observations
- Performance tốt hơn expected (~70% improvement)
- UI colors rất rõ ràng, dễ phân biệt
- Mobile experience mượt mà
- Cần thêm tooltip cho mobile (hiện chỉ có desktop)
```

---

## 🎯 Success Criteria

### Must Pass
- [ ] ✅ No critical bugs (P0/P1)
- [ ] ✅ Filters hoạt động 100%
- [ ] ✅ Performance acceptable
- [ ] ✅ Mobile responsive works

### Nice to Have
- [ ] 🎯 All tests passed
- [ ] 🎯 Performance > 70% improvement
- [ ] 🎯 Zero bugs

---

## 📞 Emergency Contacts

**If something breaks:**
1. Check `DEPLOYMENT_CHECKLIST.md` → Rollback section
2. Git revert to last working commit
3. Restore database from backup

**Rollback Commands:**
```bash
# Backend
cd backend-for-lms
git log --oneline -5
git revert <commit-hash>
cp backups/lms_backup_YYYYMMDD_HHMMSS.db instance/lms.db

# Frontend
cd frontend-for-lms
git revert <commit-hash>
npm run dev
```

---

## 📚 Resources

**Documentation:**
- `TEST_PLAN_TOMORROW.md` - Kế hoạch chi tiết
- `SCHEDULE_OPTIMIZATION_IMPLEMENTATION.md` - Docs kỹ thuật
- `OPTIMIZATION_SUMMARY.md` - Tóm tắt optimizations

**Scripts:**
- `scripts/seed_realistic_test_data.py` - Seed data
- `scripts/verify_seeded_data.py` - Verify data
- `scripts/backup_db.py` - Backup database

---

**Good luck! 🚀**
**Remember**: Test thoroughly, document bugs, and have fun! 🎉
