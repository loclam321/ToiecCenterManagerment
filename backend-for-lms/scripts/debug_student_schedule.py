import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app
from app.services.schedule_service import ScheduleService

app = create_app()

with app.app_context():
    service = ScheduleService()
    result = service.get_schedules_for_student('S00000001', '2025-10-05', '2025-10-11')
    print(result)
