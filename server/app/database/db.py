import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import config

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_name = os.getenv('FLASK_ENV', 'development')
if env_name not in config:
    env_name = 'development'
if env_name == "development":
    db_url = os.path.join(BASE_DIR, "modeler.db")
else:
    volume_path = os.path.join(os.path.dirname(os.path.dirname(BASE_DIR)), "database", "modeler.db")
    if os.path.exists(os.path.dirname(volume_path)):
        db_url = volume_path
    else:
        db_url = os.path.join(BASE_DIR, "empty.db")
DATABASE_URL = f"sqlite:///{db_url}"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def get_session():
    return Session()

def ensure_column(table, column, ddl):
    """Add `column` to `table` if it's missing, for existing SQLite DBs that
    predate a model change. `Base.metadata.create_all` only creates missing
    tables, it never alters existing ones, so new columns on existing tables
    need to be added by hand. `ddl` is the column definition SQLite expects
    after 'ADD COLUMN', e.g. "gamified BOOLEAN NOT NULL DEFAULT 1"."""
    with engine.begin() as conn:
        existing = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
        if column not in existing:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {ddl}"))