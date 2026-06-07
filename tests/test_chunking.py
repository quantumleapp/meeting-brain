from app.chunking import chunk_text


def test_empty_text_returns_empty_list():
    assert chunk_text("") == []


def test_short_text_is_single_chunk():
    assert chunk_text("안녕하세요", max_chars=500) == ["안녕하세요"]


def test_long_text_is_split_with_overlap():
    text = "가" * 1200
    chunks = chunk_text(text, max_chars=500, overlap=50)
    assert len(chunks) == 3
    assert all(len(c) <= 500 for c in chunks)
    # 겹침: 두 번째 청크 시작이 첫 청크 끝보다 50 앞
    assert chunks[1][:50] == text[450:500]
