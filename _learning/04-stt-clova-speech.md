# 04. 음성 입력 STT (CLOVA Speech)

## 한 줄 요약
브라우저에서 녹음한 오디오를 **CLOVA Speech 장문 인식(Long Sentence)** 에 multipart로 올려 전사 텍스트를 받아온다.

## 핵심 개념 (왜)
- **단문 vs 장문 인식:** 단문은 짧은 명령용, **장문(`/recognizer/upload`)** 은 회의처럼 긴 음성용. 우리는 장문 + `completion: sync`(요청 즉시 완료 텍스트 반환).
- **multipart/form-data:** 파일(오디오) + 파라미터(JSON)를 함께 보내는 HTTP 방식. 헤더 `X-CLOVASPEECH-API-KEY`.
- **Invoke URL:** CLOVA Speech는 **도메인별 고유 URL**이 있고 콘솔에서 확인. 도메인 이름으로 추측 불가 → **`.env`에만** 둔다(절대 커밋 금지).
- **오디오 포맷:** 브라우저 MediaRecorder는 보통 `webm/opus`. (문서엔 mp3/wav 등만 적혀 있어도) 실제로 webm을 받아줬다 → **변환 불필요**.

## 우리가 한 것 (어떻게) — `app/main.py`
```python
@app.post("/stt")
async def stt(request):
    secret = settings.clova_speech_key
    invoke_url = settings.clova_speech_invoke_url.rstrip("/")
    if not secret or not invoke_url: raise HTTPException(401, "CLOVA Speech 미설정")
    audio = await request.body()
    params = {"language":"ko-KR","completion":"sync","wordAlignment":False,"fullText":True}
    resp = await client.post(f"{invoke_url}/recognizer/upload",
        headers={"X-CLOVASPEECH-API-KEY": secret},
        data={"params": json.dumps(params)},
        files={"media": (f"audio.{ext}", audio, content_type)})
    return {"text": resp.json().get("text", "")}
```
- 프론트(`screen_input.jsx`)는 녹음 후 실제 `mimeType`으로 `/stt`에 POST, 실패 시 빨간 오류 메시지.

## 막혔던 점 → 해결
- **STT 502/401** → 처음에 **단문 엔드포인트**를 썼음. 해결: 장문 `/recognizer/upload` (multipart, sync)로 교체.
- **`.env` 바꿔도 "미설정"** → `uvicorn --reload`는 `.env` 변경을 **감지 못 함**. 해결: `.py` 파일 `touch`로 리로드 트리거(또는 재시작).
- **webm 되나?** → PyAV로 webm 생성해 `/stt`로 보내 확인 → CLOVA가 정상 전사. 변환 로직 불필요로 결론.

## 셀프체크
1. 왜 Invoke URL을 코드/문서에 안 쓰고 `.env`에만 두나?
2. `uvicorn --reload`가 안 잡는 변경은? 어떻게 강제 리로드했나?
3. multipart에서 `media`와 `params`는 각각 무엇?
