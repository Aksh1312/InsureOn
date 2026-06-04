import sqlite3
from passlib.context import CryptContext
pwd = CryptContext(schemes=["argon2"])
hashed = pwd.hash("admin123")
db = sqlite3.connect(r"C:\Users\aksha_mfctx7k\OneDrive\Desktop\InsureOn_S\InsureOn\InsureOn\insureon.db")
c = db.execute("UPDATE users SET hashed_password = ? WHERE email = 'admin@insureon.dev'", (hashed,))
db.commit()
print(f"Updated admin password hash. Rows affected: {c.rowcount}")
db.close()
