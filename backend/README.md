# Elementary backend

Requires Python 3.12 or newer. The backend runs independently of the Angular frontend.

From the repository root, create and activate a virtual environment:

```sh
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
```

Install the application and development dependencies:

```sh
python -m pip install -e ".[dev]"
```

Start the development server from `backend/` with the virtual environment active:

```sh
python -m uvicorn app.main:app --reload
```

`GET http://127.0.0.1:8000/api/health` returns `{"status": "ok"}`.

Run the health endpoint test:

```sh
python -m pytest
```
