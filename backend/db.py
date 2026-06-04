from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = "sqlite:///./insureon.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

@event.listens_for(engine, "connect")
def _enable_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def apply_legacy_schema_patches() -> None:
	"""Apply lightweight compatibility patches for older local databases."""
	with engine.begin() as conn:
		columns = conn.execute(text("PRAGMA table_info(users)"))
		has_full_name = any(row[1] == "full_name" for row in columns)
		if not has_full_name:
			conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))

		columns = conn.execute(text("PRAGMA table_info(users)"))
		has_upi_id = any(row[1] == "upi_id" for row in columns)
		if not has_upi_id:
			conn.execute(text("ALTER TABLE users ADD COLUMN upi_id VARCHAR"))

		columns = conn.execute(text("PRAGMA table_info(users)"))
		has_is_admin = any(row[1] == "is_admin" for row in columns)
		if not has_is_admin:
			conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))

		# Normalize legacy lowercase platform values to uppercase enum member names
		conn.execute(text("UPDATE users SET platform = 'SYSTEM' WHERE platform = 'system'"))
		conn.execute(text("UPDATE users SET platform = 'SWIGGY' WHERE platform = 'swiggy'"))
		conn.execute(text("UPDATE users SET platform = 'ZOMATO' WHERE platform = 'zomato'"))
		conn.execute(text("UPDATE users SET platform = 'DUNZO' WHERE platform = 'dunzo'"))
		conn.execute(text("UPDATE users SET platform = 'BLINKIT' WHERE platform = 'blinkit'"))
		conn.execute(text("UPDATE users SET platform = 'OTHER' WHERE platform = 'other'"))

		# SmartWork Report columns
		columns = conn.execute(text("PRAGMA table_info(smartwork_tips)"))
		existing = {row[1] for row in columns}
		if "recommended_slots" not in existing:
			conn.execute(text("ALTER TABLE smartwork_tips ADD COLUMN recommended_slots TEXT"))
		if "risk_outlook" not in existing:
			conn.execute(text("ALTER TABLE smartwork_tips ADD COLUMN risk_outlook TEXT"))
		if "premium_projection" not in existing:
			conn.execute(text("ALTER TABLE smartwork_tips ADD COLUMN premium_projection TEXT"))
		if "city_insights" not in existing:
			conn.execute(text("ALTER TABLE smartwork_tips ADD COLUMN city_insights TEXT"))
		if "confidence_score" not in existing:
			conn.execute(text("ALTER TABLE smartwork_tips ADD COLUMN confidence_score FLOAT"))