import json

from app import store
from app.chunking import chunk_text

EXTRACT_SYSTEM = (
    "당신은 회의록 정리 도우미입니다. 입력된 회의록을 분석해 JSON으로만 답하세요. "
    '형식: {"summary": str, "decisions": [str], '
    '"action_items": [{"text": str, "owner": str|null, '
    '"start_date": "YYYY-MM-DD"|null, "due_date": "YYYY-MM-DD"|null}]}. '
    "날짜를 알 수 없으면 null."
)


def _parse_json(content: str) -> dict:
    text = content.strip()
    # strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.rsplit("```", 1)[0]
    return json.loads(text.strip())


def extract_structure(clova, raw_text: str) -> dict:
    content = clova.chat(EXTRACT_SYSTEM, raw_text)
    return _parse_json(content)


def ingest_meeting(conn, clova, title, meeting_date, attendees, raw_text) -> int:
    structure = extract_structure(clova, raw_text)
    summary = structure.get("summary", "")
    meeting_id = store.save_meeting(conn, title, meeting_date, attendees, raw_text, summary)

    for chunk in chunk_text(raw_text):
        embedding = clova.embed(chunk)
        store.add_chunk(conn, meeting_id, chunk, embedding)

    for decision in structure.get("decisions", []):
        store.add_decision(conn, meeting_id, decision)

    for item in structure.get("action_items", []):
        store.add_action_item(
            conn, meeting_id, item.get("text"), item.get("owner"),
            item.get("start_date"), item.get("due_date"),
        )

    return meeting_id
