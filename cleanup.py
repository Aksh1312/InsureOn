"""
Phase 2 data cleanup: smartwork_tips dedup, claim #62 fix, orphan trigger_event_ids.
"""
import sqlite3, os

DB = r'C:\Users\aksha_mfctx7k\OneDrive\Desktop\InsureOn_S\InsureOn\InsureOn\insureon.db'

def log(msg):
    print(f"[CLEANUP] {msg}")

def main():
    db = sqlite3.connect(DB)
    c = db.cursor()
    c.execute("PRAGMA foreign_keys = OFF")  # allow safe manipulation

    # ── 1. SmartWork tip dedup ──────────────────────────────────
    log("Deduplicating smartwork_tips...")
    c.execute('''
        DELETE FROM smartwork_tips
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM smartwork_tips
            GROUP BY user_id, week_start_date
        )
    ''')
    deleted_tips = c.rowcount

    c.execute('SELECT COUNT(*) FROM smartwork_tips')
    remaining_tips = c.fetchone()[0]
    log(f"Deleted {deleted_tips} duplicate smartwork_tips. Remaining: {remaining_tips}")

    # ── 2. Fix claim #62 invalid status ─────────────────────────
    log("Fixing claim #62 invalid status MANUAL_REVIEW...")
    c.execute("SELECT status FROM claims WHERE id = 62")
    row = c.fetchone()
    if row:
        log(f"  Current status: {row[0]}")
        c.execute("UPDATE claims SET status = 'MONITORING' WHERE id = 62 AND status = 'MANUAL_REVIEW'")
        if c.rowcount:
            log(f"  Updated claim 62 to MONITORING")
        else:
            log(f"  Claim 62 already fixed or not found")
    else:
        log("  Claim 62 not found")

    # ── 3. Fix orphan trigger_event_ids ─────────────────────────
    log("Checking orphan trigger_event_ids...")
    c.execute('''
        SELECT DISTINCT c.trigger_event_id
        FROM claims c
        LEFT JOIN imd_trigger_events ie ON ie.id = c.trigger_event_id
        WHERE ie.id IS NULL
    ''')
    orphan_ids = [r[0] for r in c.fetchall()]
    log(f"Missing trigger event IDs: {orphan_ids}")

    for tid in orphan_ids:
        c.execute("SELECT id FROM imd_trigger_events WHERE id = ?", (tid,))
        if not c.fetchone():
            c.execute('''
                INSERT INTO imd_trigger_events (id, district, alert_color, zone_triggered, triggered_at, is_deduplicated)
                VALUES (?, 'manual-filing', 'ORANGE', 'A', datetime('now', '-30 days'), 1)
            ''', (tid,))
            log(f"  Created dummy trigger event for missing ID {tid}")

    after = c.execute('''
        SELECT COUNT(*) FROM claims c
        LEFT JOIN imd_trigger_events ie ON ie.id = c.trigger_event_id
        WHERE ie.id IS NULL
    ''').fetchone()[0]
    log(f"Remaining orphan claims: {after}")

    # ── 4. Dedup duplicate notifications ────────────────────────
    log("Deduplicating notifications (keeping oldest per user+title)...")
    c.execute('''
        DELETE FROM notifications
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM notifications
            GROUP BY user_id, title, type
        )
    ''')
    deleted_notifs = c.rowcount
    c.execute('SELECT COUNT(*) FROM notifications')
    remaining_notifs = c.fetchone()[0]
    log(f"Deleted {deleted_notifs} duplicate notifications. Remaining: {remaining_notifs}")

    # ── 5. Dedup duplicate risk_scores for user_id=8 ────────────
    log("Deduplicating risk_scores for user_id=8...")
    c.execute('''
        DELETE FROM risk_scores
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM risk_scores
            GROUP BY user_id, week_start_date
        )
        AND user_id = 8
    ''')
    deleted_risk = c.rowcount
    log(f"Deleted {deleted_risk} duplicate risk_score rows for user_id=8")

    db.commit()
    c.execute("PRAGMA foreign_keys = ON")  # re-enable
    db.close()
    log("Cleanup complete!")

if __name__ == "__main__":
    main()
