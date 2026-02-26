import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import config

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_name = os.getenv('FLASK_ENV', 'development')
if env_name not in config:
    env_name = 'development'
db_url = "modeler.db" if env_name == "development" else "empty.db"
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, db_url)}"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def get_session():
    return Session()