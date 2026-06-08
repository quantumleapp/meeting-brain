# 99. 부록 — 치트시트 · 트러블슈팅 · 용어집

## A. 명령어 치트시트
**로컬 실행/테스트**
```bash
cp .env.example .env
docker compose up -d db
PYTHONPATH=. uvicorn app.main:app --reload      # http://localhost:8000
PYTHONPATH=. pytest -v                           # 테스트(DB 필요)
PYTHONPATH=. python seed/seed.py                 # 시드
bash smoke.sh                                    # 기능 스모크(로컬)
```
**배포(서버)**
```bash
ssh -i ~/Downloads/키.pem root@<IP>
systemctl start docker && systemctl enable docker
cd ~/meeting-brain && docker compose up -d --build && docker compose ps
docker compose cp ./seed app:/code/seed
docker compose exec -e PYTHONPATH=/code app python seed/seed.py
docker compose logs -f app                       # 로그
```
**HTTPS(Caddy)**
```bash
docker run -d --name caddy --restart unless-stopped --network host \
  -v caddy_data:/data caddy:2 \
  caddy reverse-proxy --from <도메인> --to localhost:8000
docker logs caddy
```
**Git/GitHub**
```bash
git add -A && git commit -m "메시지" && git push
gh repo create <이름> --public --source=. --remote=origin --push
```

## B. 트러블슈팅 모음 (증상 → 원인 → 해결)
| 증상 | 원인 | 해결 |
|---|---|---|
| STT 502/401 | 단문 엔드포인트 | 장문 `/recognizer/upload`(multipart, sync) |
| `.env` 바꿔도 미반영 | `--reload`가 .env 미감지 | `.py` touch / 재시작 |
| RAG 잘못된 답 | 더미 데이터 오염 | 정리·재적재 |
| 교차점검 미발화 | "완전 모순"만 탐지 프롬프트 | 수정·추가도 탐지 + 화이트리스트 |
| 간트 찌그러짐 | 퍼센트 레이아웃 | 픽셀 + 가로 스크롤 |
| 수정이 화면에 안 뜸 | 브라우저 캐시 | `Cache-Control: no-cache` + 하드 리프레시 |
| SSH 비번 거부 | 키 전용 서버 | `ssh -i .pem` |
| Docker daemon 연결 실패 | 데몬 꺼짐 | `systemctl start docker` |
| 긴 명령 붙여넣기 깨짐 | 줄바꿈 삽입 | 백슬래시 짧은 줄 |
| IP로 HTTPS 안 됨 | LE는 도메인만 발급 | 도메인 + Caddy |
| `?recursive=1` zsh 오류 | `?` glob | URL 따옴표 |

## C. 용어집
- **RAG**: 검색(Retrieval)으로 근거를 찾아 LLM이 답(Generation)하게 하는 방식.
- **임베딩(embedding)**: 텍스트를 의미를 담은 숫자 벡터로 변환.
- **pgvector**: PostgreSQL에 벡터 타입·유사도 검색을 더하는 확장.
- **코사인 거리(`<=>`)**: 벡터 방향 차이. 작을수록 유사.
- **청킹(chunking)**: 긴 텍스트를 작은 조각으로 나눔(겹침 포함).
- **환각(hallucination)**: LLM이 근거 없이 그럴듯한 거짓을 생성.
- **STT**: Speech-to-Text, 음성→텍스트.
- **docker compose**: 여러 컨테이너를 한 파일로 정의·기동.
- **볼륨(volume)**: 컨테이너와 분리된 영속 데이터 저장소.
- **공인/사설 IP**: 외부 접속용 / 내부망용 주소.
- **ACG**: Ncloud 방화벽(인바운드/아웃바운드 규칙). 최소 개방.
- **리버스 프록시**: 앞단에서 요청을 받아 뒤 서버로 전달(TLS 종료 등).
- **Let's Encrypt / ACME**: 무료 TLS 인증서 자동 발급 체계.
- **보안 컨텍스트**: HTTPS/localhost에서만 허용되는 브라우저 기능(예: 마이크).
- **멱등(idempotent)**: 여러 번 실행해도 결과가 같음(`IF NOT EXISTS`).
- **스모크 테스트**: 핵심 기능만 빠르게 확인하는 점검.

## D. 다음 학습거리 (이 프로젝트 범위 밖)
- 인증/권한(OAuth), 실시간 STT 스트리밍, 매니지드 DB 전환, CI/CD(푸시→자동 배포), 리랭킹·평가셋으로 RAG 품질 측정.
