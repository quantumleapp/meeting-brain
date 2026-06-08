# 02. RAG 검색 & 답변

## 한 줄 요약
질문을 임베딩해 **가장 가까운 회의 발췌 top-5** 를 찾고(코사인), 그 **근거만 가지고** HyperCLOVA X가 출처와 함께 답한다.

## 핵심 개념 (왜)
- **RAG (Retrieval-Augmented Generation):** "검색 + 생성". LLM에게 관련 자료를 찾아 **붙여주고** 답하게 한다 → 환각↓, 최신/사내 지식 반영.
- **코사인 거리 (`<=>`):** 두 벡터의 방향 차이. 작을수록 의미가 비슷. pgvector가 `ORDER BY embedding <=> 질문벡터` 로 정렬.
- **top-k:** 가장 가까운 k개만 근거로 사용(여기선 k=5). 너무 많으면 노이즈, 적으면 누락.
- **근거 기반 답변:** "제공된 발췌에만 근거해 답하고, 없으면 모른다고 하라" → 거짓 생성 억제.

## 우리가 한 것 (어떻게)
**검색** (`app/store.py search_chunks`)
```sql
SELECT mc.chunk_text, m.title, m.meeting_date
FROM meeting_chunks mc JOIN meetings m ON m.id = mc.meeting_id
ORDER BY mc.embedding <=> %s::vector LIMIT %s   -- 코사인, k=5
```
**답변** (`app/ask.py`)
```python
ANSWER_SYSTEM = "...제공된 '관련 회의록'과 '과거 결정'에만 근거해 답하세요. 근거가 없으면 모른다고..."
def answer_question(conn, clova, question, k=5):
    emb = clova.embed(question)
    chunks = store.search_chunks(conn, emb, k)        # 검색
    if not chunks: return {"answer": "관련 회의록을 찾지 못했습니다.", "sources": [], "crossCheck": None}
    context = build_context(chunks, store.get_decisions(conn))
    answer = clova.chat(ANSWER_SYSTEM, f"질문: {question}\n\n{context}")
    sources = [{"title": c["title"], "date": c["meeting_date"]} for c in chunks]
    return {"answer": answer, "sources": sources, "crossCheck": detect_crosscheck(...)}
```
- **출처(sources):** 검색에 쓰인 회의의 제목·날짜 → 화면에 **출처 칩**으로.

## 막혔던 점 → 해결
- **잘못된 답("10만원/500만원")** → 원인은 **테스트 더미 데이터 오염**. 해결: 오염 회의 삭제(ON DELETE CASCADE로 청크·결정·액션 함께 삭제) 후 **정리·재적재** → "중가 포지셔닝" 정상.
- 빈 결과여도 검색이 안 깨지게 **빈 상태 분기** 처리.

## 셀프체크
1. RAG가 "그냥 LLM에 질문"보다 나은 이유 2가지?
2. `<=>` 가 작다 = 무슨 뜻?
3. top-k를 100으로 키우면 어떤 부작용이 생길까?
