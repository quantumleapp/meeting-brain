# PPT_EVIDENCE — Day8 발표 자료 정리 (회의록 브레인)

> 발표 슬라이드에 넣을 **근거 모음**. 코드/실행 결과에서 확인한 사실만 담음(추측 X).
> 라이브 데모: **https://sh.chris-cloud.com** · 코드: **https://github.com/quantumleapp/meeting-brain**
> 각 항목의 `근거:` 는 발표 중 질문 받을 때 바로 열 수 있는 파일.

---

## 1. 프로젝트 한 줄 설명
팀원이 **회의록을 붙여넣으면 AI가 정리·저장**하고, **물어보면 과거 회의를 RAG로 찾아 출처와 함께** 답하며, 추출된 **액션을 담당자별 간트**로 추적하는 웹앱.
> 근거: `CLAUDE.md`, `README.md`

## 2. 대상 사용자와 문제
- **대상:** 회의록을 남기고 검색하는 팀원 (로그인 없음 · 공용 팀 보드)
- **문제:**
  1. 과거 회의의 **결정·맥락이 흩어져** 다시 찾기 어렵다 ("그때 가격 얼마로 정했지?")
  2. 같은 주제를 **다시 논의**하며 과거 결정과 **충돌/중복**이 생긴다
  3. 회의에서 나온 **액션(담당자·기한)이 추적되지 않는다**
- **해결:** 회의록을 "회사의 기억"으로 누적 → 자연어로 물으면 **출처 + 과거 결정 교차점검**으로 답하고, 액션은 **간트로 가시화**
> 근거: `CLAUDE.md` §2

## 3. 실제 동작하는 MVP 주요 기능 흐름
```
[회의록 입력]  제목·날짜·참석자·원문(또는 🎤음성)
      │  POST /meetings  (+ /stt 음성→텍스트)
      ▼
[AI 정리]  요약 · 결정사항 · 액션(담당자·시작/마감일)  ── HyperCLOVA X
      ▼
[임베딩·저장]  500자 청크 → 1024차원 벡터 → pgvector   ── CLOVA 임베딩
      ▼
─────────────── "회사의 기억" 누적 ───────────────
      │
   [질문]  자연어  POST /ask
      ▼
[RAG 검색]  질문 임베딩 → 코사인 top-5 회의 발췌
      ▼
[답변 생성]  본문 + 출처 칩(제목·날짜) + ⚠️과거 결정 교차점검
      
   [액션 보드]  GET /actions · PATCH /actions/{id}
      → 담당자별 간트(월 고정폭·가로 스크롤), 상태 토글(예정→진행→완료)
   [대시보드]  GET /stats/meetings-by-year → 연도별 회의 건수
```
- **구현된 API:** `/health`, `POST·GET /meetings`, `POST /ask`, `POST /stt`, `GET /actions`, `PATCH /actions/{id}`, `GET /stats/meetings-by-year`, SPA 서빙
> 근거: `app/main.py`, `app/ingest.py`, `app/ask.py`, `app/store.py`

## 4. AI 기능의 입력과 출력
| AI 기능 | 입력 | 출력 | 근거 |
|---|---|---|---|
| 회의록 정리 | 회의록 원문(raw_text) | `{summary, decisions[], action_items[{text, owner, start_date, due_date}]}` (JSON) | `app/ingest.py` `EXTRACT_SYSTEM` |
| 텍스트 임베딩 | 500자 청크(겹침 50자) | **1024차원** 벡터 | `app/chunking.py`, `app/clova.py`, `schema.sql vector(1024)` |
| RAG 검색 | 질문 임베딩 | 관련 회의 발췌 **top-5** (코사인 `<=>`) | `app/store.py search_chunks` |
| RAG 답변 | 질문 + 검색 발췌 + 과거 결정 | 답변 본문 + `sources[{title, date}]` | `app/ask.py answer_question` |
| ⚠️ 과거 결정 교차점검 | 검색된 회의 발췌들 | `{conflict, note, a, b}` 또는 없음 — **검색된 회의 제목 화이트리스트로 환각 방지** | `app/ask.py detect_crosscheck` |
| 음성 인식(STT) | 오디오(webm/wav/mp4/ogg…) | `{text}` (CLOVA Speech 장문인식 sync) | `app/main.py /stt` |
- 답변 생성은 **검색된 근거에만 의존**(없으면 모른다고 답) · `temperature=0.1`로 안정적 출력
> 근거: `app/ask.py ANSWER_SYSTEM`, `app/clova.py chat`

## 5. 사용한 Ncloud 서비스와 이유
| 서비스 | 역할 | 선택 이유 |
|---|---|---|
| **CLOVA Studio** | 임베딩(1024) + HyperCLOVA X 답변 생성 | 호출당 과금 → 무거운 모델 자가호스팅 회피, 한국어 품질 |
| **CLOVA Speech** | 장문 음성 인식(STT, `/recognizer/upload` sync) | 한국어 회의 음성 → 텍스트 입력 자동화 |
| **Server** (VPC, Ubuntu 22.04) | `docker compose`로 앱(FastAPI)+DB 단일 인스턴스 호스팅, Caddy로 HTTPS | 실습용 단순/저비용, 인스턴스 1대로 종료/정지 쉬움 |
| DB: **pgvector**(서버 내 docker) | 회의·벡터·결정·액션 저장/검색 | 데모는 상시 과금 회피 위해 **서버 내 docker pgvector** 사용 |
> ⚠️ **발표 정정 포인트:** `README.md` 배포 섹션은 *매니지드 Cloud DB for PostgreSQL* 기준으로 쓰여 있으나, **실제 배포는 서버 내 docker `pgvector/pgvector:pg16`** 으로 함(앱+DB를 compose 한 벌로). Cloud DB는 "대안/로드맵"으로 설명할 것.
> 근거: `docker-compose.yml`, `SERVER_RUNBOOK.md`, `CLAUDE.md` §4

## 6. 데모 화면 목록 (라이브: https://sh.chris-cloud.com)
1. **회의록 입력** — 제목·날짜·참석자·원문 textarea + 🎤 **음성 입력**(HTTPS에서 마이크 동작)
2. **① RAG 검색** — 답변 카드(본문 + 출처 칩 + ⚠️ 과거 결정 교차점검)
3. **② 액션 보드 + 간트** — 담당자(행) × 날짜(열) 타임라인, **월 고정폭·가로 스크롤·[◀이전달/오늘/다음달▶]**, 상태색(예정=회색/진행=파랑/완료=초록), 진행률 막대, 바 클릭으로 상태 토글
4. **③ 누적 대시보드** — 연도별 회의 건수 막대 + "임베딩→Vector DB→RAG" 파이프라인
- 다크 테마 · 포인트 컬러(블루 `#5b8cff`/그린 `#34d399`) · 바닐라 차트(무거운 라이브러리 X)
> 근거: `app/static/app/screen_input.jsx`, `screen_search.jsx`, `screen_board.jsx`, `screen_dashboard.jsx`

## 7. 테스트 결과와 오류 수정 기록
**단위 테스트 — `pytest` 19개 통과**
| 파일 | 개수 | 대상 |
|---|---|---|
| test_store.py | 6 | DB 저장/검색/액션 |
| test_api.py | 3 | 엔드포인트 |
| test_chunking.py | 3 | 청킹 로직 |
| test_ask.py | 2 | RAG 답변/교차점검 |
| test_clova.py | 2 | CLOVA 클라이언트 |
| test_ingest.py | 2 | 회의록 적재 |
| test_config.py | 1 | 설정 |
> 근거: `tests/`, 실행: `PYTHONPATH=. pytest -v`

**통합 스모크 — `smoke.sh` 7/7 🟢 (로컬 + 운영 https://sh.chris-cloud.com 모두)**
`/health` · SPA · `/meetings`(시드 15건) · `/stats` · `/actions` · RAG(답변+출처5+교차점검) · STT 전사
> 근거: `smoke.sh`, 실행: `bash smoke.sh https://sh.chris-cloud.com`

**주요 오류 수정 기록(데모용 하이라이트)**
| 증상 | 원인 | 해결 |
|---|---|---|
| STT 502/401 | 단문 인식 엔드포인트 사용 | **장문 인식**(`/recognizer/upload`, multipart, sync)으로 교체 |
| RAG가 잘못된 가격 답변 | 테스트 더미 데이터 오염 | 오염 회의 삭제 후 **정리·재적재** → "중가 포지셔닝" 정상 |
| ⚠️교차점검 미발화 | 프롬프트가 "완전 모순"만 탐지 | **수정/추가/예외도 탐지** + 회의 화이트리스트로 환각 방지 |
| 간트 바가 찌그러짐 | 화면맞춤 퍼센트 레이아웃 | **월 고정폭 + 가로 스크롤 + 월 이동**, 가용폭 채움 |
| 코드 수정이 화면에 반영 안 됨 | 정적자산 브라우저 캐시 | `/static/*`에 **`Cache-Control: no-cache`** |
| 배포 SSH 실패 | 비번 로그인 막힘 | **.pem 키 인증**으로 접속/전송 |
| 시드 적재 | `seed/`가 이미지에 없음 | `docker compose cp` 후 `exec`로 적재(15건) |

## 8. README / 사용 방법 문서 상태
| 문서 | 상태 | 내용 |
|---|---|---|
| `README.md` | ✅ 있음 | 로컬 실행 5단계, 테스트, 화면, 배포, 스모크, 비용 주의 |
| `CLAUDE.md` | ✅ 있음 | 프로젝트 작업 가이드(설계·역할·금지사항) |
| `SERVER_RUNBOOK.md` | ✅ 있음 | Ncloud 배포 런북(아키텍처·.env·ACG·명령·롤백·비용·HTTPS 부록) |
| `.env.example` | ✅ 있음 | 키 **이름만**(값 없음) — STT 키 포함 |
- ⚠️ `README.md`의 NCP 배포 섹션은 **매니지드 Cloud DB 기준**이라 실제 docker 배포와 차이 → 발표 시 "실제는 서버 내 docker pgvector"로 설명(§5 참고).
> 근거: `README.md`, `SERVER_RUNBOOK.md`, `.env.example`

## 9. 발표에서 빼야 할 민감정보 (화면공유·슬라이드 금지)
**🔴 절대 노출 금지**
- `.env` **값 전체**: `CLOVA_API_KEY`(`nv-…`), `CLOVA_SPEECH_KEY`, `CLOVA_SPEECH_INVOKE_URL`, `CLOVA_EMBED_URL`, `CLOVA_CHAT_URL`
- **서버 공인 IP**, SSH **`.pem` 키 경로·내용**, **root 비밀번호** (관리자 비밀번호 확인 화면 캡처 금지)
- 터미널 시연 시 `.env` 열람 / 비번 입력 / `관리자 비밀번호 확인` 장면 주의

**🟡 주의(굳이 안 보여주기)**
- DB 계정/비번 `postgres/postgres` — 로컬 docker 기본값이고 5432 비공개라 치명적이진 않으나 강조 X
- 도메인 `sh.chris-cloud.com` 은 **강사 제공** — 데모 URL로는 OK, "강사 도메인" 명시 / 실습 후 서버 정지

**🟢 안전(공개 OK)**
- 시드는 **합성 데이터** — 실명·연락처·계좌·실거래 **없음**(스캔으로 확인). 가상 사례("강남 이벤트" 등)만 사용
- GitHub 저장소: `.env`/비밀값 **미포함** 확인됨(원격 트리에 `.env` 없음)
> 근거: `.gitignore`, `.env.example`, `seed/seed.py`, `CLAUDE.md` §9

---

### 발표 시 추천 멘트(요약)
"로컬 개발 → **테스트(19) + 스모크(7/7)** → **Ncloud 서버 실배포 + HTTPS** → **GitHub 공개**까지 한 바퀴 완주. 핵심은 **회의록을 누적해 물어보면 출처·과거 결정 교차점검으로 답하고, 액션을 간트로 추적**하는 것."
