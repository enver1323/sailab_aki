import os
from importlib import import_module
from flask_sqlalchemy import SQLAlchemy

from config import Config

db: SQLAlchemy = SQLAlchemy()


def load_entities():
    domain_dir = os.path.join(Config.BASE_DIR, 'app', 'domain')
    for module in os.listdir(domain_dir):
        entities_dir = os.path.join(domain_dir, module, "entities")
        if not os.path.exists(entities_dir):
            continue

        for entity in os.listdir(entities_dir):
            if entity[-3:] != '.py' or entity == '__init__.py':
                continue
            import_module(f"app.domain.{module}.entities.{entity[:-3]}", '*')
