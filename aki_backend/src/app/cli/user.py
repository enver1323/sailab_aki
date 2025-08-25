import click
from flask import Blueprint
from app import db
from app.domain.user.entities.user import UserRoles
from app.domain.user.services.user_service import UserService
from app.domain.user.schemas.user_schema import UserSchema
from app.core.localization import gettext

user = Blueprint('user', __name__)


@user.cli.command('create')
@click.argument('username')
@click.argument('name')
@click.argument('password')
@click.argument('role')
def create(username, name, password, role=UserRoles.user):
    print("Creating user ...")
    data = {
        "username": username,
        "name": name,
        "password": password,
        "role": role
    }

    schema = UserSchema()
    loaded = schema.load(data)

    user = UserService.create(loaded)
    print(gettext('user.created', username=user.username))
