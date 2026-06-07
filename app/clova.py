from typing import Protocol

import httpx

from app.config import settings


class ClovaClient(Protocol):
    def embed(self, text: str) -> list[float]: ...
    def chat(self, system: str, user: str) -> str: ...


class ClovaStudioClient:
    """CLOVA Studio REST 클라이언트.

    주의: 실제 엔드포인트/헤더/응답 필드는 CLOVA Studio 콘솔/문서로 확인 후 조정.
    """

    def __init__(self, api_key=None, embed_url=None, chat_url=None):
        self.api_key = api_key or settings.clova_api_key
        self.embed_url = embed_url or settings.clova_embed_url
        self.chat_url = chat_url or settings.clova_chat_url

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _require_configured(self) -> None:
        if not self.api_key or not self.embed_url or not self.chat_url:
            raise ValueError("no-claude")

    def embed(self, text: str) -> list[float]:
        self._require_configured()
        resp = httpx.post(
            self.embed_url, headers=self._headers(), json={"text": text}, timeout=30
        )
        resp.raise_for_status()
        return resp.json()["result"]["embedding"]

    def chat(self, system: str, user: str, max_tokens: int = 1024) -> str:
        self._require_configured()
        payload = {
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "maxTokens": max_tokens,
            "temperature": 0.1,
            "topP": 0.8,
        }
        resp = httpx.post(
            self.chat_url, headers=self._headers(), json=payload, timeout=60
        )
        resp.raise_for_status()
        return resp.json()["result"]["message"]["content"]
