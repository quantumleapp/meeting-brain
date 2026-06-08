# 06. Docker & 로컬 실행

## 한 줄 요약
앱(FastAPI)과 DB(pgvector)를 **docker compose 한 벌**로 띄우고, 스키마는 앱이 **자동 생성**, 데모 데이터는 시드 스크립트로 채운다.

## 핵심 개념 (왜)
- **이미지 vs 컨테이너:** 이미지=실행 환경 스냅샷(Dockerfile로 빌드), 컨테이너=이미지를 띄운 인스턴스.
- **docker compose:** 여러 컨테이너(app·db)를 한 파일로 정의·기동. 같은 네트워크에 묶여 **서비스 이름으로 통신**(app→`db:5432`).
- **볼륨:** 컨테이너가 죽어도 데이터 유지(예: `pgdata`).
- **멱등 스키마:** `CREATE ... IF NOT EXISTS` 라 여러 번 실행해도 안전 → 앱이 연결 때마다 적용해도 OK.

## 우리가 한 것 (어떻게)
**docker-compose.yml** — `db`(pgvector/pgvector:pg16) + `app`(build .), app은 `DATABASE_URL=...@db:5432...`
**Dockerfile** — `python:3.12-slim` + requirements + `COPY app` + `uvicorn ... --host 0.0.0.0`
**스키마 자동 생성** (`app/db.py`):
```python
def get_connection(dsn=None):
    conn = psycopg.connect(dsn or settings.database_url)
    _ensure_schema(conn)        # 연결할 때마다 schema.sql 실행(멱등)
    register_vector(conn)
    return conn
```
**로컬 실행**
```bash
cp .env.example .env            # 키 채우기
docker compose up -d db
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --reload
PYTHONPATH=. pytest -v          # 테스트(DB 필요)
PYTHONPATH=. python seed/seed.py
```

## 막혔던 점 → 해결
- **시드를 컨테이너에서 실행** → `Dockerfile`이 `seed/`를 이미지에 안 넣음. 해결(서버에서): `docker compose cp ./seed app:/code/seed` 후 `docker compose exec -e PYTHONPATH=/code app python seed/seed.py`.
- **모듈 못 찾음** → `PYTHONPATH` 미설정. 해결: `PYTHONPATH=.`(로컬) / `=/code`(컨테이너).

## 셀프체크
1. app 컨테이너는 DB를 `localhost`가 아니라 왜 `db`로 부르나?
2. 스키마를 마이그레이션 도구 없이 적용할 수 있었던 이유는?
3. compose에서 `5432:5432`를 공개하면 운영에서 왜 위험한가? (→ 07장)
