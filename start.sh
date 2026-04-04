#!/bin/sh
set -e

export INSUREON_BACKEND_URL="${INSUREON_BACKEND_URL:-http://127.0.0.1:8000}"

uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
backend_pid=$!
uvicorn InsureOnSim.main:app --host 0.0.0.0 --port 8001 &
sim_pid=$!

wait "$backend_pid"
wait "$sim_pid"
