from flask import Blueprint, request
from app.services.room_serivce import RoomService
from app.utils.response_helper import (
    success_response,
    error_response,
    validation_error_response,
    not_found_response,
)

from app.utils.validators import Validator
from app.config import db
from sqlalchemy import literal_column
from sqlalchemy.exc import OperationalError


room_bp = Blueprint("rooms", __name__, url_prefix="/api/rooms")
room_service = RoomService()

@room_bp.route("/all", methods=["GET"])
def get_rooms():
    result = room_service.get_all_rooms()
    return success_response(result) 