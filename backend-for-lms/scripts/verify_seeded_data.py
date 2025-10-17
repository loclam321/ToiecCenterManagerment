"""
Script verify dữ liệu đã seed
Chạy: python scripts/verify_seeded_data.py
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models.course_model import Course
from app.models.class_model import Class
from app.models.room_model import Room
from app.models.teacher_model import Teacher
from app.models.student_model import Student
from app.models.enrollment_model import Enrollment
from app.models.schedule_model import Schedule
from datetime import date
from sqlalchemy import func

app = create_app()

def verify_all():
    """Verify tất cả dữ liệu"""
    with app.app_context():
        print("\n" + "="*70)
        print("🔍 KIỂM TRA DỮ LIỆU TRONG HỆ THỐNG")
        print("="*70)
        
        # 1. Basic counts
        print_basic_stats()
        
        # 2. Data integrity checks
        print("\n🔗 KIỂM TRA TÍNH TOÀN VẸN DỮ LIỆU")
        print("="*70)
        check_data_integrity()
        
        # 3. Business logic checks
        print("\n💼 KIỂM TRA LOGIC NGHIỆP VỤ")
        print("="*70)
        check_business_logic()
        
        # 4. Sample data
        print("\n📝 MẪU DỮ LIỆU")
        print("="*70)
        show_sample_data()

def print_basic_stats():
    """In thống kê cơ bản"""
    stats = {
        'Courses': Course.query.count(),
        'Classes': Class.query.count(),
        'Rooms': Room.query.count(),
        'Teachers': Teacher.query.count(),
        'Students': Student.query.count(),
        'Enrollments': Enrollment.query.count(),
        'Schedules': Schedule.query.count(),
    }
    
    print("\n📊 THỐNG KÊ CƠ BẢN")
    for key, value in stats.items():
        status = "✅" if value > 0 else "❌"
        print(f"   {status} {key:20} : {value:5}")

def check_data_integrity():
    """Kiểm tra tính toàn vẹn dữ liệu"""
    
    # 1. Orphan Enrollments (enrollment không có class)
    all_class_ids = [c.class_id for c in Class.query.all()]
    orphan_enrollments = Enrollment.query.filter(
        ~Enrollment.class_id.in_(all_class_ids) if all_class_ids else True
    ).count()
    
    if orphan_enrollments > 0:
        print(f"   ❌ Có {orphan_enrollments} enrollments không có class tương ứng")
    else:
        print(f"   ✅ Không có orphan enrollments")
    
    # 2. Orphan Schedules
    orphan_schedules = Schedule.query.filter(
        ~Schedule.class_id.in_(all_class_ids) if all_class_ids else True
    ).count()
    
    if orphan_schedules > 0:
        print(f"   ❌ Có {orphan_schedules} schedules không có class tương ứng")
    else:
        print(f"   ✅ Không có orphan schedules")
    
    # 3. Classes without teacher
    classes_no_teacher = Class.query.filter(Class.user_id == None).count()
    
    if classes_no_teacher > 0:
        print(f"   ⚠️  Có {classes_no_teacher} classes chưa có teacher")
    else:
        print(f"   ✅ Tất cả classes đều có teacher")
    
    # 4. Enrollments without student
    all_student_ids = [s.user_id for s in Student.query.all()]
    invalid_enrollments = Enrollment.query.filter(
        ~Enrollment.user_id.in_(all_student_ids) if all_student_ids else True
    ).count()
    
    if invalid_enrollments > 0:
        print(f"   ❌ Có {invalid_enrollments} enrollments không có student tương ứng")
    else:
        print(f"   ✅ Tất cả enrollments đều hợp lệ")

def check_business_logic():
    """Kiểm tra logic nghiệp vụ"""
    
    # 1. Enrollment status distribution
    print("\n   📈 Phân bố Enrollment Status:")
    statuses = Enrollment.query.with_entities(
        Enrollment.status,
        func.count(Enrollment.enrollment_id)
    ).group_by(Enrollment.status).all()
    
    total_enr = sum(count for _, count in statuses)
    for status, count in statuses:
        percentage = (count / total_enr * 100) if total_enr > 0 else 0
        print(f"      {status:15} : {count:5} ({percentage:5.1f}%)")
    
    # 2. Schedule distribution
    today = date.today()
    past = Schedule.query.filter(Schedule.schedule_date < today).count()
    current = Schedule.query.filter(Schedule.schedule_date == today).count()
    future = Schedule.query.filter(Schedule.schedule_date > today).count()
    total_sch = past + current + future
    
    print("\n   📅 Phân bố Schedules:")
    print(f"      Đã học (past)  : {past:5} ({past/total_sch*100 if total_sch else 0:5.1f}%)")
    print(f"      Hôm nay        : {current:5} ({current/total_sch*100 if total_sch else 0:5.1f}%)")
    print(f"      Sắp tới (future): {future:5} ({future/total_sch*100 if total_sch else 0:5.1f}%)")
    
    # 3. Students per class average
    enrollments_per_class = Enrollment.query.filter_by(status='ACTIVE').with_entities(
        Enrollment.class_id,
        func.count(Enrollment.enrollment_id)
    ).group_by(Enrollment.class_id).all()
    
    if enrollments_per_class:
        avg_students = sum(count for _, count in enrollments_per_class) / len(enrollments_per_class)
        max_students = max(count for _, count in enrollments_per_class)
        min_students = min(count for _, count in enrollments_per_class)
        
        print("\n   👥 Học viên/Lớp:")
        print(f"      Trung bình    : {avg_students:5.1f}")
        print(f"      Tối đa        : {max_students:5}")
        print(f"      Tối thiểu     : {min_students:5}")
    
    # 4. Room utilization
    total_rooms = Room.query.count()
    used_rooms = Schedule.query.with_entities(Schedule.room_id).distinct().count()
    
    print("\n   🏢 Sử dụng Phòng:")
    print(f"      Tổng phòng    : {total_rooms}")
    print(f"      Phòng đang dùng: {used_rooms}")
    if total_rooms > 0:
        print(f"      Tỷ lệ sử dụng : {used_rooms/total_rooms*100:.1f}%")

def show_sample_data():
    """Hiển thị mẫu dữ liệu"""
    
    # Sample course
    sample_course = Course.query.first()
    if sample_course:
        print("\n   📚 Sample Course:")
        print(f"      ID: {sample_course.course_id}")
        print(f"      Name: {sample_course.course_name}")
        print(f"      Level: {sample_course.course_level}")
    
    # Sample class
    sample_class = Class.query.first()
    if sample_class:
        print("\n   🎓 Sample Class:")
        print(f"      ID: {sample_class.class_id}")
        print(f"      Name: {sample_class.class_name}")
        print(f"      Course: {sample_class.course_id}")
        print(f"      Teacher: {sample_class.user_id}")
        print(f"      Dates: {sample_class.class_startdate} to {sample_class.class_enddate}")
    
    # Sample student with enrollments
    sample_student = Student.query.join(Enrollment).first()
    if sample_student:
        enrollments = Enrollment.query.filter_by(user_id=sample_student.user_id).all()
        print("\n   👨‍🎓 Sample Student:")
        print(f"      ID: {sample_student.user_id}")
        print(f"      Name: {sample_student.user_name}")
        print(f"      Email: {sample_student.user_email}")
        print(f"      Level: {sample_student.student_level}")
        print(f"      Enrollments: {len(enrollments)}")
        
        for enr in enrollments[:3]:  # Show first 3
            print(f"         - Class {enr.class_id}: {enr.status}")
    
    # Sample schedule
    sample_schedule = Schedule.query.first()
    if sample_schedule:
        print("\n   📅 Sample Schedule:")
        print(f"      ID: {sample_schedule.schedule_id}")
        print(f"      Class: {sample_schedule.class_id}")
        print(f"      Room: {sample_schedule.room_id}")
        print(f"      Date: {sample_schedule.schedule_date}")
        print(f"      Time: {sample_schedule.schedule_startime} - {sample_schedule.schedule_endtime}")

def verify_filters():
    """Test các filters sẽ được dùng trong UI"""
    print("\n🔍 KIỂM TRA FILTERS")
    print("="*70)
    
    # 1. Filter by course
    sample_course = Course.query.first()
    if sample_course:
        schedules = Schedule.query.join(Class).filter(
            Class.course_id == sample_course.course_id
        ).count()
        print(f"   ✅ Filter by Course '{sample_course.course_id}': {schedules} schedules")
    
    # 2. Filter by class
    sample_class = Class.query.first()
    if sample_class:
        schedules = Schedule.query.filter_by(class_id=sample_class.class_id).count()
        print(f"   ✅ Filter by Class {sample_class.class_id}: {schedules} schedules")
    
    # 3. Filter by date range
    today = date.today()
    from datetime import timedelta
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    
    schedules = Schedule.query.filter(
        Schedule.schedule_date >= week_start,
        Schedule.schedule_date <= week_end
    ).count()
    print(f"   ✅ Filter by Week ({week_start} to {week_end}): {schedules} schedules")
    
    # 4. Combined filters
    if sample_class:
        schedules = Schedule.query.filter(
            Schedule.class_id == sample_class.class_id,
            Schedule.schedule_date >= week_start,
            Schedule.schedule_date <= week_end
        ).count()
        print(f"   ✅ Combined Filter (Class + Week): {schedules} schedules")

if __name__ == '__main__':
    verify_all()
    verify_filters()
    
    print("\n" + "="*70)
    print("✅ HOÀN THÀNH VERIFY")
    print("="*70)
