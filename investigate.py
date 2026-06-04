import sqlite3, os

path = r'C:\Users\aksha_mfctx7k\OneDrive\Desktop\InsureOn_S\InsureOn\InsureOn\insureon.db'
print(f'Exists: {os.path.exists(path)}, Size: {os.path.getsize(path)}')
db = sqlite3.connect(path)
c = db.cursor()

# Claim 62 details
c.execute('SELECT * FROM claims WHERE id = 62')
print('=== CLAIM 62 ===')
cols = [d[0] for d in c.description]
data = c.fetchone()
if data:
    for i, col in enumerate(cols):
        print(f'  {col}: {data[i]}')
else:
    print('  No claim 62 found in this DB')

# Total smartwork duplicates
c.execute('SELECT COUNT(*) FROM smartwork_tips')
print(f'\n=== SmartWork total rows: {c.fetchone()[0]} ===')

c.execute('''
    SELECT COUNT(*) - COUNT(DISTINCT user_id || "|" || week_start_date) 
    FROM smartwork_tips
''')
print(f'  Duplicates to remove: {c.fetchone()[0]}')

# Top worst duplicates
c.execute('''
    SELECT user_id, week_start_date, COUNT(*) as cnt
    FROM smartwork_tips
    GROUP BY user_id, week_start_date
    HAVING cnt > 1
    ORDER BY cnt DESC
    LIMIT 5
''')
print('\n=== Worst duplicated users ===')
for row in c.fetchall():
    print(f'  user {row[0]}, week {row[1]}: {row[2]} copies')

# Claims with orphan trigger_event_id  
c.execute('''
    SELECT c.id, c.status, c.trigger_event_id
    FROM claims c
    LEFT JOIN imd_trigger_events ie ON ie.id = c.trigger_event_id
    WHERE ie.id IS NULL
    LIMIT 20
''')
print('\n=== Claims with orphan trigger_event_id ===')
for row in c.fetchall():
    print(f'  claim {row[0]}, status={row[1]}, missing trigger={row[2]}')

# Invalid claim statuses
c.execute("SELECT DISTINCT status FROM claims")
print('\n=== All claim statuses ===')
for row in c.fetchall():
    print(f'  {row[0]}')

db.close()
