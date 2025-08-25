import os
import shutil
from flask import Blueprint
import flask_migrate as migrate


from app import db
from app.database.seeders import seed_department, seed_user
from config import Config


schema = Blueprint("schema", __name__)


@schema.cli.command("create")
def create():
    print("Dropping tables ...")
    db.reflect()
    db.drop_all()
    print("Creating tables ...")
    db.create_all()
    db.session.commit()
    print("Database created!")


@schema.cli.command("drop")
def drop():
    print("Dropping tables ...")
    db.reflect()
    db.drop_all()


@schema.cli.command("create:fresh")
def create_fresh():
    print("Removing existing migrations ...")
    migration_dir = Config.DB_MIGRATION_DIR
    if os.path.isdir(migration_dir):
        shutil.rmtree(migration_dir)

    print("Initializing migrations ...")
    migrate.init()

    print("Making the first migration ...")
    migrate.migrate()

    print("Dropping tables ...")
    db.reflect()
    db.drop_all()
    print("Creating tables ...")
    db.create_all()
    db.session.commit()
    print("Database created!")


@schema.cli.command("seed")
def seed():
    seed_department(db.session)
    seed_user(db.session)
    db.session.commit()
