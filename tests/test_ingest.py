from app import ingest, store


def test_ingest_meeting_stores_summary_chunks_decisions(db, fake_clova):
    raw = "강남 이벤트 비용 1500만 논의. 케이터링 200만 제한 결정."
    mid = ingest.ingest_meeting(db, fake_clova, "4월 마케팅", "2026-04-30", "윤소정", raw)

    meetings = store.list_meetings(db)
    assert meetings[0]["id"] == mid
    assert meetings[0]["summary"] == "요약"

    # 청크 1개 이상 임베딩되어 검색됨
    results = store.search_chunks(db, fake_clova.embed(raw), k=5)
    assert len(results) >= 1

    # 결정사항 저장됨
    decisions = store.get_decisions(db)
    assert any("결정1" == d["text"] for d in decisions)


def test_extract_structure_parses_json(fake_clova):
    result = ingest.extract_structure(fake_clova, "원문")
    assert result["summary"] == "요약"
    assert result["decisions"] == ["결정1"]
