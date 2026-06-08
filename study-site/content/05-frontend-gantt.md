# 05. 프론트엔드 & 간트 타임라인

## 한 줄 요약
**빌드 없는 React**(브라우저에서 Babel이 JSX 변환)로 4화면을 만들고, 간트 타임라인을 **퍼센트→픽셀 레이아웃**으로 바꿔 월 단위 스크롤·가독성을 확보했다.

## 핵심 개념 (왜)
- **빌드리스 React:** `index.html`이 React UMD + `@babel/standalone`을 불러오고, `.jsx`를 `<script type="text/babel">`로 로드. webpack/Vite 없이 동작 → 단순하지만 **브라우저 캐시**에 민감.
- **퍼센트 vs 픽셀 레이아웃:** 퍼센트는 화면 폭에 다 욱여넣어 기간이 길면 **바가 찌그러진다**. 픽셀(달마다 고정폭)은 폭을 넘으면 **가로 스크롤**이 생겨 안 찌그러진다.
- **브라우저 캐시(휴리스틱):** `Cache-Control`이 없으면 브라우저가 옛 파일을 재검증 없이 재사용 → 수정이 화면에 안 보임.

## 우리가 한 것 (어떻게)
- **간트 픽셀화** (`screen_board.jsx`): `monthW`(달 칸 폭), `xOf(date)`(날짜→px), `ResizeObserver`로 영역 폭 실측 → 달이 적으면 폭을 **꽉 채우고**(빈공간 제거) 많으면 최소폭 유지(스크롤). `[◀이전달·오늘·다음달▶]` 버튼, 담당자 라벨 `position: sticky` 고정.
- **캐시 차단** (`app/main.py`):
```python
@app.middleware("http")
async def no_cache_static(request, call_next):
    resp = await call_next(request)
    if request.url.path.startswith("/static/"):
        resp.headers["Cache-Control"] = "no-cache"   # 매번 ETag 재검증
    return resp
```

## 막혔던 점 → 해결
- **코드 고쳐도 화면이 그대로** → 브라우저가 옛 `.jsx`를 캐시. 1차: **하드 리프레시**(⌘⇧R). 근본: `/static/*`에 `Cache-Control: no-cache`.
- **간트 바가 찌그러짐** → 퍼센트 레이아웃. 해결: 픽셀 + 가로 스크롤 + 월 이동.
- **오른쪽 빈 공간** → 고정폭이 화면보다 좁아서. 해결: `ResizeObserver`로 가용폭 측정해 **채움**.

## 셀프체크
1. webpack 없이 JSX가 브라우저에서 도는 원리는?
2. `Cache-Control: no-cache`가 정확히 무엇을 바꾸나? (캐시 안 함과 다른 점)
3. 간트에서 "달이 적으면 채우고, 많으면 스크롤"을 어떻게 한 문장으로 구현했나?
