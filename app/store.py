def save_meeting(conn, title, meeting_date, attendees, raw_text, summary) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO meetings (title, meeting_date, attendees, raw_text, summary)
               VALUES (%s, %s, %s, %s, %s) RETURNING id""",
            (title, meeting_date, attendees, raw_text, summary),
        )
        meeting_id = cur.fetchone()[0]
    conn.commit()
    return meeting_id


def list_meetings(conn) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, title, meeting_date, summary FROM meetings ORDER BY id DESC"
        )
        rows = cur.fetchall()
    return [
        {"id": r[0], "title": r[1], "meeting_date": str(r[2]) if r[2] else None, "summary": r[3]}
        for r in rows
    ]


def add_chunk(conn, meeting_id, chunk_text, embedding) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO meeting_chunks (meeting_id, chunk_text, embedding) VALUES (%s, %s, %s::vector)",
            (meeting_id, chunk_text, embedding),
        )
    conn.commit()


def search_chunks(conn, query_embedding, k: int = 5) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """SELECT mc.chunk_text, m.title, m.meeting_date
               FROM meeting_chunks mc JOIN meetings m ON m.id = mc.meeting_id
               ORDER BY mc.embedding <=> %s::vector LIMIT %s""",
            (query_embedding, k),
        )
        rows = cur.fetchall()
    return [
        {"chunk_text": r[0], "title": r[1], "meeting_date": str(r[2]) if r[2] else None}
        for r in rows
    ]


def add_decision(conn, meeting_id, text, constraint_note=None) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO decisions (meeting_id, text, constraint_note) VALUES (%s, %s, %s)",
            (meeting_id, text, constraint_note),
        )
    conn.commit()


def get_decisions(conn) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute("SELECT text, constraint_note FROM decisions ORDER BY id")
        rows = cur.fetchall()
    return [{"text": r[0], "constraint_note": r[1]} for r in rows]


def add_action_item(conn, meeting_id, text, owner=None, start_date=None, due_date=None) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """INSERT INTO action_items (meeting_id, text, owner, start_date, due_date)
               VALUES (%s, %s, %s, %s, %s)""",
            (meeting_id, text, owner, start_date, due_date),
        )
    conn.commit()


def list_actions(conn) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """SELECT ai.id, ai.text, ai.owner, ai.start_date, ai.due_date, ai.status, m.title
               FROM action_items ai JOIN meetings m ON m.id = ai.meeting_id
               ORDER BY ai.owner, ai.due_date"""
        )
        rows = cur.fetchall()
    return [
        {
            "id": r[0], "text": r[1], "owner": r[2],
            "start_date": str(r[3]) if r[3] else None,
            "due_date": str(r[4]) if r[4] else None,
            "status": r[5], "meeting_title": r[6],
        }
        for r in rows
    ]


def update_action_status(conn, action_id: int, status: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE action_items SET status = %s WHERE id = %s", (status, action_id)
        )
        updated = cur.rowcount
    conn.commit()
    return updated > 0


def meetings_by_year(conn) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            """SELECT EXTRACT(YEAR FROM meeting_date)::int AS yr, COUNT(*)
               FROM meetings WHERE meeting_date IS NOT NULL
               GROUP BY yr ORDER BY yr"""
        )
        rows = cur.fetchall()
    return [{"year": r[0], "count": r[1]} for r in rows]
