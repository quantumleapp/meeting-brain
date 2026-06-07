#!/usr/bin/env bash
# 회의록 브레인 기능 스모크 테스트
# 사용: bash smoke.sh [BASE_URL]   (기본 http://localhost:8000)
# 배포 후엔: bash smoke.sh http://<서버주소>:8000
set -u
B="${1:-http://localhost:8000}"
PY="${PYTHON:-.venv/bin/python}"; command -v "$PY" >/dev/null 2>&1 || PY=python3
ok=0; ng=0
pass(){ echo "✅ $1"; ok=$((ok+1)); }
fail(){ echo "❌ $1"; ng=$((ng+1)); }

echo "▶ 대상: $B"

[ "$(curl -s -o /dev/null -w '%{http_code}' "$B/health")" = 200 ] \
  && pass "1. /health 200" || fail "1. /health 실패"

[ "$(curl -s -o /dev/null -w '%{http_code}' "$B/")" = 200 ] \
  && pass "2. 메인 페이지(SPA) 200" || fail "2. 메인 페이지 실패"

N=$(curl -s "$B/meetings" | "$PY" -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null || echo 0)
[ "${N:-0}" -ge 1 ] && pass "3. /meetings = ${N}건" || fail "3. /meetings 비어있음"

curl -s "$B/stats/meetings-by-year" | grep -q '"year"' \
  && pass "4. /stats 연도별 분포 OK" || fail "4. /stats 실패"

[ "$(curl -s -o /dev/null -w '%{http_code}' "$B/actions")" = 200 ] \
  && pass "5. /actions 200" || fail "5. /actions 실패"

ASK=$(curl -s -X POST "$B/ask" -H 'Content-Type: application/json' \
  -d '{"question":"신제품 가격은 어떻게 결정했어?"}')
RAG=$(echo "$ASK" | "$PY" -c "import sys,json
d=json.load(sys.stdin)
ans=bool(d.get('answer')); src=len(d.get('sources',[])); cc=bool(d.get('crossCheck'))
print(('OK' if ans and src else 'NG'), src, ('발화' if cc else '없음'))" 2>/dev/null)
set -- $RAG
if [ "${1:-NG}" = OK ]; then pass "6. RAG 답변+출처(${2}건)+교차점검(${3})"; else fail "6. RAG 실패"; fi

# STT: 로컬 macOS(say/afconvert)에서만 실음성 검사, 없으면 설정값만 확인
if command -v say >/dev/null 2>&1 && command -v afconvert >/dev/null 2>&1; then
  say -v Yuna -o /tmp/_smoke.aiff "다음 회의는 금요일 오후 세시입니다" 2>/dev/null \
    || say -o /tmp/_smoke.aiff "회의 테스트" 2>/dev/null
  afconvert -f WAVE -d LEI16@16000 -c 1 /tmp/_smoke.aiff /tmp/_smoke.wav 2>/dev/null
  T=$(curl -s -X POST "$B/stt" -H 'Content-Type: audio/wav' --data-binary @/tmp/_smoke.wav \
      | "$PY" -c "import sys,json;print(json.load(sys.stdin).get('text',''))" 2>/dev/null)
  rm -f /tmp/_smoke.aiff /tmp/_smoke.wav
  [ -n "${T:-}" ] && pass "7. STT 전사: \"$T\"" || fail "7. STT 실패(키/Invoke URL/포맷 확인)"
else
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$B/stt" -H 'Content-Type: audio/wav' --data-binary 'x')
  [ "$code" = 401 ] && echo "ℹ️  7. STT: 로컬 TTS 없음 → 엔드포인트만 확인(미설정 401). 브라우저에서 직접 녹음 테스트 필요" \
                    || echo "ℹ️  7. STT: 엔드포인트 응답 $code (브라우저 녹음으로 직접 확인 권장)"
fi

echo "────────────────────────"
echo "통과 $ok / 실패 $ng"
[ "$ng" -eq 0 ] && echo "🟢 ALL GREEN" || { echo "🔴 실패 항목 확인 필요"; exit 1; }
