from app import store


def test_schema_tables_exist(db):
    with db.cursor() as cur:
        cur.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
        )
        names = {row[0] for row in cur.fetchall()}
    assert {"meetings", "meeting_chunks", "decisions", "action_items"} <= names


def test_save_meeting_and_list(db):
    mid = store.save_meeting(db, "4월 마케팅", "2026-04-30", "윤소정,김CMO", "원문", "요약")
    rows = store.list_meetings(db)
    assert len(rows) == 1
    assert rows[0]["id"] == mid
    assert rows[0]["title"] == "4월 마케팅"


def test_search_chunks_returns_nearest_first(db):
    mid = store.save_meeting(db, "회의", None, None, "원문", "요약")
    near = [1.0] + [0.0] * 1023
    far = [0.0, 1.0] + [0.0] * 1022
    store.add_chunk(db, mid, "가까운 청크", near)
    store.add_chunk(db, mid, "먼 청크", far)
    results = store.search_chunks(db, near, k=2)
    assert results[0]["chunk_text"] == "가까운 청크"


def test_add_and_get_decisions(db):
    mid = store.save_meeting(db, "회의", None, None, "원문", "요약")
    store.add_decision(db, mid, "케이터링 200만 제한", "2023.10 결정")
    decisions = store.get_decisions(db)
    assert decisions[0]["text"] == "케이터링 200만 제한"


def test_add_list_and_update_action(db):
    mid = store.save_meeting(db, "회의", "2026-04-30", None, "원문", "요약")
    store.add_action_item(db, mid, "강남 장소 컨택", "박매니저", "2026-05-01", "2026-05-03")
    actions = store.list_actions(db)
    assert actions[0]["owner"] == "박매니저"
    assert actions[0]["status"] == "planned"
    assert actions[0]["due_date"] == "2026-05-03"
    ok = store.update_action_status(db, actions[0]["id"], "done")
    assert ok is True
    assert store.list_actions(db)[0]["status"] == "done"


def test_meetings_by_year(db):
    store.save_meeting(db, "2024 회의", "2024-07-15", None, "원문", "요약")
    store.save_meeting(db, "2023 회의", "2023-10-22", None, "원문", "요약")
    store.save_meeting(db, "2024 회의2", "2024-09-01", None, "원문", "요약")
    stats = store.meetings_by_year(db)
    by_year = {s["year"]: s["count"] for s in stats}
    assert by_year[2024] == 2
    assert by_year[2023] == 1
