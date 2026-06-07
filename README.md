# 회의록 브레인 (Meeting Brain)

쌓아둔 회의록에게 물어보면, 과거의 결정과 맥락까지 찾아 답해주는 RAG 서비스.
백엔드는 FastAPI + pgvector, 프론트엔드는 React(UMD + Babel standalone) 정적 자산을 `/static`으로 서빙한다.

## 로컬 실행
1. `cp .env.example .env` 후 CLOVA 키/URL 입력 (커밋 금지)
2. `docker compose up -d db` (Postgres+pgvector)
3. `pip install -r requirements.txt`
4. `PYTHONPATH=. uvicorn app.main:app --reload`
5. http://localhost:8000 (React UI · `/static/index.html`)

## 테스트
- `docker compose up -d db` 후 테스트 DB 생성: `docker compose exec db psql -U postgres -c "CREATE DATABASE meeting_brain_test;"`
- `PYTHONPATH=. pytest -v`

## 화면
- ① 회의록 입력 → AI 추출(요약·결정·액션)
- ② RAG 검색 → 출처 칩 + 과거 결정 교차점검
- ③ 액션 보드(담당자별 간트, 상태: 예정/진행/완료)
- ④ 누적 대시보드(연도별 회의록 건수)

상태 enum은 `planned`(예정) / `progress`(진행) / `done`(완료)로 통일.

## NCP 배포 (단일 서버 + 매니지드 Cloud DB)
1. **Cloud DB for PostgreSQL**(P16 인스턴스)에서 pgvector 활성: `CREATE EXTENSION IF NOT EXISTS vector;`
2. **Server 인스턴스**(소형) 생성 → SSH 접속 → Docker/Compose 설치
3. 코드 업로드(git clone 또는 scp) 후 `.env` 작성:
   - `DATABASE_URL=postgresql://<user>:<pw>@<cloud-db-host>:5432/<db>`
   - `CLOVA_API_KEY`, `CLOVA_EMBED_URL`, `CLOVA_CHAT_URL`
4. **ACG(방화벽)**: 서버 인바운드 8000(또는 80) 개방 / Cloud DB는 서버 사설IP만 허용
5. 앱만 컨테이너로 기동: `docker compose up -d app`
6. 시드: `docker compose exec app python -m seed.seed` (또는 로컬에서 원격 DB 대상으로 실행)
7. **스모크 테스트**(아래)
8. 실습 종료 시 Server 인스턴스 정지/삭제로 과금 종료

## 스모크 테스트
```bash
curl http://<공인IP>:8000/health
curl -X POST http://<공인IP>:8000/ask -H "Content-Type: application/json" \
  -d '{"question":"강남 이벤트 비용 어떻게 잡았어?"}'
```
Expected:
- `/health` → `{"status":"ok"}` (앱→Cloud DB 연결 정상)
- `/ask` → 시드된 강남 사례를 근거로 한 답변 + sources에 회의 제목/날짜 포함

## 비용 주의
- Cloud DB는 상시 과금 → 실습 기간만 가동
- CLOVA Studio는 호출당 과금 → 입력 길이/호출 수 모니터링
