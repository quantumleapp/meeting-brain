# 01. AI 회의록 정리 + 임베딩

## 한 줄 요약
회의록 원문을 **HyperCLOVA X로 구조화(JSON)** 하고, 원문을 **청크로 쪼개 임베딩(1024차원 벡터)** 해서 pgvector에 저장한다.

## 핵심 개념 (왜)
- **구조화 추출:** LLM에게 "JSON으로만 답하라"고 시켜 `요약·결정·액션`을 기계가 쓸 수 있는 형태로 받는다.
- **임베딩:** 텍스트를 의미를 담은 **숫자 벡터**로 바꾸는 것. 비슷한 의미 → 가까운 벡터. RAG 검색의 기반.
- **청킹:** 긴 원문을 통째로 임베딩하면 의미가 뭉개진다 → 500자 단위로 쪼개고(겹침 50자) 각각 임베딩.
- **차원(1024):** 임베딩 모델이 내놓는 벡터 길이. DB 컬럼 `vector(1024)`와 **반드시 일치**해야 한다.

## 우리가 한 것 (어떻게)
**추출 프롬프트** (`app/ingest.py`)
```python
EXTRACT_SYSTEM = '...JSON으로만 답하세요. 형식: {"summary": str, "decisions": [str], '
                 '"action_items": [{"text", "owner", "start_date", "due_date"}]}...'
```
**코드펜스 제거 파서** — LLM이 ```json 으로 감싸는 경우 대비:
```python
def _parse_json(content):
    if text.startswith("```"): ... # 펜스 벗겨내고 json.loads
```
**청킹** (`app/chunking.py`) — `chunk_text(text, max_chars=500, overlap=50)`
**적재 흐름** (`ingest_meeting`): 원문 → 추출 → `save_meeting` → 청크마다 `clova.embed()` → `store.add_chunk(... ::vector)` → 결정·액션 저장
**스키마** (`app/schema.sql`): `embedding vector(1024)` / `CREATE EXTENSION vector` (연결 시 자동 적용 → 06장)

## 막혔던 점 → 해결
- **LLM이 JSON 앞뒤에 설명/코드펜스를 붙임** → `_parse_json`에서 ```` ``` ```` 제거 후 파싱.
- **임베딩 차원 불일치** → `.env`의 `EMBEDDING_DIM=1024` 와 `schema.sql vector(1024)` 를 맞춤.

## 셀프체크
1. 원문을 통째로 임베딩하지 않고 청크로 쪼개는 이유는?
2. `overlap`(겹침)을 두는 이유는?
3. 임베딩 차원이 1024인데 DB가 1536이면 무슨 일이 생기나?
