# 📅 Kế Hoạch Kiểm Tra Hệ Thống - Ngày Mai (17/10/2025)

## 🎯 Mục Tiêu
Đưa dữ liệu thực tế vào hệ thống để:
1. ✅ Kiểm tra logic bộ lọc (filters)
2. ✅ Phát hiện lỗi khi xử lý nhiều dữ liệu
3. ✅ Đánh giá hiệu năng thực tế
4. ✅ Xác minh tối ưu hóa đã áp dụng

---

## 📊 Dữ Liệu Cần Chuẩn Bị

### 1. Dữ Liệu Courses (Khóa Học)
```
Khóa TOEIC Foundation (Level 1)
├── TOEIC 450
├── TOEIC 550
└── TOEIC 650

Khóa TOEIC Intermediate (Level 2)
├── TOEIC 750
├── TOEIC 850
└── TOEIC 900+

Khóa Business English
├── Business Communication
├── Presentation Skills
└── Email Writing
```

**Tổng**: ~9 courses

### 2. Dữ Liệu Classes (Lớp Học)
```
Mỗi khóa học có 3-4 lớp:
├── Sáng (07:00 - 09:00)
├── Trưa (13:00 - 15:00)
├── Chiều (17:00 - 19:00)
└── Tối (19:00 - 21:00)

Ví dụ:
- TOEIC 450 - Morning A (Thứ 2, 4, 6)
- TOEIC 450 - Evening B (Thứ 3, 5, 7)
- TOEIC 550 - Weekend C (Thứ 7, CN)
```

**Tổng**: ~27-36 classes

### 3. Dữ Liệu Students (Học Viên)
```
Nhóm 1: Học viên đang học (Active)
├── 5-8 học viên/lớp
└── Enrolled trong 2-3 khóa

Nhóm 2: Học viên mới (New)
├── 3-5 học viên
└── Enrolled trong 1 khóa

Nhóm 3: Học viên đã hoàn thành (Completed)
├── 2-3 học viên
└── Enrollment status = COMPLETED
```

**Tổng**: ~150-200 students

### 4. Dữ Liệu Schedules (Lịch Học)
```
Mỗi lớp có lịch học:
├── 3 buổi/tuần × 4 tuần = 12 buổi/lớp
├── Mix giữa: đã học, hôm nay, sắp tới
└── Đủ các khung giờ: sáng, trưa, chiều, tối

Ví dụ tuần này:
- Thứ 2: 8 lớp (2 sáng, 2 trưa, 2 chiều, 2 tối)
- Thứ 3: 8 lớp
- Thứ 4: 8 lớp
...
```

**Tổng**: ~300-400 schedules

### 5. Dữ Liệu Teachers (Giáo Viên)
```
10-15 giáo viên:
├── Mỗi giáo viên dạy 2-3 lớp
├── Mix thời gian: sáng/chiều/tối
└── Có xung đột lịch để test validation
```

### 6. Dữ Liệu Rooms (Phòng Học)
```
5-8 phòng:
├── Phòng 101: 20 chỗ
├── Phòng 102: 25 chỗ
├── Phòng 201: 30 chỗ
├── Lab 1: 15 chỗ (có máy tính)
└── Auditorium: 50 chỗ
```

---

## 🛠️ Script Tạo Dữ Liệu Mẫu

### Option 1: SQL Script (Nhanh)
```sql
-- File: scripts/seed_realistic_data.sql

-- 1. Insert Courses
INSERT INTO course (course_id, course_name, course_description, course_level) VALUES
('TOEIC450', 'TOEIC 450', 'Foundation level TOEIC preparation', 1),
('TOEIC550', 'TOEIC 550', 'Elementary TOEIC preparation', 1),
('TOEIC650', 'TOEIC 650', 'Pre-intermediate TOEIC preparation', 1),
('TOEIC750', 'TOEIC 750', 'Intermediate TOEIC preparation', 2),
('TOEIC850', 'TOEIC 850', 'Upper-intermediate TOEIC preparation', 2),
('TOEIC900', 'TOEIC 900+', 'Advanced TOEIC preparation', 2),
('BUSCOM', 'Business Communication', 'Professional business communication', 3),
('PRESENT', 'Presentation Skills', 'Effective presentation techniques', 3),
('EMAIL', 'Email Writing', 'Professional email writing', 3);

-- 2. Insert Rooms
INSERT INTO room (room_name, room_location, room_capacity, room_status) VALUES
('Phòng 101', 'Tầng 1', 20, 'AVAILABLE'),
('Phòng 102', 'Tầng 1', 25, 'AVAILABLE'),
('Phòng 201', 'Tầng 2', 30, 'AVAILABLE'),
('Phòng 202', 'Tầng 2', 25, 'AVAILABLE'),
('Lab 1', 'Tầng 3', 15, 'AVAILABLE'),
('Lab 2', 'Tầng 3', 15, 'AVAILABLE'),
('Auditorium', 'Tầng 1', 50, 'AVAILABLE');

-- 3. Insert Teachers (cần hash password trước)
-- Sẽ tạo bằng Python script để hash password đúng

-- 4. Insert Classes
-- Sẽ tạo bằng Python script để tính dates chính xác

-- 5. Insert Students
-- Sẽ tạo bằng Python script với random data

-- 6. Insert Enrollments
-- Sẽ tạo bằng Python script để link students-classes

-- 7. Insert Schedules
-- Sẽ tạo bằng Python script với dates logic
```

### Option 2: Python Script (Linh Hoạt)
```python
# File: scripts/seed_realistic_test_data.py

"""
Script tạo dữ liệu thực tế để test hệ thống
Chạy: python scripts/seed_realistic_test_data.py
"""

import sys
sys.path.append('.')

from app import create_app
from app.config import db
from app.models.course_model import Course
from app.models.class_model import Class
from app.models.room_model import Room
from app.models.teacher_model import Teacher
from app.models.student_model import Student
from app.models.enrollment_model import Enrollment
from app.models.schedule_model import Schedule
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta, date
import random

app = create_app()

def seed_all():
    with app.app_context():
        print("🌱 Starting data seeding...")
        
        # 1. Seed Courses
        courses = seed_courses()
        print(f"✅ Created {len(courses)} courses")
        
        # 2. Seed Rooms
        rooms = seed_rooms()
        print(f"✅ Created {len(rooms)} rooms")
        
        # 3. Seed Teachers
        teachers = seed_teachers()
        print(f"✅ Created {len(teachers)} teachers")
        
        # 4. Seed Classes
        classes = seed_classes(courses, teachers)
        print(f"✅ Created {len(classes)} classes")
        
        # 5. Seed Students
        students = seed_students()
        print(f"✅ Created {len(students)} students")
        
        # 6. Seed Enrollments
        enrollments = seed_enrollments(students, classes)
        print(f"✅ Created {len(enrollments)} enrollments")
        
        # 7. Seed Schedules
        schedules = seed_schedules(classes, rooms)
        print(f"✅ Created {len(schedules)} schedules")
        
        print("\n🎉 Data seeding completed!")
        print_summary(courses, classes, students, schedules)

def seed_courses():
    courses_data = [
        {'id': 'TOEIC450', 'name': 'TOEIC 450', 'level': 1, 'desc': 'Foundation TOEIC preparation'},
        {'id': 'TOEIC550', 'name': 'TOEIC 550', 'level': 1, 'desc': 'Elementary TOEIC preparation'},
        {'id': 'TOEIC650', 'name': 'TOEIC 650', 'level': 1, 'desc': 'Pre-intermediate TOEIC preparation'},
        {'id': 'TOEIC750', 'name': 'TOEIC 750', 'level': 2, 'desc': 'Intermediate TOEIC preparation'},
        {'id': 'TOEIC850', 'name': 'TOEIC 850', 'level': 2, 'desc': 'Upper-intermediate TOEIC preparation'},
        {'id': 'TOEIC900', 'name': 'TOEIC 900+', 'level': 2, 'desc': 'Advanced TOEIC preparation'},
        {'id': 'BUSCOM', 'name': 'Business Communication', 'level': 3, 'desc': 'Professional business communication'},
        {'id': 'PRESENT', 'name': 'Presentation Skills', 'level': 3, 'desc': 'Effective presentation techniques'},
        {'id': 'EMAIL', 'name': 'Email Writing', 'level': 3, 'desc': 'Professional email writing'},
    ]
    
    courses = []
    for data in courses_data:
        course = Course.query.get(data['id'])
        if not course:
            course = Course(
                course_id=data['id'],
                course_name=data['name'],
                course_description=data['desc'],
                course_level=data['level']
            )
            db.session.add(course)
            courses.append(course)
    
    db.session.commit()
    return courses

def seed_rooms():
    rooms_data = [
        {'name': 'Phòng 101', 'location': 'Tầng 1', 'capacity': 20},
        {'name': 'Phòng 102', 'location': 'Tầng 1', 'capacity': 25},
        {'name': 'Phòng 201', 'location': 'Tầng 2', 'capacity': 30},
        {'name': 'Phòng 202', 'location': 'Tầng 2', 'capacity': 25},
        {'name': 'Lab 1', 'location': 'Tầng 3', 'capacity': 15},
        {'name': 'Lab 2', 'location': 'Tầng 3', 'capacity': 15},
        {'name': 'Auditorium', 'location': 'Tầng 1', 'capacity': 50},
    ]
    
    rooms = []
    for data in rooms_data:
        if not Room.query.filter_by(room_name=data['name']).first():
            room = Room(
                room_name=data['name'],
                room_location=data['location'],
                room_capacity=data['capacity'],
                room_status='AVAILABLE'
            )
            db.session.add(room)
            rooms.append(room)
    
    db.session.commit()
    return rooms

def seed_teachers():
    teachers_data = [
        {'id': 'TEACHER01', 'name': 'Nguyễn Văn A', 'email': 'teacher1@toeic.edu.vn'},
        {'id': 'TEACHER02', 'name': 'Trần Thị B', 'email': 'teacher2@toeic.edu.vn'},
        {'id': 'TEACHER03', 'name': 'Lê Văn C', 'email': 'teacher3@toeic.edu.vn'},
        {'id': 'TEACHER04', 'name': 'Phạm Thị D', 'email': 'teacher4@toeic.edu.vn'},
        {'id': 'TEACHER05', 'name': 'Hoàng Văn E', 'email': 'teacher5@toeic.edu.vn'},
        {'id': 'TEACHER06', 'name': 'Vũ Thị F', 'email': 'teacher6@toeic.edu.vn'},
        {'id': 'TEACHER07', 'name': 'Đỗ Văn G', 'email': 'teacher7@toeic.edu.vn'},
        {'id': 'TEACHER08', 'name': 'Bùi Thị H', 'email': 'teacher8@toeic.edu.vn'},
        {'id': 'TEACHER09', 'name': 'Mai Văn I', 'email': 'teacher9@toeic.edu.vn'},
        {'id': 'TEACHER10', 'name': 'Lý Thị K', 'email': 'teacher10@toeic.edu.vn'},
    ]
    
    teachers = []
    for data in teachers_data:
        if not Teacher.query.get(data['id']):
            teacher = Teacher(
                user_id=data['id'],
                user_name=data['name'],
                user_email=data['email'],
                user_password=generate_password_hash('teacher123'),
                user_telephone='0901234567',
                user_role='teacher',
                user_verified=True
            )
            db.session.add(teacher)
            teachers.append(teacher)
    
    db.session.commit()
    return teachers

def seed_classes(courses, teachers):
    classes = []
    class_counter = 1
    
    # Các khung giờ
    time_slots = [
        ('Morning', '07:00', '09:00'),
        ('Afternoon', '13:00', '15:00'),
        ('Evening', '17:00', '19:00'),
        ('Night', '19:00', '21:00'),
    ]
    
    # Tạo lớp cho mỗi khóa học
    for course in Course.query.all():
        for slot_name, start_time, end_time in time_slots[:3]:  # 3 lớp/khóa
            teacher = random.choice(Teacher.query.all())
            
            class_obj = Class(
                class_name=f"{course.course_id} - {slot_name} {class_counter}",
                class_startdate=date.today() - timedelta(days=30),
                class_enddate=date.today() + timedelta(days=60),
                class_maxstudents=20,
                course_id=course.course_id,
                user_id=teacher.user_id
            )
            db.session.add(class_obj)
            classes.append(class_obj)
            class_counter += 1
    
    db.session.commit()
    return classes

def seed_students():
    students = []
    
    for i in range(1, 151):  # 150 students
        student_id = f"STU{i:04d}"
        if not Student.query.get(student_id):
            student = Student(
                user_id=student_id,
                user_name=f"Học Viên {i}",
                user_email=f"student{i}@toeic.edu.vn",
                user_password=generate_password_hash('student123'),
                user_telephone=f"090{i:07d}",
                user_role='student',
                user_verified=True,
                user_gender=random.choice(['Nam', 'Nữ']),
                student_level=random.randint(1, 3)
            )
            db.session.add(student)
            students.append(student)
    
    db.session.commit()
    return students

def seed_enrollments(students, classes):
    enrollments = []
    
    all_students = Student.query.all()
    all_classes = Class.query.all()
    
    # Mỗi học viên enroll vào 1-3 lớp
    for student in all_students:
        num_classes = random.randint(1, 3)
        selected_classes = random.sample(all_classes, min(num_classes, len(all_classes)))
        
        for class_obj in selected_classes:
            # Check if already enrolled
            existing = Enrollment.query.filter_by(
                user_id=student.user_id,
                class_id=class_obj.class_id
            ).first()
            
            if not existing:
                enrollment = Enrollment(
                    user_id=student.user_id,
                    class_id=class_obj.class_id,
                    enrollment_date=date.today() - timedelta(days=random.randint(1, 30)),
                    status=random.choices(['ACTIVE', 'COMPLETED', 'DROPPED'], 
                                        weights=[0.8, 0.15, 0.05])[0]
                )
                db.session.add(enrollment)
                enrollments.append(enrollment)
    
    db.session.commit()
    return enrollments

def seed_schedules(classes, rooms):
    schedules = []
    
    all_classes = Class.query.all()
    all_rooms = Room.query.all()
    
    # Các ngày trong tuần
    weekdays = [0, 2, 4]  # Thứ 2, 4, 6
    
    # Tạo lịch cho 8 tuần (4 tuần qua + 4 tuần tới)
    for class_obj in all_classes:
        room = random.choice(all_rooms)
        
        # Xác định khung giờ từ tên lớp
        if 'Morning' in class_obj.class_name:
            start_time, end_time = '07:00:00', '09:00:00'
        elif 'Afternoon' in class_obj.class_name:
            start_time, end_time = '13:00:00', '15:00:00'
        elif 'Evening' in class_obj.class_name:
            start_time, end_time = '17:00:00', '19:00:00'
        else:
            start_time, end_time = '19:00:00', '21:00:00'
        
        # Tạo lịch cho 8 tuần
        current_date = date.today() - timedelta(days=28)  # 4 tuần trước
        end_date = date.today() + timedelta(days=28)  # 4 tuần sau
        
        while current_date <= end_date:
            if current_date.weekday() in weekdays:
                schedule = Schedule(
                    room_id=room.room_id,
                    class_id=class_obj.class_id,
                    user_id=class_obj.user_id,
                    schedule_date=current_date,
                    schedule_startime=start_time,
                    schedule_endtime=end_time
                )
                db.session.add(schedule)
                schedules.append(schedule)
            
            current_date += timedelta(days=1)
    
    db.session.commit()
    return schedules

def print_summary(courses, classes, students, schedules):
    print("\n" + "="*50)
    print("📊 DỮ LIỆU ĐÃ TẠO")
    print("="*50)
    print(f"Courses: {Course.query.count()}")
    print(f"Classes: {Class.query.count()}")
    print(f"Rooms: {Room.query.count()}")
    print(f"Teachers: {Teacher.query.count()}")
    print(f"Students: {Student.query.count()}")
    print(f"Enrollments: {Enrollment.query.count()}")
    print(f"Schedules: {Schedule.query.count()}")
    print("="*50)

if __name__ == '__main__':
    seed_all()
```

---

## 📝 Checklist Thực Hiện (Ngày Mai)

### Sáng (8:00 - 10:00)

#### ⏰ 8:00 - 8:30: Chuẩn Bị
- [ ] Pull code mới nhất từ Git
- [ ] Check backend/frontend đang chạy
- [ ] Backup database hiện tại
- [ ] Review script tạo dữ liệu

#### ⏰ 8:30 - 9:30: Tạo Dữ Liệu
```bash
# Backup DB
cd backend-for-lms
python scripts/backup_db.py

# Chạy seed script
python scripts/seed_realistic_test_data.py

# Verify data
python scripts/verify_seeded_data.py
```

- [ ] Chạy script seed data
- [ ] Verify số lượng records
- [ ] Check console logs
- [ ] Tạo 2-3 test users để login

#### ⏰ 9:30 - 10:00: Kiểm Tra Cơ Bản
- [ ] Login với student account
- [ ] Xem danh sách lớp học
- [ ] Kiểm tra enrollment hiển thị đúng
- [ ] Note lại issues (nếu có)

---

### Trưa (13:00 - 15:00)

#### ⏰ 13:00 - 14:00: Test Lịch Học (Schedule)

**Test Cases:**
1. **Filter by Course**
   - [ ] Chọn "TOEIC 450" → Hiển thị đúng lớp
   - [ ] Chọn "TOEIC 900+" → Hiển thị đúng lớp
   - [ ] Chọn "All" → Hiển thị tất cả

2. **Filter by Class**
   - [ ] Chọn course → Dropdown class update
   - [ ] Chọn class → Lịch filter đúng
   - [ ] Reset filters → Hiển thị lại tất cả

3. **Week Navigation**
   - [ ] Click "Tuần trước" → Load lịch cũ
   - [ ] Click "Tuần sau" → Load lịch mới
   - [ ] Click "Tuần này" → Reset về tuần hiện tại

4. **Session Status Colors**
   - [ ] Buổi đã học → Màu xám, opacity 0.85
   - [ ] Buổi hôm nay → Màu vàng/đỏ, có animation
   - [ ] Buổi sắp tới → Màu xanh/tím

5. **Performance**
   ```javascript
   // Browser console
   performance.mark('filter-start');
   // Change filter
   performance.mark('filter-end');
   performance.measure('filter-time', 'filter-start', 'filter-end');
   console.log(performance.getEntriesByType('measure'));
   ```
   - [ ] Filter response < 500ms
   - [ ] Week navigation < 300ms
   - [ ] No lag khi scroll
   - [ ] No memory leaks

#### ⏰ 14:00 - 14:30: Test Bài Kiểm Tra (Tests)

**Test Cases:**
1. **Test Attempt Limit**
   - [ ] Làm bài lần 1 → Pass
   - [ ] Làm bài lần 2 → Pass
   - [ ] Làm bài lần 3 → Block với message
   - [ ] Check API response: 403

2. **Test Score Display**
   - [ ] Điểm hiển thị trên thang 10
   - [ ] Điểm cao nhất được lưu
   - [ ] History hiển thị đầy đủ

3. **Test with Multiple Students**
   - [ ] Login 5 students khác nhau
   - [ ] Mỗi student làm 1-2 bài
   - [ ] Check leaderboard (nếu có)

#### ⏰ 14:30 - 15:00: Test Enrollment & Classes

**Test Cases:**
1. **Enrollment Status**
   - [ ] ACTIVE enrollments hiển thị
   - [ ] COMPLETED enrollments ẩn (hoặc gray)
   - [ ] DROPPED enrollments không hiển thị

2. **Class Filters**
   - [ ] Filter by level (1, 2, 3)
   - [ ] Filter by status (ongoing, upcoming, completed)
   - [ ] Search by name

---

### Chiều (15:30 - 17:30)

#### ⏰ 15:30 - 16:30: Test Edge Cases

**Scenarios:**
1. **Student không có enrollment**
   - [ ] Schedule page → Empty state
   - [ ] Filters → Disabled hoặc empty

2. **Student có nhiều classes (5+)**
   - [ ] Schedule page load time
   - [ ] Filters hoạt động
   - [ ] UI không bị vỡ

3. **Buổi học trùng giờ (conflict)**
   - [ ] Hiển thị warning (nếu có)
   - [ ] Chọn được 1 trong 2

4. **Data missing**
   - [ ] Room bị xóa → Fallback display
   - [ ] Teacher bị xóa → Fallback display
   - [ ] Course bị xóa → Handle gracefully

#### ⏰ 16:30 - 17:00: Test Mobile Responsive

**Devices:**
- [ ] iPhone SE (375x667)
- [ ] iPhone 12 (390x844)
- [ ] iPad (768x1024)
- [ ] Samsung Galaxy (360x640)

**Test:**
- [ ] Schedule table → Horizontal scroll
- [ ] Filters → Full width
- [ ] Buttons → Touch friendly
- [ ] Text readable
- [ ] No overlap/overflow

#### ⏰ 17:00 - 17:30: Performance Testing

**Tools:**
```bash
# Backend
pip install locust

# Create locustfile.py
# Run: locust -f locustfile.py
```

**Tests:**
- [ ] 10 concurrent users → Response time
- [ ] 50 concurrent users → Response time
- [ ] 100 concurrent users → Errors?

**Metrics:**
- [ ] API response time < 500ms (p95)
- [ ] Frontend render < 1s
- [ ] No 500 errors
- [ ] No memory leaks

---

### Tối (19:00 - 21:00)

#### ⏰ 19:00 - 20:00: Bug Fixes

**Priority:**
1. Critical bugs (blocking features)
2. High priority bugs (major impact)
3. Medium priority bugs
4. Low priority bugs (cosmetic)

**Template:**
```markdown
### Bug #1
**Severity**: Critical/High/Medium/Low
**Description**: ...
**Steps to reproduce**: 
1. ...
2. ...
**Expected**: ...
**Actual**: ...
**Fix**: ...
**Status**: Fixed/In Progress/To Do
```

#### ⏰ 20:00 - 20:30: Tối Ưu Cuối Cùng

**Based on findings:**
- [ ] Add indexes nếu query chậm
- [ ] Cache nếu cần
- [ ] Refactor bottlenecks
- [ ] Update documentation

#### ⏰ 20:30 - 21:00: Tổng Kết & Báo Cáo

**Report Template:**
```markdown
# 📊 Test Report - 17/10/2025

## ✅ Passed Tests
- Schedule filters: PASS
- Week navigation: PASS
- Test attempt limit: PASS
...

## ❌ Failed Tests
- Bug #1: ...
- Bug #2: ...

## 📈 Performance Metrics
- Schedule load time: 250ms
- Filter response: 180ms
- API p95: 350ms

## 🔧 Optimizations Applied
- Added index on schedule_date
- Cached course/class options
...

## 📝 Next Steps
1. Fix Bug #1 (Priority: High)
2. Optimize query X
3. Add feature Y
```

---

## 📋 Tools & Scripts Cần Có

### 1. Backup Script
```python
# scripts/backup_db.py
import shutil
from datetime import datetime

def backup_database():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    src = 'instance/lms.db'
    dst = f'backups/lms_backup_{timestamp}.db'
    shutil.copy2(src, dst)
    print(f"✅ Backup created: {dst}")

if __name__ == '__main__':
    backup_database()
```

### 2. Verify Script
```python
# scripts/verify_seeded_data.py
from app import create_app
from app.models import *

app = create_app()

with app.app_context():
    print("\n📊 Database Statistics:")
    print(f"Courses: {Course.query.count()}")
    print(f"Classes: {Class.query.count()}")
    print(f"Students: {Student.query.count()}")
    print(f"Enrollments: {Enrollment.query.count()}")
    print(f"Schedules: {Schedule.query.count()}")
    
    # Check data integrity
    orphan_enrollments = Enrollment.query.filter(
        ~Enrollment.class_id.in_([c.class_id for c in Class.query.all()])
    ).count()
    
    print(f"\n⚠️ Orphan Enrollments: {orphan_enrollments}")
```

### 3. Performance Test Script
```python
# scripts/locustfile.py
from locust import HttpUser, task, between

class StudentUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        self.client.post("/api/auth/login", json={
            "email": "student1@toeic.edu.vn",
            "password": "student123"
        })
    
    @task(3)
    def view_schedule(self):
        self.client.get("/api/students/STU0001/schedules?start_date=2025-10-13&end_date=2025-10-19")
    
    @task(2)
    def filter_by_course(self):
        self.client.get("/api/students/STU0001/schedules?start_date=2025-10-13&end_date=2025-10-19&course_id=TOEIC450")
    
    @task(1)
    def change_week(self):
        self.client.get("/api/students/STU0001/schedules?start_date=2025-10-20&end_date=2025-10-26")
```

---

## 🎯 Success Criteria

### Must Have (Bắt Buộc)
- [ ] ✅ Filters hoạt động đúng 100%
- [ ] ✅ Không có critical bugs
- [ ] ✅ Performance acceptable (< 1s load)
- [ ] ✅ Mobile responsive works

### Should Have (Nên Có)
- [ ] ✅ Status colors hiển thị đúng
- [ ] ✅ Tooltips works
- [ ] ✅ Animations smooth
- [ ] ✅ < 3 minor bugs

### Nice to Have (Tốt Nếu Có)
- [ ] ✅ Load test passes (100 users)
- [ ] ✅ All edge cases handled
- [ ] ✅ Documentation updated
- [ ] ✅ Zero bugs

---

## 📞 Support & Resources

**Documentation:**
- SCHEDULE_OPTIMIZATION_IMPLEMENTATION.md
- OPTIMIZATION_SUMMARY.md
- DEPLOYMENT_CHECKLIST.md

**Backup Plan:**
- Database backup before seeding
- Git branch for testing
- Rollback script ready

**Contact:**
- Tech Lead: [Name]
- DevOps: [Name]
- QA: [Name]

---

**Ngày thực hiện**: 17/10/2025  
**Người thực hiện**: [Your Name]  
**Thời gian ước tính**: 8-10 giờ  
**Status**: ⏳ Scheduled
