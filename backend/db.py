from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = "sqlite:///./insureon.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def apply_legacy_schema_patches() -> None:
	"""Apply lightweight compatibility patches for older local databases."""
	with engine.begin() as conn:
		# SQLite compatibility: older SQLite versions don't support
		# "ADD COLUMN IF NOT EXISTS", so we check schema first.
		columns = conn.execute(text("PRAGMA table_info(users)"))
		has_full_name = any(row[1] == "full_name" for row in columns)
		if not has_full_name:
			conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))

		columns = conn.execute(text("PRAGMA table_info(users)"))
		has_upi_id = any(row[1] == "upi_id" for row in columns)
		if not has_upi_id:
			conn.execute(text("ALTER TABLE users ADD COLUMN upi_id VARCHAR"))