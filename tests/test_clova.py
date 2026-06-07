import httpx

from app.clova import ClovaStudioClient


def test_embed_parses_embedding(monkeypatch):
    def fake_post(url, headers=None, json=None, timeout=None):
        return httpx.Response(
            200,
            json={"result": {"embedding": [0.1, 0.2, 0.3]}},
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr(httpx, "post", fake_post)
    client = ClovaStudioClient(api_key="k", embed_url="http://x/embed", chat_url="http://x/chat")
    assert client.embed("안녕") == [0.1, 0.2, 0.3]


def test_chat_parses_content(monkeypatch):
    def fake_post(url, headers=None, json=None, timeout=None):
        return httpx.Response(
            200,
            json={"result": {"message": {"content": "답변"}}},
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr(httpx, "post", fake_post)
    client = ClovaStudioClient(api_key="k", embed_url="http://x/embed", chat_url="http://x/chat")
    assert client.chat("시스템", "유저") == "답변"
