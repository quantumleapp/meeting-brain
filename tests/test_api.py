import os

import pytest
from fastapi.testclient import TestClient

from app.config import settings


@pytest.fixture
def client(db, fake_clova):
    # 앱이 테스트 DB와 가짜 CLOVA를 쓰도록 환경/오버라이드 설정
    os.environ["DATABASE_URL"] = settings.database_url_test
    from app.main import app, get_clova

    app.dependency_overrides[get_clova] = lambda: fake_clova
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_create_meeting_then_ask(client):
    create = client.post(
        "/meetings",
        json={
            "title": "강남 브랜드데이",
            "meeting_date": "2023-10-22",
            "attendees": "김CMO",
            "raw_text": "강남 브랜드데이 1800만 집행. 케이터링 부풀려 손실.",
        },
    )
    assert create.status_code == 200
    assert "id" in create.json()

    ask = client.post("/ask", json={"question": "강남 이벤트 비용?"})
    assert ask.status_code == 200
    body = ask.json()
    assert "answer" in body
    assert len(body["sources"]) >= 1


def test_actions_and_stats(client):
    client.post(
        "/meetings",
        json={
            "title": "4월 마케팅",
            "meeting_date": "2026-04-30",
            "raw_text": "강남 장소 컨택 필요. 박매니저가 5/3까지.",
        },
    )
    actions = client.get("/actions").json()
    assert len(actions) >= 1
    assert actions[0]["owner"] == "박매니저"

    aid = actions[0]["id"]
    patched = client.patch(f"/actions/{aid}", json={"status": "done"})
    assert patched.status_code == 200
    assert client.get("/actions").json()[0]["status"] == "done"

    stats = client.get("/stats/meetings-by-year").json()
    assert any(s["year"] == 2026 for s in stats)
