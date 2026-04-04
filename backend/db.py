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
		conn.execute(
			text("ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id VARCHAR")
		)