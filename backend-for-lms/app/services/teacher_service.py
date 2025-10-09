from app.config import db
from app.models.teacher_model import Teacher
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from datetime import datetime, date


class TeacherService:
    """Service xử lý business logic cho Teacher"""

    def __init__(self, database=None):
        self.db = database or db

    # --------- READ ----------
    def get_all(self) -> List[Teacher]:
        """Lấy tất cả teachers"""
        try:
            return self.db.session.query(Teacher).all()
        except Exception as e:
            print(f"Lỗi khi lấy danh sách teachers: {str(e)}")
            return []

    def get_by_id(self, user_id: str) -> Optional[Teacher]:
        """Lấy teacher theo ID"""
        try:
            return self.db.session.query(Teacher).filter(Teacher.user_id == user_id).first()
        except Exception as e:
            print(f"Lỗi khi lấy teacher theo ID: {str(e)}")
            return None

    def get_paginated(self, offset: int = 0, limit: int = 10) -> Dict[str, Any]:
        """Lấy teachers với phân trang"""
        try:
            query = self.db.session.query(Teacher)
            total = query.count()
            teachers = query.offset(offset).limit(limit).all()
            
            data = [teacher.to_dict() for teacher in teachers]
            
            return {
                "data": data,
                "total": total
            }
        except Exception as e:
            print(f"Lỗi khi lấy teachers phân trang: {str(e)}")
            return {"data": [], "total": 0}

    def search(self, keyword: str) -> List[Teacher]:
        """Tìm kiếm teachers theo từ khóa"""
        try:
            keyword = f"%{keyword}%"
            return self.db.session.query(Teacher).filter(
                Teacher.user_name.ilike(keyword) |
                Teacher.user_email.ilike(keyword) |
                Teacher.tch_specialization.ilike(keyword)
            ).all()
        except Exception as e:
            print(f"Lỗi khi tìm kiếm teachers: {str(e)}")
            return []

    def get_senior_teachers(self) -> List[Teacher]:
        """Lấy danh sách giáo viên thâm niên (> 5 năm)"""
        try:
            teachers = self.db.session.query(Teacher).all()
            senior_teachers = [teacher for teacher in teachers if teacher.is_senior_teacher()]
            return senior_teachers
        except Exception as e:
            print(f"Lỗi khi lấy giáo viên thâm niên: {str(e)}")
            return []

    def get_statistics(self) -> Dict[str, Any]:
        """Lấy thống kê giáo viên"""
        try:
            total_teachers = self.db.session.query(Teacher).count()
            senior_teachers = len(self.get_senior_teachers())
            
            # Thống kê theo giới tính
            gender_stats = self.db.session.query(
                Teacher.user_gender,
                self.db.func.count(Teacher.user_id)
            ).group_by(Teacher.user_gender).all()
            
            gender_data = {gender: count for gender, count in gender_stats if gender}
            
            # Thống kê theo chuyên môn
            specialization_stats = self.db.session.query(
                Teacher.tch_specialization,
                self.db.func.count(Teacher.user_id)
            ).group_by(Teacher.tch_specialization).all()
            
            specialization_data = {spec: count for spec, count in specialization_stats if spec}
            
            return {
                "total_teachers": total_teachers,
                "senior_teachers": senior_teachers,
                "junior_teachers": total_teachers - senior_teachers,
                "gender_distribution": gender_data,
                "specialization_distribution": specialization_data
            }
        except Exception as e:
            print(f"Lỗi khi lấy thống kê: {str(e)}")
            return {
                "total_teachers": 0,
                "senior_teachers": 0,
                "junior_teachers": 0,
                "gender_distribution": {},
                "specialization_distribution": {}
            }

    # --------- CREATE ----------
    def create(self, data: Dict[str, Any]) -> Optional[Teacher]:
        """Tạo teacher mới"""
        try:
            # Tạo user_id tự động
            user_id = self._generate_user_id()
            
            teacher = Teacher(
                user_id=user_id,
                user_name=data.get('user_name'),
                user_gender=data.get('user_gender'),
                user_email=data.get('user_email'),
                user_birthday=datetime.strptime(data['user_birthday'], '%Y-%m-%d').date() if data.get('user_birthday') else None,
                user_telephone=data.get('user_telephone'),
                tch_specialization=data.get('tch_specialization'),
                tch_qualification=data.get('tch_qualification'),
                tch_hire_date=datetime.strptime(data['tch_hire_date'], '%Y-%m-%d').date() if data.get('tch_hire_date') else None,
                tch_avtlink=data.get('tch_avtlink')
            )
            
            # Set password nếu có
            if data.get('user_password'):
                teacher.set_password(data['user_password'])
            
            self.db.session.add(teacher)
            self.db.session.commit()
            
            return teacher
        except IntegrityError as e:
            self.db.session.rollback()
            print(f"Lỗi integrity khi tạo teacher: {str(e)}")
            return None
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi tạo teacher: {str(e)}")
            return None

    # --------- UPDATE ----------
    def update(self, user_id: str, data: Dict[str, Any]) -> Optional[Teacher]:
        """Cập nhật teacher"""
        try:
            teacher = self.get_by_id(user_id)
            if not teacher:
                return None
            
            # Cập nhật các trường
            if 'user_name' in data:
                teacher.user_name = data['user_name']
            if 'user_gender' in data:
                teacher.user_gender = data['user_gender']
            if 'user_email' in data:
                teacher.user_email = data['user_email']
            if 'user_birthday' in data and data['user_birthday']:
                teacher.user_birthday = datetime.strptime(data['user_birthday'], '%Y-%m-%d').date()
            if 'user_telephone' in data:
                teacher.user_telephone = data['user_telephone']
            if 'tch_specialization' in data:
                teacher.tch_specialization = data['tch_specialization']
            if 'tch_qualification' in data:
                teacher.tch_qualification = data['tch_qualification']
            if 'tch_hire_date' in data and data['tch_hire_date']:
                teacher.tch_hire_date = datetime.strptime(data['tch_hire_date'], '%Y-%m-%d').date()
            if 'tch_avtlink' in data:
                teacher.tch_avtlink = data['tch_avtlink']
            if 'user_password' in data and data['user_password']:
                teacher.set_password(data['user_password'])
            
            self.db.session.commit()
            return teacher
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi cập nhật teacher: {str(e)}")
            return None

    # --------- DELETE ----------
    def delete(self, user_id: str) -> bool:
        """Xóa teacher"""
        try:
            teacher = self.get_by_id(user_id)
            if not teacher:
                return False
            
            self.db.session.delete(teacher)
            self.db.session.commit()
            return True
        except Exception as e:
            self.db.session.rollback()
            print(f"Lỗi khi xóa teacher: {str(e)}")
            return False

    # --------- HELPER METHODS ----------
    def _generate_user_id(self) -> str:
        """Tạo user_id tự động"""
        # Tìm user_id lớn nhất hiện tại
        max_id = self.db.session.query(self.db.func.max(Teacher.user_id)).scalar()
        
        if max_id:
            # Tăng số cuối cùng
            try:
                number = int(max_id[2:])  # Bỏ "TC" ở đầu
                return f"TC{number + 1:06d}"
            except ValueError:
                pass
        
        # Nếu không có hoặc lỗi, bắt đầu từ TC000001
        return "TC000001"
