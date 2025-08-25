import json
import os.path

from typing import Dict

from config import Config

locale = "en"
cached_strings: Dict[str, str] = dict()


def set_translations():
    global cached_strings
    messages_path = os.path.join(Config.MESSAGES_DIR, f"{locale}.json")
    with open(messages_path) as f:
        cached_strings = json.load(f)


def gettext(string_pattern, *args, **kwargs):
    if string_pattern in cached_strings:
        return cached_strings[string_pattern].format(*args, **kwargs)

    return string_pattern
