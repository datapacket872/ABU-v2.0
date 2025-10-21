from flask import Blueprint, request, jsonify
from backend.services.auth_service import AuthService

users_bp = Blueprint("users", __name__)
auth_service = AuthService()

@users_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    result = auth_service.register_user(data)
    return jsonify(result), result.get("status", 400)

@users_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    result = auth_service.login_user(data)
    return jsonify(result), result.get("status", 400)
