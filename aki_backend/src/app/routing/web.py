from flask import Blueprint, send_from_directory, current_app, render_template
import os


web_bp = Blueprint("web", __name__, template_folder="../static/dist")


@web_bp.route("/", defaults={"path": ""})
@web_bp.route("/<path>")
def show(path):
    print(os.path.join(current_app.static_folder, path))
    if path != "" and os.path.exists(os.path.join(current_app.static_folder, path)):
        return send_from_directory(current_app.static_folder, path)
    
    return send_from_directory(os.path.join(current_app.static_folder, 'dist'), "index.html")
