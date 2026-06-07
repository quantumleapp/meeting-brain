import pytest

from app.config import settings
from app.db import get_connection


@pytest.fixture
def db():
    conn = get_connection(settings.database_url_test)
    with conn.cursor() as cur:
        cur.execute(
            "TRUNCATE action_items, decisions, meeting_chunks, meetings RESTART IDENTITY CASCADE"
        )
    conn.commit()
    yield conn
    conn.close()


class FakeClovaClient:
    """결정적 임베딩/응답을 주는 테스트용 가짜 CLOVA 클라이언트."""

    def __init__(self, dim: int = 1024):
        self.dim = dim
        self.chat_calls = []

    def embed(self, text: str) -> list[float]:
        vec = [0.0] * self.dim
        vec[hash(text) % self.dim] = 1.0
        return vec

    def chat(self, system: str, user: str) -> str:
        self.chat_calls.append((system, user))
        # ingest의 구조화 추출 프롬프트면 JSON, 아니면 일반 답변을 반환
        if "JSON" in system:
            return '{"summary": "요약", "decisions": ["결정1"], "action_items": [{"text": "할일1", "owner": "박매니저", "start_date": "2026-05-01", "due_date": "2026-05-03"}]}'
        return "테스트 답변입니다."


@pytest.fixture
def fake_clova():
    return FakeClovaClient()
