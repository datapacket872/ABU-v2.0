# backend/services/auth_service.py
from backend.models.user_model import User, db
from flask_jwt_extended import create_access_token
from datetime import timedelta

class AuthService:
    def register_user(self, data):
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not all([username, email, password]):
            return {"error": "Missing fields", "status": 400}

        if User.query.filter_by(email=email).first():
            return {"error": "User already exists", "status": 400}

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        return {"message": "User registered successfully", "status": 201}

    def login_user(self, data):
        email = data.get("email")
        password = data.get("password")

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return {"error": "Invalid credentials", "status": 401}

        token = create_access_token(identity=user.id, expires_delta=timedelta(hours=2))
        return {"message": "Login successful", "token": token, "status": 200}
