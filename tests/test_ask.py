from app import ask, ingest


def test_answer_question_returns_answer_and_sources(db, fake_clova):
    ingest.ingest_meeting(
        db, fake_clova, "강남 브랜드데이", "2023-10-22", "김CMO",
        "강남 브랜드데이 1800만 집행. 케이터링 부풀려 손실.",
    )
    result = ask.answer_question(db, fake_clova, "강남 이벤트 비용 어떻게 잡았어?")
    assert result["answer"] == "테스트 답변입니다."
    assert len(result["sources"]) >= 1
    assert result["sources"][0]["title"] == "강남 브랜드데이"


def test_answer_question_no_results(db, fake_clova):
    result = ask.answer_question(db, fake_clova, "데이터 없는 질문")
    assert result["sources"] == []
    assert "찾지 못" in result["answer"]
