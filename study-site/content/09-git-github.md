# 09. Git & GitHub

## 한 줄 요약
`.gitignore`로 비밀값을 제외하고, **올라갈 파일을 비밀값 스캔**한 뒤 커밋하고, `gh` CLI로 공개 저장소를 만들어 푸시했다.

## 핵심 개념 (왜)
- **버전관리/원격:** 로컬 git(커밋 기록) ↔ 원격(GitHub `origin`). `git push`로 동기화.
- **`.gitignore`:** 추적하지 않을 파일(예: `.env`, `.venv/`, `.omc/`). **비밀값 누출 방지의 1차 방어선**.
- **비밀값은 절대 커밋 금지:** 한 번 커밋되면 **이력(history)에 영원히** 남는다 → 푸시 전 스캔이 중요.
- **gh CLI:** GitHub 작업(로그인·저장소 생성·푸시)을 명령줄에서. `gh auth login`은 브라우저 인증(직접 실행).

## 우리가 한 것 (어떻게)
```bash
# 1) .gitignore 보강: .env, .venv/, .omc/, __pycache__, *.pyc ...
# 2) 비밀값/실IP 스캔 (커밋될 파일 대상)
grep -rInE "nv-[A-Za-z0-9]{8}|clovaspeech-gw|<서버공인IP>|PRIVATE KEY" --exclude=.env .
git check-ignore -v .env            # .env가 무시되는지 확인
# 3) 스테이징 후 '금지 항목이 안 섞였나' 재확인
git add -A
git diff --cached --name-only | grep -E "\.env$|\.venv/|\.omc/" && echo "❌" || echo "✅"
# 4) 커밋 + 원격 생성·푸시 (gh)
git commit -m "..."
#   gh auth login   ← 브라우저 인증(직접)
gh repo create meeting-brain --public --source=. --remote=origin --push
# 5) 원격 트리에 .env 없는지 검증
gh api "repos/<user>/meeting-brain/git/trees/main?recursive=1" -q '.tree[].path' | grep .env
```

## 막혔던 점 → 해결
- **비밀값 누출 위험** → 커밋 전 **스캔 + `git check-ignore`** 로 `.env` 제외 확인, 커밋 후 **원격 트리 재검증**.
- **`?recursive=1`에서 zsh 오류**(`no matches found`) → `?`가 glob으로 해석됨. 해결: URL을 **따옴표로** 감싸기.
- **docker-compose의 `postgres/postgres`** → 로컬 기본값이고 5432 비공개라 데모 리포엔 무방(실제 키 아님).

## 셀프체크
1. `.env`가 실수로 한 번 커밋됐다면 왜 단순 삭제로 안전하지 않나?
2. 푸시 전/후로 각각 무엇을 확인했나?
3. `.gitignore`에 있는데도 추적되는 파일이 있다면 원인은?
