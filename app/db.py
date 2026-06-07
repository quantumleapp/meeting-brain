import os
from pathlib import Path

import psycopg
from pgvector.psycopg import register_vector

from app.config import settings

SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def get_connection(dsn: str | None = None):
    dsn = dsn or os.environ.get("DATABASE_URL", settings.database_url)
    conn = psycopg.connect(dsn)
    _ensure_schema(conn)
    register_vector(conn)
    return conn


def _ensure_schema(conn) -> None:
    sql = SCHEMA_PATH.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
