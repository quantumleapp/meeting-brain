# study-site — 복습 가이드 웹페이지 (Vercel 배포용)

`_learning/` 복습 가이드를 **브라우저에서 보는 정적 사이트**로 만든 것. 빌드 없음(바닐라 `index.html` + marked.js).

## 구성
- `index.html` — 사이드바 + 마크다운 렌더 + 다크 테마 + 모바일 반응형 (해시 라우팅 `#01-...`)
- `content/*.md` — `_learning/`에서 복사한 페이지 (사이트가 fetch해서 렌더)

> ⚠️ `content/`는 `_learning/`의 **복사본**입니다. 원본(`_learning/`)을 고쳤다면 아래로 동기화:
> ```bash
> cp ../_learning/*.md content/
> ```

## 로컬 미리보기
`file://`로 직접 열면 fetch가 막히니 **정적 서버**로 엽니다:
```bash
npx serve study-site            # 또는
python3 -m http.server -d study-site 5050   # http://localhost:5050
```

## Vercel 배포 (GitHub 연동)
1. <https://vercel.com> 로그인 → **Add New… → Project**
2. **Import** `quantumleapp/meeting-brain` (GitHub 연결)
3. 설정:
   - **Root Directory:** `study-site`  ← 꼭 지정
   - **Framework Preset:** `Other` (정적, 빌드 명령 없음)
   - Build/Output: 비워두기(정적 서빙)
4. **Deploy** → 발급된 `*.vercel.app` 주소로 접속
5. 이후 `git push`하면 자동 재배포. (`content/` 갱신도 커밋하면 반영)

> 커스텀 도메인을 붙이려면 Vercel 프로젝트 → Settings → Domains.
