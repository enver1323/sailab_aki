import os
import json
from datetime import datetime

from werkzeug.utils import secure_filename
from config import Config


class MediaService:
    @classmethod
    def store_media(cls, path, value):
        now = datetime.now()
        filename = secure_filename(now.strftime("%Y%M%D_%H_%M_%S_") + value.filename)
        target_dir = os.path.join(Config.APP_DIR, Config.UPLOAD_PATH, path)

        if not os.path.isdir(target_dir):
            os.makedirs(target_dir, mode=0o775)

        filename = cls._generate_filename(target_dir, filename)

        value.save(os.path.join(Config.APP_DIR, Config.UPLOAD_PATH, path, filename))
        return os.path.join(path, filename)

    @classmethod
    def _generate_filename(cls, target_dir, filename):
        *filename, ext = filename.split(".")
        filename = original_filename = ".".join(filename)

        i = 1
        while os.path.exists(os.path.join(target_dir, f"{filename}.{ext}")):
            filename = f"{original_filename}_{i}"
            i += 1

        return f"{filename}.{ext}"

    @classmethod
    def get_media(cls, filename):
        if filename is None:
            return None
        return os.path.join(Config.UPLOAD_PATH, filename)

    @classmethod
    def set_media(cls, path, value):
        if value is None or isinstance(value, str):
            return value

        return cls.store_media(path, value)


class JSONMediaService(MediaService):
    @classmethod
    def store_media(cls, path, value):
        now = datetime.now()
        filename = secure_filename(now.strftime("%Y%M%D_%H_%M_%S") + ".json")
        target_dir = os.path.join(Config.APP_DIR, Config.UPLOAD_PATH, path)

        if not os.path.isdir(target_dir):
            os.makedirs(target_dir, mode=0o775)

        filename = cls._generate_filename(target_dir, filename)

        if not isinstance(value, str):
            value = json.dumps(value, separators=(",", ":"))

        filepath = os.path.join(Config.APP_DIR, Config.UPLOAD_PATH, path, filename)
        with open(filepath, "w") as file:
            file.write(value)

        return os.path.join(path, filename)
    
    @classmethod
    def get_media_contents(cls, filename):
        filepath = cls.get_media(filename)
        if filepath is None:
            return None
        filepath = os.path.join(Config.APP_DIR, filepath)
        if not os.path.exists(filepath):
            return None
        with open(filepath, "r") as file:
            return json.load(file)

    @classmethod
    def remove_media(cls, path: str):
        path = os.path.join(Config.APP_DIR, Config.UPLOAD_PATH, path)
        if not os.path.exists(path):
            return

        os.remove(path)
