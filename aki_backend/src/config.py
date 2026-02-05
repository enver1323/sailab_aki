import os


class DBConfig:
    SQLITE_CONNECTION = "sqlite"

    @staticmethod
    def get_db_uri() -> str:
        connection = os.getenv("DB_CONNECTION", "sqlite")
        print()
        host = os.getenv("DB_HOST")
        port = os.getenv("DB_PORT")
        database = os.getenv("DB_DATABASE", "/../aki")
        user = os.getenv("DB_USERNAME", None)
        password = os.getenv("DB_PASSWORD", None)

        if connection == DBConfig.SQLITE_CONNECTION:
            return f"{connection}://{database}.db"

        return f"{connection}://{user}:{password}@{host}:{port}/{database}"


class Config:
    SECRET_KEY = "aki_dev_secret_key"

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    APP_DIR = os.path.join(BASE_DIR, 'app')
    DB_MIGRATION_DIR = os.path.join(APP_DIR, "database/migrations")

    INFERENCE_DATA_DIR = os.path.join(APP_DIR, "inference/data")
    INFERENCE_BATCH_SIZE = 512

    SQLALCHEMY_DATABASE_URI = DBConfig.get_db_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECORD_QUERIES = True
    # SQLALCHEMY_ECHO = True

    THREADS_PER_PAGE = 2

    PROPAGATE_EXCEPTIONS = True
    JWT_BLACKLIST_ENABLED = True  # enable blacklist feature
    JWT_BLACKLIST_TOKEN_CHECKS = ("access", "refresh")
    
    MESSAGES_DIR = os.path.join(APP_DIR, 'static/messages')
    UPLOAD_PATH = "static/uploads"
    EVALUATIONS_UPLOAD_PATH = os.path.join(UPLOAD_PATH, 'evaluations')
    