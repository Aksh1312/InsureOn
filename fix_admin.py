"""
Admin Seed Script
------------------
Creates or updates the admin user for the InsureOn operations dashboard.

Usage:
    python fix_admin.py

Sets up admin@insureon.dev with password: admin123
"""
import sqlite3
from backend.db import SessionLocal
from backend.models import User
from backend.auth import hash_password

conn = sqlite3.connect('insureon.db')
conn.execute("DELETE FROM users WHERE email='admin@insureon.dev'")
conn.commit()
conn.close()

db = SessionLocal()
u = User(
    full_name='System Admin', 
    email='admin@insureon.dev', 
    hashed_password=hash_password('admin123'), 
    platform='system', 
    region='mumbai', 
    income=5000, 
    upi_id='admin@ybl',
    is_admin=True,
)
db.add(u)
db.commit()
db.close()
print("Admin user created: admin@insureon.dev / admin123")
