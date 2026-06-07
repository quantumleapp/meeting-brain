import json

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app import ask as ask_unit
from app import ingest, store
from app.clova import ClovaStudioClient
from app.config import settings
from app.db import get_connection

app = FastAPI(title="Meeting Brain")
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.middleware("http")
async def no_cache_static(request: Request, call_next):
    """정적 자산(.jsx/.css 등)은 항상 ETag 재검증하게 한다.

    Cache-Control이 없으면 브라우저가 휴리스틱 캐시로 옛 파일을 재사용해
    수정이 화면에 안 보이는 문제가 생긴다. no-cache = 저장하되 매번 재검증
    (안 바뀌면 304로 저렴, 바뀌면 새로 받음).
    """
    response = await call_next(request)
    if request.url.path.startswith("/static/"):
        response.headers["Cache-Control"] = "no-cache"
    return response


def get_clova():
    return ClovaStudioClient()


class MeetingIn(BaseModel):
    title: str
    meeting_date: str | None = None
    attendees: str | None = None
    raw_text: str


class AskIn(BaseModel):
    question: str


class StatusIn(BaseModel):
    status: str  # planned / progress / done


@app.get("/health")
def health():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        return {"status": "ok"}
    finally:
        conn.close()


@app.post("/meetings")
def create_meeting(body: MeetingIn, clova=Depends(get_clova)):
    conn = get_connection()
    try:
        structure = ingest.extract_structure(clova, body.raw_text)
        meeting_id = ingest.ingest_meeting(
            conn, clova, body.title, body.meeting_date, body.attendees, body.raw_text
        )
        return {
            "id": meeting_id,
            "summary": structure.get("summary", ""),
            "decisions": structure.get("decisions", []),
            "actions": structure.get("action_items", []),
        }
    except ValueError as e:
        if str(e) == "no-claude":
            raise HTTPException(status_code=401, detail="CLOVA API key not configured")
        raise
    finally:
        conn.close()


@app.get("/meetings")
def get_meetings():
    conn = get_connection()
    try:
        return store.list_meetings(conn)
    finally:
        conn.close()


@app.post("/ask")
def ask_route(body: AskIn, clova=Depends(get_clova)):
    conn = get_connection()
    try:
        result = ask_unit.answer_question(conn, clova, body.question)
        return {**result, "_source": "ai"}
    except ValueError as e:
        if str(e) == "no-claude":
            raise HTTPException(status_code=401, detail="CLOVA API key not configured")
        raise
    finally:
        conn.close()


# 브라우저 녹음 MIME → CLOVA가 인식할 파일 확장자
_AUDIO_EXT = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",
}


@app.post("/stt")
async def stt(request: Request):
    """CLOVA Speech 장문 인식(Long Sentence) — 동기(sync) 업로드.

    도메인별 Invoke URL + Secret Key 필요. 음성을 받아 multipart/form-data로
    `/recognizer/upload` 에 전달하고, 완료된 전사 텍스트(text)를 반환한다.
    """
    secret = settings.clova_speech_key
    invoke_url = settings.clova_speech_invoke_url.rstrip("/")
    if not secret or not invoke_url:
        raise HTTPException(
            status_code=401,
            detail="CLOVA Speech 미설정 (.env 의 CLOVA_SPEECH_KEY / CLOVA_SPEECH_INVOKE_URL 확인)",
        )

    audio_bytes = await request.body()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="빈 음성 데이터")

    content_type = request.headers.get("content-type", "audio/webm").split(";")[0].strip()
    ext = _AUDIO_EXT.get(content_type, "webm")
    params = {
        "language": "ko-KR",
        "completion": "sync",
        "wordAlignment": False,
        "fullText": True,
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{invoke_url}/recognizer/upload",
                headers={"X-CLOVASPEECH-API-KEY": secret},
                data={"params": json.dumps(params)},
                files={"media": (f"audio.{ext}", audio_bytes, content_type)},
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="STT 타임아웃")

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"STT error {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    return {"text": data.get("text", "")}


@app.get("/actions")
def get_actions():
    conn = get_connection()
    try:
        return store.list_actions(conn)
    finally:
        conn.close()


@app.patch("/actions/{action_id}")
def patch_action(action_id: int, body: StatusIn):
    conn = get_connection()
    try:
        ok = store.update_action_status(conn, action_id, body.status)
        if not ok:
            raise HTTPException(status_code=404, detail="action not found")
        return {"id": action_id, "status": body.status}
    finally:
        conn.close()


@app.get("/stats/meetings-by-year")
def stats_meetings_by_year():
    conn = get_connection()
    try:
        return store.meetings_by_year(conn)
    finally:
        conn.close()


@app.get("/")
def index():
    return FileResponse("app/static/index.html")


@app.get("/{full_path:path}")
def catch_all(full_path: str):
    return FileResponse("app/static/index.html")
