from app import store
from app.ingest import _parse_json

ANSWER_SYSTEM = (
    "당신은 회사의 회의 기록을 기억하는 도우미입니다. "
    "제공된 '관련 회의록'과 '과거 결정'에만 근거해 한국어로 답하세요. "
    "근거가 없으면 모른다고 답하세요. "
    "답변 끝에 참고한 회의(제목·날짜)를 출처로 표시하세요."
)

CROSSCHECK_SYSTEM = (
    "여러 회의록 발췌가 주어집니다. 같은 주제(가격·예산·일정·수량·정책 등)에 대해 "
    "나중 회의에서 결정이 바뀌었거나, 새 조건·예외·할인·한도가 추가/조정되어 "
    "'과거 결정과 함께 다시 확인할 필요가 있는' 경우를 찾으세요. "
    "완전한 모순뿐 아니라 '기조는 유지하되 일부 조정/추가'된 경우도 포함합니다. "
    "단, 반드시 같은 주제여야 하고 단순 표현 차이는 제외합니다. JSON으로만 답합니다. "
    '해당되면 {"conflict": true, '
    '"note": "무엇이 어떻게 달라졌는지 1~2문장(두 회의 제목과 날짜 포함)", '
    '"a": {"title": "이전 회의 제목", "date": "YYYY-MM-DD"}, '
    '"b": {"title": "나중 회의 제목", "date": "YYYY-MM-DD"}}. '
    '해당 없으면 {"conflict": false} 만 답하세요. '
    "반드시 제공된 회의록 중에서만 고르고, 없는 회의를 지어내지 마세요."
)


def detect_crosscheck(clova, chunks: list[dict]) -> dict | None:
    """검색된 회의들 사이에서 상충·수정된 결정을 감지해 교차점검 콜아웃 정보를 만든다.

    실패하거나 상충이 없으면 None(검색은 절대 깨지지 않게 graceful).
    """
    pairs = {(c["title"], c["meeting_date"]) for c in chunks}
    if len(pairs) < 2:
        return None
    lines = [f"- ({c['title']} / {c['meeting_date']}) {c['chunk_text']}" for c in chunks]
    try:
        content = clova.chat(CROSSCHECK_SYSTEM, "\n".join(lines))
        data = _parse_json(content)
    except Exception:
        return None
    if not isinstance(data, dict) or not data.get("conflict"):
        return None
    a, b = data.get("a"), data.get("b")
    if not isinstance(a, dict) or not isinstance(b, dict):
        return None
    valid = {c["title"] for c in chunks}
    if a.get("title") not in valid or b.get("title") not in valid:
        return None  # 환각 방지: 제공된 회의 밖이면 버림
    # 날짜 기준 a=이전, b=나중 보장 (칩 표시 순서 일관성)
    da, db = a.get("date") or "", b.get("date") or ""
    if da and db and da > db:
        a, b = b, a
    return {"note": data.get("note", ""), "a": a, "b": b}


def build_context(chunks: list[dict], decisions: list[dict]) -> str:
    lines = ["[관련 회의록]"]
    for c in chunks:
        lines.append(f"- ({c['title']} / {c['meeting_date']}) {c['chunk_text']}")
    lines.append("\n[과거 결정]")
    for d in decisions:
        note = f" ({d['constraint_note']})" if d.get("constraint_note") else ""
        lines.append(f"- {d['text']}{note}")
    return "\n".join(lines)


def answer_question(conn, clova, question: str, k: int = 5) -> dict:
    question_embedding = clova.embed(question)
    chunks = store.search_chunks(conn, question_embedding, k)
    if not chunks:
        return {"answer": "관련 회의록을 찾지 못했습니다.", "sources": [], "crossCheck": None}

    decisions = store.get_decisions(conn)
    context = build_context(chunks, decisions)
    answer = clova.chat(ANSWER_SYSTEM, f"질문: {question}\n\n{context}")
    sources = [{"title": c["title"], "date": c["meeting_date"]} for c in chunks]
    crosscheck = detect_crosscheck(clova, chunks)
    return {"answer": answer, "sources": sources, "crossCheck": crosscheck}
