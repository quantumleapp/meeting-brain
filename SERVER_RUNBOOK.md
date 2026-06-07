# SERVER_RUNBOOK — 회의록 브레인 Ncloud 배포

> 목적: 단일 **Ncloud Server(VM) 1대**에 `docker compose` 로 앱+DB를 올려 데모.
> 이 문서엔 **실제 서버 주소·계정·키·비밀번호·API 키를 적지 않는다.** 비밀값은 서버의 `.env` 에만.
> 파괴적 명령(`rm -rf`, 볼륨 삭제, DB DROP)은 **사용자 확인 없이 실행 금지.**

---

## 0. 아키텍처 (현 상태 그대로 사용)
- `docker-compose.yml` 에 **`db`(pgvector/pgvector:pg16) + `app`(FastAPI)** 둘 다 포함 → **매니지드 Cloud DB 불필요.**
- 스키마는 `app/db.py` 의 `_ensure_schema()` 가 **연결 시 자동 생성**(전부 `IF NOT EXISTS`, 멱등) → 수동 psql 불필요.
- 앱 컨테이너 CMD = `uvicorn --host 0.0.0.0 --port 8000` (운영용, `--reload` 없음).
- AI는 **CLOVA Studio(임베딩·답변) + CLOVA Speech(STT)** 호출 → 서버에서 인터넷 아웃바운드 필요.

```
[브라우저] ──HTTP :8000──> [Ncloud Server]
                              └ docker compose ─ app(FastAPI) ──(내부망)── db(pgvector)
                                      │
                                      └──HTTPS──> CLOVA Studio / CLOVA Speech (외부 API)
```

## 1. 사전 결정 (배포 전 확인)
| 항목 | 권장(데모) | 비고 |
|---|---|---|
| DB | **서버 내 docker postgres** | compose에 이미 있음. (대안: Cloud DB for PostgreSQL = pgvector 지원/과금 **확인 필요**) |
| 공개 방식 | **`http://<IP>:8000`** | 빠름. (대안: 도메인+HTTPS → 부록 A) |
| 인스턴스 사양 | 2vCPU/4GB~ | 빌드+postgres 동시 |
| OS | Ubuntu 22.04 LTS | 아래 명령 기준 |

## 2. 환경변수 (`.env` — 서버에만, 커밋 금지)
`.env.example` 복사 후 값 채움. 필요한 키:
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/meeting_brain   # compose가 동일값으로 덮어씀(앱은 db 서비스로 접속)
CLOVA_API_KEY=...          # CLOVA Studio
CLOVA_EMBED_URL=...
CLOVA_CHAT_URL=...
EMBEDDING_DIM=1024
CLOVA_SPEECH_KEY=...       # STT
CLOVA_SPEECH_INVOKE_URL=...# 끝의 /recognizer/upload 제외
```
- `DATABASE_URL_TEST` 는 테스트 전용이라 운영 `.env` 엔 불필요.
- `.env` 는 `.gitignore` 에 있음(확인됨). **절대 커밋/문서화 금지.**

## 3. 보안 (ACG = 최소 개방)
- **인바운드 8000(TCP)만 개방.** SSH(22)는 본인 IP로만 제한 권장.
- **5432(Postgres)는 절대 개방 금지.** 앱은 docker 내부망으로만 DB에 접속.
  - 방어 강화(선택): compose의 `"5432:5432"` → `"127.0.0.1:5432:5432"` 로 바꿔 호스트 외부에 안 뜨게.
- Cloud DB 옵션을 쓸 때만: DB는 **서버 사설 IP에서만** 허용.

## 4. 배포 절차 (서버에서)
> 각 명령이 무슨 일을 하는지 먼저 이해하고 실행. 로컬 `!명령` 으로 SSH 로그인 가능.

```bash
# 4-1. Docker + compose 플러그인 설치 (Ubuntu)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER     # 재로그인 후 sudo 없이 docker 사용

# 4-2. 코드 가져오기 (git repo면 clone, 아니면 scp/rsync로 프로젝트 업로드)
#   예: rsync -av --exclude .venv --exclude .git ./meeting-brain <USER>@<SERVER_IP>:~/meeting-brain
cd ~/meeting-brain

# 4-3. .env 작성 (2장 참고) — 비밀값 입력
cp .env.example .env && nano .env

# 4-4. 빌드 + 기동 (db + app)
docker compose up -d --build
docker compose ps                 # app, db 가 Up 인지 확인
docker compose logs -f app        # 起動 로그 확인 (Ctrl+C로 빠져나옴)

# 4-5. (선택) 시드 적재 — seed/는 이미지에 없으므로 마운트해서 1회 실행 (CLOVA 키 필요)
docker compose run --rm -v "$PWD/seed:/code/seed" app python seed/seed.py
```

## 5. 스모크 테스트 (로컬 Mac에서 서버 대상)
```bash
bash smoke.sh http://<SERVER_IP>:8000
```
기대: `통과 7 / 실패 0 🟢 ALL GREEN` (health·SPA·meetings·stats·actions·RAG+출처+교차점검·STT).
- 브라우저로 `http://<SERVER_IP>:8000` 접속 → ① 검색 ② 보드/간트 ③ 대시보드 ④ 음성입력 데모 확인.

## 6. 롤백 / 운영
```bash
docker compose restart app          # 앱만 재시작
docker compose down                 # 중지(볼륨 보존 → 데이터 유지)
docker compose up -d --build        # 재배포
docker compose logs --tail=200 app  # 오류 조사
```
- **데이터 초기화가 필요할 때만**(주의): `docker compose down -v` 는 **DB 볼륨 삭제** → 사용자 확인 후에만.

## 7. 비용 규칙 (CLAUDE.md §4)
- **실습 기간만** 인스턴스 가동, 끝나면 **정지/삭제.**
- CLOVA 호출 수·입력 길이 모니터링. (임베딩·답변·STT 호출당 과금)

## 8. 배포 전 최종 체크리스트
- [ ] 로컬 `bash smoke.sh` 7/7 그린 (배포본과 동일 코드)
- [ ] `.env` 서버에만 존재, git 미추적 확인
- [ ] 소스/문서/시드에 실제 비밀값·개인정보 없음 (합성 데이터만)
- [ ] ACG: 8000만 인바운드, 5432 차단, 22는 본인 IP
- [ ] 발표 데모 흐름(검색→보드→대시보드→음성) 서버에서 1회 리허설

---

### 부록 A. 도메인 + HTTPS (선택, Caddy 리버스 프록시)
간단히 TLS를 붙이려면 Caddy를 앞단에 두고 8000으로 프록시:
```
# Caddyfile
your-domain.example { reverse_proxy localhost:8000 }
```
이 경우 ACG는 80/443만 열고 8000은 닫는다(Caddy만 8000 접근). 도메인 A레코드 → 서버 IP 필요.

### 부록 B. 매니지드 Cloud DB for PostgreSQL (대안)
- **확인 필요:** Ncloud Cloud DB for PostgreSQL의 **pgvector 확장 지원 여부**(미지원이면 이 경로 불가 → 서버 docker postgres 유지).
- 사용 시: compose에서 `db` 서비스 제거, `.env` 의 `DATABASE_URL` 을 Cloud DB 엔드포인트로. DB는 서버 사설 IP만 허용. 상시 과금 주의.
