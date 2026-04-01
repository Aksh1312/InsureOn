#!/usr/bin/env bash
set -euo pipefail

# Ubuntu PostgreSQL setup script
# Usage:
#   ./setup_postgresql_ubuntu.sh [DB_NAME] [DB_USER] [DB_PASSWORD]
# Example:
#   ./setup_postgresql_ubuntu.sh insureon_db insureon_user strong_password

DB_NAME="${1:-insureon_db}"
DB_USER="${2:-insureon_user}"
DB_PASSWORD="${3:-insureon_pass}"
PG_VERSION="16"

if [[ "$EUID" -ne 0 ]]; then
  echo "Please run as root (e.g. sudo ./setup_postgresql_ubuntu.sh ...)"
  exit 1
fi

echo "[1/5] Installing PostgreSQL..."
apt-get update
apt-get install -y postgresql postgresql-contrib

echo "[2/5] Enabling and starting PostgreSQL service..."
systemctl enable postgresql
systemctl start postgresql

echo "[3/5] Creating database user if it does not exist..."
su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'\"" | grep -q 1 || \
  su - postgres -c "psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';\""

echo "[4/5] Creating database if it does not exist..."
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'\"" | grep -q 1 || \
  su - postgres -c "psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\""

echo "[5/5] Granting privileges..."
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""

echo "PostgreSQL setup complete."
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Local connection string: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
