from sqlalchemy import insert
from sqlalchemy.orm import Session
from app.domain.user.entities.user import User
from app.domain.user.entities.department import Department, users_departments_table


def template(username: str, password: str, external_id: str = None, role: str = None):
    return {
        "username": username,
        "name": username.capitalize(),
        "password": password,
        "external_id": external_id,
        "role": role,
    }


def seed(session: Session):
    data = [
        User(**template("admin", "cderfv34", role="admin")).__dict__,
        User(**template("enver", "cderfv34", role="admin")).__dict__,
    ]
    departments = Department.query.all()

    session.execute(insert(User), data)
    users = User.query.filter(User.username.in_([item['username'] for item in data])).all()
    users_departments = [
        {"user_id": user.id, "department_id": department.id}
        for user in users
        for department in departments
    ]

    session.execute(insert(users_departments_table), users_departments)
