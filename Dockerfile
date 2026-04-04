FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY InsureOnSim/requirements.txt ./InsureOnSim/requirements.txt
RUN pip install --no-cache-dir -r InsureOnSim/requirements.txt

COPY backend/ ./backend
COPY InsureOnSim/ ./InsureOnSim
COPY --from=frontend-build /app/backend/static ./backend/static
COPY insureon.db .

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 8000 8001
CMD ["./start.sh"]
