import sqlite3
db = sqlite3.connect(r'C:\Users\aksha_mfctx7k\OneDrive\Desktop\InsureOn_S\InsureOn\InsureOn\insureon.db')
c = db.cursor()
c.execute("SELECT id, email, is_admin, region FROM users WHERE is_admin=1 OR email LIKE '%admin%'")
for row in c.fetchall():
    print(f"id={row[0]}, email={row[1]}, is_admin={row[2]}, region={row[3]}")
c.execute("SELECT COUNT(*) FROM users")
print(f"Total users: {c.fetchone()[0]}")
c.execute("SELECT id, email FROM users ORDER BY id")
for row in c.fetchall():
    print(f"  {row[0]}: {row[1]}")
db.close()
