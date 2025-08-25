from typing import Sequence, List

from sqlalchemy import insert

from app.domain.user.entities.department import Department
from app import db


class DepartmentService:
    @classmethod
    def find_or_new_by_external(cls, external_id: str):
        department = Department.find_by_external_id(external_id)
        if department is None:
            department = cls.new_from_external(external_id)

        return department

    @classmethod
    def new_from_external(cls, external_id: str):
        return Department(external_id, external_id)

    @classmethod
    def create(cls, data: dict) -> Department:
        department = Department(**data)
        department.save()

        return department

    @classmethod
    def update(cls, department: Department, data: dict) -> Department:
        department.fill(data)
        department.save()

        return department

    @classmethod
    def delete(cls, department: Department) -> bool:
        department.delete()

    @classmethod
    def find_or_create_many_by_external(cls, ids: Sequence[str]) -> List[Department]:
        existing_deps: List[Department] = Department.query.filter(
            Department.external_id.in_(ids)
        ).all()

        existing_ids = set([dep.external_id for dep in existing_deps])
        deps_to_create = [
            {"name": idx, "external_id": idx} for idx in ids if idx not in existing_ids
        ]
        if len(deps_to_create) > 0:
            cls.create_many(deps_to_create)

        return Department.query.filter(Department.external_id.in_(ids)).all()

    @classmethod
    def create_many(cls, data: Sequence[dict]):
        db.session.execute(insert(Department), data)
