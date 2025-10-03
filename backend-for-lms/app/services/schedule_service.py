from typing import Dict, Any, List, Optional, Union, Tuple
from datetime import datetime, date, time, timedelta
from flask import current_app
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, and_, or_, not_

from app.config import db
from app.models.schedule_model import Schedule
from app.models.class_model import Class
from app.models.teacher_model import Teacher
from app.models.room_model import Room


class ScheduleService:
    """Service để quản lý lịch học"""

    def __init__(self, database=None):
        self.db = database or db

    def get_schedule_by_id(self, schedule_id: int) -> Dict[str, Any]:
        """Lấy thông tin lịch học theo ID"""
        try:
            schedule = Schedule.query.get(schedule_id)
            if not schedule:
                return {"success": False, "error": f"Schedule with ID {schedule_id} not found"}
            
            return {"success": True, "data": schedule.to_dict()}
        except Exception as e:
            current_app.logger.error(f"Error in get_schedule_by_id: {str(e)}")
            return {"success": False, "error": f"Error retrieving schedule: {str(e)}"}

    def get_schedules_by_class(self, class_id: int) -> Dict[str, Any]:
        """Lấy tất cả lịch học của một lớp"""
        try:
            schedules = Schedule.get_schedules_by_class(class_id)
            return {
                "success": True,
                "data": [schedule.to_dict() for schedule in schedules]
            }
        except Exception as e:
            current_app.logger.error(f"Error in get_schedules_by_class: {str(e)}")
            return {"success": False, "error": f"Error retrieving schedules: {str(e)}"}

    def get_schedules_by_teacher(self, teacher_id: str) -> Dict[str, Any]:
        """Lấy tất cả lịch dạy của một giáo viên"""
        try:
            schedules = Schedule.get_schedules_by_teacher(teacher_id)
            return {
                "success": True,
                "data": [schedule.to_dict() for schedule in schedules]
            }
        except Exception as e:
            current_app.logger.error(f"Error in get_schedules_by_teacher: {str(e)}")
            return {"success": False, "error": f"Error retrieving schedules: {str(e)}"}

    def get_schedules_by_room(self, room_id: int) -> Dict[str, Any]:
        """Lấy tất cả lịch học trong một phòng"""
        try:
            schedules = Schedule.get_schedules_by_room(room_id)
            return {
                "success": True,
                "data": [schedule.to_dict() for schedule in schedules]
            }
        except Exception as e:
            current_app.logger.error(f"Error in get_schedules_by_room: {str(e)}")
            return {"success": False, "error": f"Error retrieving schedules: {str(e)}"}

    def get_schedules_by_date(self, date_str: str) -> Dict[str, Any]:
        """Lấy tất cả lịch học trong ngày cụ thể"""
        try:
            schedule_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            schedules = Schedule.get_schedules_by_date(schedule_date)
            return {
                "success": True,
                "data": [schedule.to_dict() for schedule in schedules]
            }
        except ValueError:
            return {"success": False, "error": "Invalid date format. Use YYYY-MM-DD"}
        except Exception as e:
            current_app.logger.error(f"Error in get_schedules_by_date: {str(e)}")
            return {"success": False, "error": f"Error retrieving schedules: {str(e)}"}

    def create_schedule(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tạo lịch học mới
        
        Args:
            data: Dict chứa thông tin lịch học
                - room_id: ID phòng học
                - class_id: ID lớp học
                - user_id: ID giáo viên
                - schedule_date: Ngày học (YYYY-MM-DD)
                - schedule_startime: Giờ bắt đầu (HH:MM)
                - schedule_endtime: Giờ kết thúc (HH:MM)
        """
        try:
            # Validate dữ liệu
            missing_fields = []
            for field in ["room_id", "class_id", "user_id", "schedule_date"]:
                if field not in data:
                    missing_fields.append(field)
            
            if missing_fields:
                return {"success": False, "error": f"Missing required fields: {', '.join(missing_fields)}"}
            
            # Validate các đối tượng liên quan
            room = Room.query.get(data["room_id"])
            if not room:
                return {"success": False, "error": f"Room with ID {data['room_id']} not found"}
            
            class_obj = Class.query.get(data["class_id"])
            if not class_obj:
                return {"success": False, "error": f"Class with ID {data['class_id']} not found"}
            
            teacher = Teacher.query.get(data["user_id"])
            if not teacher:
                return {"success": False, "error": f"Teacher with ID {data['user_id']} not found"}
            
            # Chuyển đổi dữ liệu
            schedule_date = None
            if isinstance(data["schedule_date"], str):
                schedule_date = datetime.strptime(data["schedule_date"], "%Y-%m-%d").date()
            else:
                schedule_date = data["schedule_date"]
            
            schedule_startime = None
            if "schedule_startime" in data and data["schedule_startime"]:
                if isinstance(data["schedule_startime"], str):
                    schedule_startime = datetime.strptime(data["schedule_startime"], "%H:%M").time()
                else:
                    schedule_startime = data["schedule_startime"]
            
            schedule_endtime = None
            if "schedule_endtime" in data and data["schedule_endtime"]:
                if isinstance(data["schedule_endtime"], str):
                    schedule_endtime = datetime.strptime(data["schedule_endtime"], "%H:%M").time()
                else:
                    schedule_endtime = data["schedule_endtime"]
            
            # Kiểm tra xung đột lịch
            conflict_check = self.check_schedule_conflicts(
                data["room_id"], 
                data["user_id"], 
                schedule_date, 
                schedule_startime, 
                schedule_endtime,
                None  # Không có schedule_id vì đang tạo mới
            )
            
            if not conflict_check["success"]:
                return {"success": False, "error": conflict_check["error"]}
            
            # Tạo lịch học mới
            schedule = Schedule(
                room_id=data["room_id"],
                class_id=data["class_id"],
                user_id=data["user_id"],
                schedule_date=schedule_date,
                schedule_startime=schedule_startime,
                schedule_endtime=schedule_endtime
            )
            
            self.db.session.add(schedule)
            self.db.session.commit()
            
            return {"success": True, "data": schedule.to_dict()}
            
        except ValueError as e:
            self.db.session.rollback()
            return {"success": False, "error": f"Data format error: {str(e)}"}
        except IntegrityError as e:
            self.db.session.rollback()
            current_app.logger.error(f"Integrity error in create_schedule: {str(e)}")
            return {"success": False, "error": f"Database integrity error: {str(e)}"}
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error in create_schedule: {str(e)}")
            return {"success": False, "error": f"Error creating schedule: {str(e)}"}

    def update_schedule(self, schedule_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cập nhật thông tin lịch học
        
        Args:
            schedule_id: ID của lịch cần cập nhật
            data: Dict chứa thông tin cập nhật
        """
        try:
            schedule = Schedule.query.get(schedule_id)
            if not schedule:
                return {"success": False, "error": f"Schedule with ID {schedule_id} not found"}
            
            # Cập nhật các trường được cung cấp
            if "room_id" in data:
                room = Room.query.get(data["room_id"])
                if not room:
                    return {"success": False, "error": f"Room with ID {data['room_id']} not found"}
                schedule.room_id = data["room_id"]
            
            if "class_id" in data:
                class_obj = Class.query.get(data["class_id"])
                if not class_obj:
                    return {"success": False, "error": f"Class with ID {data['class_id']} not found"}
                schedule.class_id = data["class_id"]
            
            if "user_id" in data:
                teacher = Teacher.query.get(data["user_id"])
                if not teacher:
                    return {"success": False, "error": f"Teacher with ID {data['user_id']} not found"}
                schedule.user_id = data["user_id"]
            
            if "schedule_date" in data:
                if isinstance(data["schedule_date"], str):
                    schedule.schedule_date = datetime.strptime(data["schedule_date"], "%Y-%m-%d").date()
                else:
                    schedule.schedule_date = data["schedule_date"]
            
            if "schedule_startime" in data:
                if isinstance(data["schedule_startime"], str):
                    schedule.schedule_startime = datetime.strptime(data["schedule_startime"], "%H:%M").time()
                elif data["schedule_startime"] is None:
                    schedule.schedule_startime = None
                else:
                    schedule.schedule_startime = data["schedule_startime"]
            
            if "schedule_endtime" in data:
                if isinstance(data["schedule_endtime"], str):
                    schedule.schedule_endtime = datetime.strptime(data["schedule_endtime"], "%H:%M").time()
                elif data["schedule_endtime"] is None:
                    schedule.schedule_endtime = None
                else:
                    schedule.schedule_endtime = data["schedule_endtime"]
            
            # Kiểm tra xung đột lịch
            conflict_check = self.check_schedule_conflicts(
                schedule.room_id, 
                schedule.user_id, 
                schedule.schedule_date, 
                schedule.schedule_startime, 
                schedule.schedule_endtime,
                schedule_id
            )
            
            if not conflict_check["success"]:
                return {"success": False, "error": conflict_check["error"]}
            
            self.db.session.commit()
            return {"success": True, "data": schedule.to_dict()}
            
        except ValueError as e:
            self.db.session.rollback()
            return {"success": False, "error": f"Data format error: {str(e)}"}
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error in update_schedule: {str(e)}")
            return {"success": False, "error": f"Error updating schedule: {str(e)}"}

    def delete_schedule(self, schedule_id: int) -> Dict[str, Any]:
        """Xóa lịch học"""
        try:
            schedule = Schedule.query.get(schedule_id)
            if not schedule:
                return {"success": False, "error": f"Schedule with ID {schedule_id} not found"}
            
            self.db.session.delete(schedule)
            self.db.session.commit()
            
            return {"success": True, "message": "Schedule deleted successfully"}
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error in delete_schedule: {str(e)}")
            return {"success": False, "error": f"Error deleting schedule: {str(e)}"}

    def check_schedule_conflicts(self, room_id: int, user_id: str, 
                               schedule_date: date, start_time: time, 
                               end_time: time, current_schedule_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Kiểm tra xung đột lịch học
        
        Args:
            room_id: ID phòng học
            user_id: ID giáo viên
            schedule_date: Ngày học
            start_time: Giờ bắt đầu
            end_time: Giờ kết thúc
            current_schedule_id: ID của lịch hiện tại (nếu đang cập nhật)
            
        Returns:
            Dict chứa kết quả kiểm tra
        """
        if not start_time or not end_time:
            return {"success": True, "message": "No time specified for conflict check"}
        
        try:
            # Tìm các lịch trùng ngày và có sự giao thoa về thời gian
            conflicts_query = Schedule.query.filter(
                Schedule.schedule_date == schedule_date,
                or_(
                    # Phòng đã có lịch khác vào khung giờ này
                    and_(
                        Schedule.room_id == room_id,
                        # Kiểm tra giao thoa thời gian
                        or_(
                            # Lịch mới bắt đầu trong lịch cũ
                            and_(
                                Schedule.schedule_startime <= start_time,
                                start_time < Schedule.schedule_endtime
                            ),
                            # Lịch mới kết thúc trong lịch cũ
                            and_(
                                Schedule.schedule_startime < end_time,
                                end_time <= Schedule.schedule_endtime
                            ),
                            # Lịch mới bao trọn lịch cũ
                            and_(
                                start_time <= Schedule.schedule_startime,
                                Schedule.schedule_endtime <= end_time
                            )
                        )
                    ),
                    # Hoặc giáo viên đã có lịch khác vào khung giờ này
                    and_(
                        Schedule.user_id == user_id,
                        # Kiểm tra giao thoa thời gian tương tự
                        or_(
                            and_(
                                Schedule.schedule_startime <= start_time,
                                start_time < Schedule.schedule_endtime
                            ),
                            and_(
                                Schedule.schedule_startime < end_time,
                                end_time <= Schedule.schedule_endtime
                            ),
                            and_(
                                start_time <= Schedule.schedule_startime,
                                Schedule.schedule_endtime <= end_time
                            )
                        )
                    )
                )
            )
            
            # Nếu đang cập nhật, loại trừ lịch hiện tại
            if current_schedule_id is not None:
                conflicts_query = conflicts_query.filter(Schedule.schedule_id != current_schedule_id)
            
            conflicts = conflicts_query.all()
            
            if conflicts:
                conflict_details = []
                for conflict in conflicts:
                    if conflict.room_id == room_id:
                        conflict_details.append(f"Room {room_id} is already booked from {conflict.schedule_startime} to {conflict.schedule_endtime}")
                    if conflict.user_id == user_id:
                        conflict_details.append(f"Teacher {user_id} already has a class from {conflict.schedule_startime} to {conflict.schedule_endtime}")
                
                return {
                    "success": False,
                    "error": "Schedule conflicts detected",
                    "conflicts": conflict_details
                }
            
            return {"success": True, "message": "No conflicts found"}
            
        except Exception as e:
            current_app.logger.error(f"Error in check_schedule_conflicts: {str(e)}")
            return {"success": False, "error": f"Error checking schedule conflicts: {str(e)}"}

    def find_available_rooms(self, date_str: str, start_time_str: str, end_time_str: str, 
                          min_capacity: Optional[int] = None) -> Dict[str, Any]:
        """
        Tìm các phòng trống trong khung giờ cụ thể
        
        Args:
            date_str: Ngày (YYYY-MM-DD)
            start_time_str: Giờ bắt đầu (HH:MM)
            end_time_str: Giờ kết thúc (HH:MM)
            min_capacity: Sức chứa tối thiểu
            
        Returns:
            Dict chứa danh sách các phòng có sẵn
        """
        try:
            # Chuyển đổi dữ liệu
            schedule_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            start_time = datetime.strptime(start_time_str, "%H:%M").time()
            end_time = datetime.strptime(end_time_str, "%H:%M").time()
            
            # Tìm các phòng đã được đặt trong khung giờ này
            booked_room_ids = set()
            
            schedules = Schedule.query.filter(
                Schedule.schedule_date == schedule_date,
                # Kiểm tra giao thoa thời gian
                or_(
                    and_(
                        Schedule.schedule_startime <= start_time,
                        start_time < Schedule.schedule_endtime
                    ),
                    and_(
                        Schedule.schedule_startime < end_time,
                        end_time <= Schedule.schedule_endtime
                    ),
                    and_(
                        start_time <= Schedule.schedule_startime,
                        Schedule.schedule_endtime <= end_time
                    )
                )
            ).all()
            
            for schedule in schedules:
                booked_room_ids.add(schedule.room_id)
            
            # Tìm các phòng có sẵn
            query = Room.query.filter(Room.room_status == "AVAILABLE")
            
            if booked_room_ids:
                query = query.filter(~Room.room_id.in_(booked_room_ids))
            
            if min_capacity:
                query = query.filter(Room.room_capacity >= min_capacity)
            
            available_rooms = query.all()
            
            return {
                "success": True,
                "data": [room.to_dict() for room in available_rooms]
            }
            
        except ValueError:
            return {"success": False, "error": "Invalid date or time format"}
        except Exception as e:
            current_app.logger.error(f"Error in find_available_rooms: {str(e)}")
            return {"success": False, "error": f"Error finding available rooms: {str(e)}"}

    def create_recurring_schedule(self, base_data: Dict[str, Any], 
                                recurrence_type: str, 
                                end_date_str: str,
                                weekdays: List[int] = None) -> Dict[str, Any]:
        """
        Tạo lịch học lặp lại (recurring)
        
        Args:
            base_data: Dict chứa thông tin lịch cơ bản
            recurrence_type: Loại lặp lại ('daily', 'weekly')
            end_date_str: Ngày kết thúc lặp (YYYY-MM-DD)
            weekdays: Danh sách các ngày trong tuần (0=Thứ 2, 1=Thứ 3, ..., 6=Chủ Nhật)
                      Chỉ cần khi recurrence_type='weekly'
                      
        Returns:
            Dict chứa kết quả tạo lịch
        """
        try:
            # Validate dữ liệu cơ bản
            missing_fields = []
            for field in ["room_id", "class_id", "user_id", "schedule_date"]:
                if field not in base_data:
                    missing_fields.append(field)
            
            if missing_fields:
                return {"success": False, "error": f"Missing required fields: {', '.join(missing_fields)}"}
            
            # Chuyển đổi ngày tháng
            start_date = None
            if isinstance(base_data["schedule_date"], str):
                start_date = datetime.strptime(base_data["schedule_date"], "%Y-%m-%d").date()
            else:
                start_date = base_data["schedule_date"]
            
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            
            if end_date < start_date:
                return {"success": False, "error": "End date must be after start date"}
            
            # Lấy thời gian bắt đầu và kết thúc
            start_time = None
            if "schedule_startime" in base_data and base_data["schedule_startime"]:
                if isinstance(base_data["schedule_startime"], str):
                    start_time = datetime.strptime(base_data["schedule_startime"], "%H:%M").time()
                else:
                    start_time = base_data["schedule_startime"]
            
            end_time = None
            if "schedule_endtime" in base_data and base_data["schedule_endtime"]:
                if isinstance(base_data["schedule_endtime"], str):
                    end_time = datetime.strptime(base_data["schedule_endtime"], "%H:%M").time()
                else:
                    end_time = base_data["schedule_endtime"]
            
            # Tạo danh sách các ngày cần lập lịch
            dates_to_schedule = []
            current_date = start_date
            
            if recurrence_type == "daily":
                while current_date <= end_date:
                    dates_to_schedule.append(current_date)
                    current_date += timedelta(days=1)
            
            elif recurrence_type == "weekly":
                if not weekdays:
                    return {"success": False, "error": "Weekdays must be provided for weekly recurrence"}
                
                # Chuyển đổi thứ trong Python (0=Monday, 6=Sunday)
                python_weekdays = [(day + 1) % 7 for day in weekdays]
                
                while current_date <= end_date:
                    if current_date.weekday() in python_weekdays:
                        dates_to_schedule.append(current_date)
                    current_date += timedelta(days=1)
            
            else:
                return {"success": False, "error": f"Unsupported recurrence type: {recurrence_type}"}
            
            # Tạo lịch học cho từng ngày
            created_schedules = []
            failed_schedules = []
            
            for schedule_date in dates_to_schedule:
                schedule_data = base_data.copy()
                schedule_data["schedule_date"] = schedule_date
                
                # Kiểm tra xung đột lịch
                conflict_check = self.check_schedule_conflicts(
                    schedule_data["room_id"], 
                    schedule_data["user_id"], 
                    schedule_date, 
                    start_time, 
                    end_time,
                    None
                )
                
                if not conflict_check["success"]:
                    failed_schedules.append({
                        "date": schedule_date.strftime("%Y-%m-%d"),
                        "error": conflict_check["error"]
                    })
                    continue
                
                # Tạo lịch học
                result = self.create_schedule(schedule_data)
                
                if result["success"]:
                    created_schedules.append(result["data"])
                else:
                    failed_schedules.append({
                        "date": schedule_date.strftime("%Y-%m-%d"),
                        "error": result["error"]
                    })
            
            return {
                "success": True,
                "data": {
                    "created_count": len(created_schedules),
                    "failed_count": len(failed_schedules),
                    "created_schedules": created_schedules,
                    "failed_schedules": failed_schedules
                }
            }
            
        except ValueError as e:
            return {"success": False, "error": f"Data format error: {str(e)}"}
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Error in create_recurring_schedule: {str(e)}")
            return {"success": False, "error": f"Error creating recurring schedule: {str(e)}"}

    def get_teacher_availability(self, teacher_id: str, date_str: Optional[str] = None, 
                               start_date_str: Optional[str] = None, 
                               end_date_str: Optional[str] = None) -> Dict[str, Any]:
        """
        Kiểm tra tình trạng sẵn sàng của giáo viên
        
        Args:
            teacher_id: ID của giáo viên
            date_str: Ngày cụ thể (YYYY-MM-DD)
            start_date_str: Ngày bắt đầu khoảng thời gian (YYYY-MM-DD)
            end_date_str: Ngày kết thúc khoảng thời gian (YYYY-MM-DD)
            
        Returns:
            Dict chứa thông tin lịch dạy của giáo viên
        """
        try:
            # Kiểm tra giáo viên tồn tại
            teacher = Teacher.query.get(teacher_id)
            if not teacher:
                return {"success": False, "error": f"Teacher with ID {teacher_id} not found"}
            
            query = Schedule.query.filter(Schedule.user_id == teacher_id)
            
            # Lọc theo ngày
            if date_str:
                specific_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                query = query.filter(Schedule.schedule_date == specific_date)
            elif start_date_str and end_date_str:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
                query = query.filter(Schedule.schedule_date.between(start_date, end_date))
            
            # Sắp xếp kết quả
            query = query.order_by(Schedule.schedule_date, Schedule.schedule_startime)
            
            schedules = query.all()
            
            # Nhóm lịch theo ngày
            schedules_by_date = {}
            for schedule in schedules:
                date_str = schedule.schedule_date.strftime("%Y-%m-%d")
                if date_str not in schedules_by_date:
                    schedules_by_date[date_str] = []
                
                schedules_by_date[date_str].append(schedule.to_dict())
            
            return {
                "success": True,
                "data": {
                    "teacher": {
                        "user_id": teacher.user_id,
                        "user_name": teacher.user_name
                    },
                    "schedules_by_date": schedules_by_date,
                    "total_schedules": len(schedules)
                }
            }
            
        except ValueError:
            return {"success": False, "error": "Invalid date format. Use YYYY-MM-DD"}
        except Exception as e:
            current_app.logger.error(f"Error in get_teacher_availability: {str(e)}")
            return {"success": False, "error": f"Error retrieving teacher availability: {str(e)}"}
            
    def get_class_schedule(self, class_id: int, format_type: str = "list") -> Dict[str, Any]:
        """
        Lấy lịch học của lớp
        
        Args:
            class_id: ID của lớp
            format_type: Định dạng kết quả ('list' hoặc 'calendar')
            
        Returns:
            Dict chứa lịch học của lớp
        """
        try:
            # Kiểm tra lớp học tồn tại
            class_obj = Class.query.get(class_id)
            if not class_obj:
                return {"success": False, "error": f"Class with ID {class_id} not found"}
            
            # Lấy lịch học
            schedules = Schedule.get_schedules_by_class(class_id)
            
            if format_type == "list":
                # Trả về danh sách lịch học
                return {
                    "success": True,
                    "data": {
                        "class": {
                            "class_id": class_obj.class_id,
                            "class_name": class_obj.class_name,
                            "course_id": class_obj.course_id,
                            "course_name": class_obj.course.course_name if class_obj.course else None
                        },
                        "schedules": [schedule.to_dict() for schedule in schedules],
                        "total_sessions": len(schedules)
                    }
                }
            
            elif format_type == "calendar":
                # Nhóm lịch theo ngày cho định dạng lịch
                calendar_data = {}
                for schedule in schedules:
                    date_str = schedule.schedule_date.strftime("%Y-%m-%d")
                    if date_str not in calendar_data:
                        calendar_data[date_str] = []
                    
                    calendar_data[date_str].append({
                        "id": schedule.schedule_id,
                        "title": class_obj.class_name,
                        "start": f"{date_str}T{schedule.schedule_startime}",
                        "end": f"{date_str}T{schedule.schedule_endtime}",
                        "room": schedule.room.room_name if schedule.room else f"Room {schedule.room_id}",
                        "teacher": schedule.teacher.user_name if schedule.teacher else None
                    })
                
                return {
                    "success": True,
                    "data": {
                        "class": {
                            "class_id": class_obj.class_id,
                            "class_name": class_obj.class_name
                        },
                        "calendar": calendar_data,
                        "total_sessions": len(schedules)
                    }
                }
            
            else:
                return {"success": False, "error": f"Unsupported format type: {format_type}"}
                
        except Exception as e:
            current_app.logger.error(f"Error in get_class_schedule: {str(e)}")
            return {"success": False, "error": f"Error retrieving class schedule: {str(e)}"}