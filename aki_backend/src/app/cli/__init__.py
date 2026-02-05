from flask.cli import FlaskGroup
from app import app, db
from app.core.migrate import migrate
from app.cli.schema import schema
from app.cli.user import user
from app.cli.patient import patient
from app.cli.evaluation import eval

migrate.init_app(app, db, directory=app.config['DB_MIGRATION_DIR'])
cli = FlaskGroup(app)

app.register_blueprint(schema)
app.register_blueprint(user)
app.register_blueprint(patient)
app.register_blueprint(eval)
