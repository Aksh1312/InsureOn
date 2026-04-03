from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('sql_user')}:{os.getenv('sql_password')}@{os.getenv('sql_host')}/{os.getenv('sql_db')}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()