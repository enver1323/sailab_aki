from flask import request
from app.core.exceptions import InternalError
from app.core.generics import Controller, ListController
from app.core.localization import gettext
from app.domain.user.entities.department import Department
from app.domain.user.schemas.department_schema import DepartmentSchema, DepartmentUpdateSchema
from app.domain.user.services.department_service import DepartmentService
from app.core.view_decorators import admin_required

department_schema = DepartmentSchema()
department_update_schema = DepartmentUpdateSchema()


class DepartmentList(ListController):
    @classmethod
    @admin_required()
    def get(cls):
        page, per_page = cls.get_paginator_args()
        search = request.args.get('search', None, type=str)
        departments_query = Department.query
        if search:
            departments_query = departments_query.filter(
                Department.name.ilike(f"%{search}%") |
                Department.external_id.ilike(f"%{search}%")
            )
        users = departments_query.paginate(page=page, per_page=per_page)

        paginator_data = cls.prepare_paginator_response(users, department_schema)
        return cls.response(200, data=paginator_data)

    @classmethod
    @admin_required()
    def post(cls):
        request_json = request.get_json()
        data = department_schema.load(request_json)

        try:
            department = DepartmentService.create(data)
        except InternalError as err:
            return cls.response(500, err.message)

        message = gettext("department.created", name=department.name)
        return cls.response(200, message, department_schema.dump(department))


class DepartmentDetails(Controller):
    @classmethod
    @admin_required()
    def get(cls, department_id: int):
        department = Department.find_by_id(department_id)

        if department is None:
            return cls.response(404)

        return cls.response(data=department_schema.dump(department))

    @classmethod
    @admin_required()
    def put(cls, department_id: int):
        request_json = request.get_json()
        department = Department.find_by_id(department_id)
        data = department_update_schema.load({
            **request_json,
            "department_id": department_id
        })

        try:
            department = DepartmentService.update(department, data)
        except InternalError as err:
            return cls.response(500, err.message)

        message = gettext("department.updated", name=department.name)
        return cls.response(200, message, department_schema.dump(department))

    @classmethod
    @admin_required()
    def delete(cls, department_id: int):
        try:
            DepartmentService.delete(department_id)
        except InternalError as err:
            return cls.response(500, err.message)

        return cls.response(204, gettext("department.deleted"))
