# InsureOn Setup

This guide covers local development and Docker deployment for the InsureOn backend + frontend.

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL (optional, required for persistent data)

## Local Development

### 1) Backend

Create a virtual environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create an environment file (example):

```bash
cp .env.example .env
```

If you do not have an example file, set the minimum values in your shell:

```bash
export SIM_TEST_API_KEY="dev-sim-key"
export INSUREON_SIM_URL="http://127.0.0.1:8001"
```

Start the API:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will use `VITE_API_BASE_URL` if it exists; otherwise it uses the current origin.

### 3) Simulation (optional)

```bash
cd InsureOnSim
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export INSUREON_BACKEND_URL="http://127.0.0.1:8000"
export SIM_TEST_API_KEY="dev-sim-key"
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

Then run the simulation script in the repo root:

```bash
python run_simulation.py
```

## Docker

Build and run the container:

```bash
docker build -t insureon .
docker run -p 8000:7860 \
  -e SIM_TEST_API_KEY="dev-sim-key" \
  -e INSUREON_SIM_URL="http://host.docker.internal:8001" \
  insureon
```

The API and SPA will be available at `http://localhost:8000`.

Notes:
- If you also run InsureOnSim, update `INSUREON_SIM_URL` to match where it is running.
- For production, configure a real database and tighten CORS.
- The image includes a bundled `insureon.db` sqlite file; remove it and configure PostgreSQL for persistent storage.

Optional: keep port 8000 inside the container by setting `PORT`:

```bash
docker run -p 8000:8000 \
  -e PORT=8000 \
  -e SIM_TEST_API_KEY="dev-sim-key" \
  -e INSUREON_SIM_URL="http://host.docker.internal:8001" \
  insureon
```
