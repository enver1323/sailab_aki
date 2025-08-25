# SAILAB - Project AKI Backend

> 📘 **Developed By**
> 
> - Jiho Park @urwrstnightmare (jihopark7777@kaist.ac.kr)

## How to Setup Dev Server

1. Clone this repository
2. Install `poetry`
3. Create venv with `python@3.11` (or let poetry handle it)
4. Install deps using `poetry install`
5. Run WSGI (Flask) server with `poetry run start`

You can view OpenAPI Docs @ `[hostname]:[port]/api/v1/doc` powered by swagger

## How to Setup Production (How to Deploy)

TODO


## Used Technologies

- **Flask (Web Server Framework)**
  - flask_restx (For API related stuff)


## Folder Structure

- `src/app` →  Project Base
  - _ _ init _ _.py : App Setup 
- `src/app/blueprints` → API Endpoints Grouped by Functionality


## Coding Conventions

- Currently, None (Adhere to PEP8?)
- Using Gitmoji for Commit Messages is Recommended

## Useful Resources
- https://velog.io/@mstar228/Flask-restx-%EC%82%AC%EC%9A%A9%EB%B2%95
- https://stackabuse.com/using-sqlalchemy-with-flask-and-postgresql/
- https://github.com/fromzeroedu/flask-postgres-boilerplate
