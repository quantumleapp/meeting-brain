# 회의록 브레인 — 복습 학습 가이드

> 우리가 로컬 개발부터 **테스트 → Ncloud 실배포 → HTTPS → GitHub 공개 → 발표 자료화**까지 한 여정을, 순서대로 다시 공부하기 위한 자료입니다.
> 구성: **하이브리드(시간순 뼈대 + 개념 학습)** · 형식: 챕터별 페이지.

## 사용법
- 0번부터 순서대로 읽으면 우리가 한 흐름 그대로 복습됩니다.
- 각 챕터는 같은 형식입니다:
  1. **한 줄 요약**
  2. **핵심 개념 (왜)**
  3. **우리가 한 것 (어떻게 · 핵심 코드/명령)**
  4. **막혔던 점 → 해결**
  5. **셀프체크** (스스로 답해보기)
- 막히면 부록(99)의 치트시트·트러블슈팅·용어집을 보세요.

## 목차 (학습 로드맵)
| # | 페이지 | 핵심 학습 |
|---|---|---|
| 00 | [오리엔테이션](00-orientation.md) | 전체 그림 · 스택 · 최종 결과 |
| 01 | [AI 회의록 정리 + 임베딩](01-ai-extract-embedding.md) | CLOVA Studio · 추출 프롬프트 · 청킹 · pgvector |
| 02 | [RAG 검색 & 답변](02-rag-search-answer.md) | 코사인 top-k · 출처 · 근거 기반 답변 |
| 03 | [⚠️ 과거 결정 교차점검](03-crosscheck.md) | 프롬프트 엔지니어링 · 환각 방지 |
| 04 | [음성 입력 STT](04-stt-clova-speech.md) | CLOVA Speech 장문 인식 · multipart |
| 05 | [프론트엔드 & 간트](05-frontend-gantt.md) | 빌드리스 React · 픽셀 레이아웃 · 캐시 |
| 06 | [Docker & 로컬 실행](06-docker-local.md) | compose · 스키마 자동생성 · 시드 |
| 07 | [Ncloud 배포](07-ncloud-deploy.md) | 서버 · SSH(.pem) · ACG · 스모크 |
| 08 | [HTTPS & 도메인](08-https-caddy.md) | Caddy · DNS · Let's Encrypt · 보안 컨텍스트 |
| 09 | [Git & GitHub](09-git-github.md) | .gitignore · 비밀값 스캔 · gh CLI |
| 10 | [발표 자료화](10-presentation.md) | 평가표 기준 정리 · 민감정보 |
| 99 | [부록](99-appendix.md) | 명령어 치트시트 · 트러블슈팅 · 용어집 |

## 한눈에 보는 여정
```
로컬 개발(FastAPI·pgvector·CLOVA)
  → 기능 완성(STT·RAG 교차점검·간트)
  → 테스트(pytest 19) + 스모크(7/7)
  → Ncloud 서버 배포(docker compose)
  → HTTPS(Caddy + 도메인)
  → GitHub 공개
  → 발표 자료화(평가표 기준)
```
