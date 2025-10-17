"""
Script tạo dữ liệu thực tế để test hệ thống LMS
Chạy: python scripts/seed_realistic_test_data.py

⚠️ LƯU Ý: Backup database trước khi chạy!
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

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
from datetime import datetime, timedelta, date, time
import random

app = create_app()

def seed_all():
    """Main function để seed tất cả dữ liệu"""
    with app.app_context():
        print("\n" + "="*60)
        print("🌱 BẮT ĐẦU TẠO DỮ LIỆU THỰC TẾ CHO HỆ THỐNG")
        print("="*60)
        
        try:
            # 1. Seed Courses
            print("\n📚 Đang tạo Courses...")
            courses = seed_courses()
            print(f"   ✅ Đã tạo {len(courses)} courses")
            
            # 2. Seed Rooms
            print("\n🏢 Đang tạo Rooms...")
            rooms = seed_rooms()
            print(f"   ✅ Đã tạo {len(rooms)} rooms")
            
            # 3. Seed Teachers
            print("\n👨‍🏫 Đang tạo Teachers...")
            teachers = seed_teachers()
            print(f"   ✅ Đã tạo {len(teachers)} teachers")
            
            # 4. Seed Classes
            print("\n🎓 Đang tạo Classes...")
            classes = seed_classes()
            print(f"   ✅ Đã tạo {len(classes)} classes")
            
            # 5. Seed Students
            print("\n👨‍🎓 Đang tạo Students...")
            students = seed_students()
            print(f"   ✅ Đã tạo {len(students)} students")
            
            # 6. Seed Enrollments
            print("\n📝 Đang tạo Enrollments...")
            enrollments = seed_enrollments()
            print(f"   ✅ Đã tạo {len(enrollments)} enrollments")
            
            # 7. Seed Schedules
            print("\n📅 Đang tạo Schedules...")
            schedules = seed_schedules()
            print(f"   ✅ Đã tạo {len(schedules)} schedules")
            
            print("\n" + "="*60)
            print("🎉 HOÀN THÀNH TẠO DỮ LIỆU!")
            print("="*60)
            print_summary()
            
        except Exception as e:
            print(f"\n❌ LỖI: {str(e)}")
            import traceback
            traceback.print_exc()
            db.session.rollback()

def seed_courses():
    """Tạo các khóa học TOEIC và Business English"""
    courses_data = [
        # TOEIC Foundation Level
        {
            'id': 'TOEIC450',
            'name': 'TOEIC 450',
            'level': 1,
            'desc': 'Khóa TOEIC Foundation - Mục tiêu 450 điểm. Dành cho người mới bắt đầu.'
        },
        {
            'id': 'TOEIC550',
            'name': 'TOEIC 550',
            'level': 1,
            'desc': 'Khóa TOEIC Elementary - Mục tiêu 550 điểm. Nền tảng vững chắc.'
        },
        {
            'id': 'TOEIC650',
            'name': 'TOEIC 650',
            'level': 1,
            'desc': 'Khóa TOEIC Pre-intermediate - Mục tiêu 650 điểm. Trình độ trung cấp.'
        },
        
        # TOEIC Intermediate Level
        {
            'id': 'TOEIC750',
            'name': 'TOEIC 750',
            'level': 2,
            'desc': 'Khóa TOEIC Intermediate - Mục tiêu 750 điểm. Trình độ khá.'
        },
        {
            'id': 'TOEIC850',
            'name': 'TOEIC 850',
            'level': 2,
            'desc': 'Khóa TOEIC Upper-intermediate - Mục tiêu 850 điểm. Trình độ khá giỏi.'
        },
        {
            'id': 'TOEIC900',
            'name': 'TOEIC 900+',
            'level': 2,
            'desc': 'Khóa TOEIC Advanced - Mục tiêu 900+ điểm. Trình độ cao.'
        },
        
        # Business English
        {
            'id': 'BUSCOM',
            'name': 'Business Communication',
            'level': 3,
            'desc': 'Giao tiếp kinh doanh chuyên nghiệp. Meetings, negotiations, networking.'
        },
        {
            'id': 'PRESENT',
            'name': 'Presentation Skills',
            'level': 3,
            'desc': 'Kỹ năng thuyết trình hiệu quả. Public speaking và visual aids.'
        },
        {
            'id': 'EMAIL',
            'name': 'Email Writing',
            'level': 3,
            'desc': 'Viết email chuyên nghiệp. Business correspondence và etiquette.'
        },
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
        else:
            print(f"   ⚠️ Course {data['id']} đã tồn tại, bỏ qua")
    
    db.session.commit()
    return courses

def seed_rooms():
    """Tạo các phòng học"""
    rooms_data = [
        {'name': 'Phòng 101', 'location': 'Tầng 1', 'capacity': 20},
        {'name': 'Phòng 102', 'location': 'Tầng 1', 'capacity': 25},
        {'name': 'Phòng 103', 'location': 'Tầng 1', 'capacity': 20},
        {'name': 'Phòng 201', 'location': 'Tầng 2', 'capacity': 30},
        {'name': 'Phòng 202', 'location': 'Tầng 2', 'capacity': 25},
        {'name': 'Phòng 203', 'location': 'Tầng 2', 'capacity': 20},
        {'name': 'Lab 1', 'location': 'Tầng 3', 'capacity': 15},
        {'name': 'Lab 2', 'location': 'Tầng 3', 'capacity': 15},
        {'name': 'Auditorium', 'location': 'Tầng 1', 'capacity': 50},
    ]
    
    rooms = []
    for data in rooms_data:
        existing = Room.query.filter_by(room_name=data['name']).first()
        if not existing:
            room = Room(
                room_name=data['name'],
                room_location=data['location'],
                room_capacity=data['capacity'],
                room_status='AVAILABLE'
            )
            db.session.add(room)
            rooms.append(room)
        else:
            print(f"   ⚠️ Room {data['name']} đã tồn tại, bỏ qua")
    
    db.session.commit()
    return rooms

def seed_teachers():
    """Tạo giáo viên"""
    teachers_data = [
        {'id': 'TEACHER01', 'name': 'Nguyễn Văn An', 'email': 'nvan@toeic.edu.vn', 'phone': '0901234501'},
        {'id': 'TEACHER02', 'name': 'Trần Thị Bích', 'email': 'ttbich@toeic.edu.vn', 'phone': '0901234502'},
        {'id': 'TEACHER03', 'name': 'Lê Văn Cường', 'email': 'lvcuong@toeic.edu.vn', 'phone': '0901234503'},
        {'id': 'TEACHER04', 'name': 'Phạm Thị Dung', 'email': 'ptdung@toeic.edu.vn', 'phone': '0901234504'},
        {'id': 'TEACHER05', 'name': 'Hoàng Văn Đạt', 'email': 'hvdat@toeic.edu.vn', 'phone': '0901234505'},
        {'id': 'TEACHER06', 'name': 'Vũ Thị Hoa', 'email': 'vthoa@toeic.edu.vn', 'phone': '0901234506'},
        {'id': 'TEACHER07', 'name': 'Đỗ Văn Giang', 'email': 'dvgiang@toeic.edu.vn', 'phone': '0901234507'},
        {'id': 'TEACHER08', 'name': 'Bùi Thị Hương', 'email': 'bthuong@toeic.edu.vn', 'phone': '0901234508'},
        {'id': 'TEACHER09', 'name': 'Mai Văn Kiên', 'email': 'mvkien@toeic.edu.vn', 'phone': '0901234509'},
        {'id': 'TEACHER10', 'name': 'Lý Thị Lan', 'email': 'ltlan@toeic.edu.vn', 'phone': '0901234510'},
        {'id': 'TEACHER11', 'name': 'Đinh Văn Minh', 'email': 'dvminh@toeic.edu.vn', 'phone': '0901234511'},
        {'id': 'TEACHER12', 'name': 'Ngô Thị Nga', 'email': 'ntnga@toeic.edu.vn', 'phone': '0901234512'},
    ]
    
    teachers = []
    for data in teachers_data:
        teacher = Teacher.query.get(data['id'])
        if not teacher:
            teacher = Teacher(
                user_id=data['id'],
                user_name=data['name'],
                user_email=data['email'],
                user_password=generate_password_hash('teacher123'),
                user_telephone=data['phone'],
                user_role='teacher',
                user_verified=True
            )
            db.session.add(teacher)
            teachers.append(teacher)
        else:
            print(f"   ⚠️ Teacher {data['id']} đã tồn tại, bỏ qua")
    
    db.session.commit()
    return teachers

def seed_classes():
    """Tạo các lớp học"""
    classes = []
    
    # Lấy danh sách courses và teachers
    all_courses = Course.query.all()
    all_teachers = Teacher.query.all()
    
    if not all_courses or not all_teachers:
        print("   ⚠️ Cần có courses và teachers trước!")
        return classes
    
    # Các khung giờ
    time_slots = [
        ('Morning-A', '07:00', '09:00', [0, 2, 4]),     # Thứ 2,4,6 sáng
        ('Morning-B', '09:00', '11:00', [0, 2, 4]),     # Thứ 2,4,6 sáng
        ('Afternoon-A', '13:00', '15:00', [1, 3, 5]),   # Thứ 3,5,7 chiều
        ('Evening-A', '17:00', '19:00', [0, 2, 4]),     # Thứ 2,4,6 tối
        ('Evening-B', '19:00', '21:00', [1, 3, 5]),     # Thứ 3,5,7 tối
        ('Weekend', '09:00', '11:00', [5, 6]),          # Thứ 7, CN
    ]
    
    class_counter = 1
    
    # Tạo 3-4 lớp cho mỗi khóa học
    for course in all_courses:
        # Chọn random 3-4 time slots
        selected_slots = random.sample(time_slots, min(4, len(time_slots)))
        
        for slot_name, start_time, end_time, weekdays in selected_slots:
            teacher = random.choice(all_teachers)
            
            # Tính start date và end date
            start_date = date.today() - timedelta(days=random.randint(14, 30))
            end_date = start_date + timedelta(days=90)  # 3 tháng
            
            class_name = f"{course.course_name} - {slot_name} #{class_counter}"
            
            # Check if class already exists
            existing = Class.query.filter_by(class_name=class_name).first()
            if not existing:
                class_obj = Class(
                    class_name=class_name,
                    class_startdate=start_date,
                    class_enddate=end_date,
                    class_maxstudents=random.choice([15, 20, 25]),
                    course_id=course.course_id,
                    user_id=teacher.user_id
                )
                db.session.add(class_obj)
                classes.append(class_obj)
                class_counter += 1
    
    db.session.commit()
    return classes

def seed_students():
    """Tạo học viên"""
    students = []
    
    first_names = ['An', 'Bình', 'Chi', 'Dung', 'Đức', 'Hà', 'Hải', 'Hương', 'Khoa', 'Lan', 
                   'Linh', 'Long', 'Mai', 'Minh', 'Nam', 'Nga', 'Phong', 'Quân', 'Tâm', 'Tuấn',
                   'Vy', 'Yến', 'Anh', 'Bảo', 'Cường', 'Duy', 'Giang', 'Hùng', 'Khánh', 'Lâm']
    
    last_names = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ',
                  'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh']
    
    for i in range(1, 151):  # 150 students
        student_id = f"STU{i:04d}"
        
        # Check if exists
        if Student.query.get(student_id):
            continue
        
        first = random.choice(first_names)
        last = random.choice(last_names)
        full_name = f"{last} {first}"
        
        student = Student(
            user_id=student_id,
            user_name=full_name,
            user_email=f"student{i}@toeic.edu.vn",
            user_password=generate_password_hash('student123'),
            user_telephone=f"090{random.randint(1000000, 9999999)}",
            user_role='student',
            user_verified=random.choice([True, True, True, False]),  # 75% verified
            user_gender=random.choice(['Nam', 'Nữ']),
            student_level=random.choice([1, 1, 1, 2, 2, 3])  # Phân bổ: 50% level 1, 33% level 2, 17% level 3
        )
        db.session.add(student)
        students.append(student)
    
    db.session.commit()
    return students

def seed_enrollments():
    """Tạo enrollment cho students vào classes"""
    enrollments = []
    
    all_students = Student.query.all()
    all_classes = Class.query.all()
    
    if not all_students or not all_classes:
        print("   ⚠️ Cần có students và classes trước!")
        return enrollments
    
    # Mỗi học viên enroll vào 1-3 lớp
    for student in all_students:
        # Số lớp enroll: 70% enroll 1-2 lớp, 30% enroll 3 lớp
        num_classes = random.choices([1, 2, 3], weights=[0.4, 0.4, 0.2])[0]
        
        # Chọn random classes
        available_classes = [c for c in all_classes]
        if len(available_classes) < num_classes:
            num_classes = len(available_classes)
        
        selected_classes = random.sample(available_classes, num_classes)
        
        for class_obj in selected_classes:
            # Check if already enrolled
            existing = Enrollment.query.filter_by(
                user_id=student.user_id,
                class_id=class_obj.class_id
            ).first()
            
            if not existing:
                # Phân bổ status: 80% ACTIVE, 15% COMPLETED, 5% DROPPED
                status = random.choices(
                    ['ACTIVE', 'COMPLETED', 'DROPPED'],
                    weights=[0.80, 0.15, 0.05]
                )[0]
                
                enrollment_date = class_obj.class_startdate + timedelta(days=random.randint(-7, 7))
                
                enrollment = Enrollment(
                    user_id=student.user_id,
                    class_id=class_obj.class_id,
                    enrollment_date=enrollment_date,
                    status=status
                )
                db.session.add(enrollment)
                enrollments.append(enrollment)
    
    db.session.commit()
    return enrollments

def seed_schedules():
    """Tạo lịch học cho các lớp"""
    schedules = []
    
    all_classes = Class.query.all()
    all_rooms = Room.query.all()
    
    if not all_classes or not all_rooms:
        print("   ⚠️ Cần có classes và rooms trước!")
        return schedules
    
    for class_obj in all_classes:
        # Parse time slot từ class name
        if 'Morning' in class_obj.class_name:
            if 'Morning-A' in class_obj.class_name:
                start_time, end_time = '07:00:00', '09:00:00'
                weekdays = [0, 2, 4]  # Thứ 2,4,6
            else:
                start_time, end_time = '09:00:00', '11:00:00'
                weekdays = [0, 2, 4]
        elif 'Afternoon' in class_obj.class_name:
            start_time, end_time = '13:00:00', '15:00:00'
            weekdays = [1, 3, 5]  # Thứ 3,5,7
        elif 'Evening-A' in class_obj.class_name:
            start_time, end_time = '17:00:00', '19:00:00'
            weekdays = [0, 2, 4]
        elif 'Evening-B' in class_obj.class_name:
            start_time, end_time = '19:00:00', '21:00:00'
            weekdays = [1, 3, 5]
        elif 'Weekend' in class_obj.class_name:
            start_time, end_time = '09:00:00', '11:00:00'
            weekdays = [5, 6]  # Thứ 7, CN
        else:
            start_time, end_time = '14:00:00', '16:00:00'
            weekdays = [0, 2, 4]
        
        # Chọn random room
        room = random.choice(all_rooms)
        
        # Tạo lịch cho 8 tuần (4 tuần qua + 4 tuần tới)
        current_date = date.today() - timedelta(days=28)
        end_date = date.today() + timedelta(days=28)
        
        while current_date <= end_date:
            # Chỉ tạo lịch cho các ngày trong weekdays
            if current_date.weekday() in weekdays:
                # Check if schedule already exists
                existing = Schedule.query.filter_by(
                    class_id=class_obj.class_id,
                    schedule_date=current_date
                ).first()
                
                if not existing:
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

def print_summary():
    """In tổng quan dữ liệu đã tạo"""
    print("\n📊 TỔNG QUAN DỮ LIỆU TRONG HỆ THỐNG")
    print("="*60)
    
    stats = {
        'Courses': Course.query.count(),
        'Classes': Class.query.count(),
        'Rooms': Room.query.count(),
        'Teachers': Teacher.query.count(),
        'Students': Student.query.count(),
        'Enrollments': Enrollment.query.count(),
        'Schedules': Schedule.query.count(),
    }
    
    for key, value in stats.items():
        print(f"   {key:20} : {value:5}")
    
    print("="*60)
    
    # Thống kê chi tiết
    print("\n📈 THỐNG KÊ CHI TIẾT")
    print("="*60)
    
    # Enrollment by status
    active_enr = Enrollment.query.filter_by(status='ACTIVE').count()
    completed_enr = Enrollment.query.filter_by(status='COMPLETED').count()
    dropped_enr = Enrollment.query.filter_by(status='DROPPED').count()
    
    print(f"   Enrollments ACTIVE    : {active_enr}")
    print(f"   Enrollments COMPLETED : {completed_enr}")
    print(f"   Enrollments DROPPED   : {dropped_enr}")
    
    # Schedules by time
    today = date.today()
    past_schedules = Schedule.query.filter(Schedule.schedule_date < today).count()
    today_schedules = Schedule.query.filter(Schedule.schedule_date == today).count()
    future_schedules = Schedule.query.filter(Schedule.schedule_date > today).count()
    
    print(f"\n   Schedules (Đã học)   : {past_schedules}")
    print(f"   Schedules (Hôm nay)  : {today_schedules}")
    print(f"   Schedules (Sắp tới)  : {future_schedules}")
    
    print("="*60)
    
    # Sample login credentials
    print("\n🔐 THÔNG TIN ĐĂNG NHẬP MẪU")
    print("="*60)
    print("   Teacher:")
    print("      Email: teacher1@toeic.edu.vn")
    print("      Password: teacher123")
    print("\n   Student:")
    print("      Email: student1@toeic.edu.vn")
    print("      Password: student123")
    print("="*60)

if __name__ == '__main__':
    print("\n⚠️  CẢNH BÁO: Script này sẽ tạo NHIỀU dữ liệu mẫu vào database!")
    print("   Đảm bảo bạn đã backup database trước khi chạy.\n")
    
    response = input("Bạn có chắc chắn muốn tiếp tục? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        seed_all()
    else:
        print("\n❌ Đã hủy. Không có dữ liệu nào được tạo.")
