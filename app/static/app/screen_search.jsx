/* 회의록 브레인 — 화면 ② RAG 검색 */
function ScreenSearch({ onOpenMeeting }) {
  const DS = window.CalComDesignSystem_436c9d;
  const { Button } = DS;
  const D = window.MB_DATA;

  const [q, setQ] = React.useState("");
  const [phase, setPhase] = React.useState("idle"); // idle | searching | done | empty | error
  const [res, setRes] = React.useState(null);
  const [errorCode, setErrorCode] = React.useState(null);
  const inputRef = React.useRef(null);

  const ask = async (question) => {
    const query = (question != null ? question : q).trim();
    if (!query || phase === "searching") return;
    if (question != null) setQ(query);
    setPhase("searching");
    setRes(null);
    setErrorCode(null);
    try {
      const out = await window.MB_AI.ragSearch(query);
      if (!out || !out.sources || out.sources.length === 0) {
        setPhase("empty");
        setRes(out);
        return;
      }
      setRes(out);
      setPhase("done");
    } catch (err) {
      setErrorCode(err.message || "network");
      setPhase("error");
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      ask();
    }
  };

  const busy = phase === "searching";

  return (
    <div className="mb-page-pad">
      <header style={{ marginBottom: 22 }}>
        <p className="mb-section-eyebrow">RAG 검색</p>
        <h1 className="mb-display mb-h1" style={{ marginTop: 8 }}>과거 회의에 물어보세요</h1>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "var(--cal-muted)", lineHeight: 1.6 }}>
          자연어로 질문하면 관련 회의록을 찾아 <b style={{ color: "var(--cal-body)" }}>출처와 함께</b> 답하고, 과거 결정이 어긋나면 교차점검해 드립니다.
        </p>
      </header>

      {/* 검색 박스 — 1순위 액션 */}
      <div className="mb-search-box">
        <div className="mb-search-row">
          <Icon name="search" size={19} style={{ color: "var(--cal-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="mb-search-input"
            placeholder="예: 신제품 가격은 어떻게 결정했지?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
          />
          <Button variant="primary" onClick={() => ask()} disabled={busy || !q.trim()}
            iconLeft={busy ? <span className="mb-spin" /> : <Icon name="send" size={16} />}>
            {busy ? "검색 중…" : "질문"}
          </Button>
        </div>
        <div className="mb-qchips" style={{ marginTop: 14 }}>
          <span style={{ fontSize: 12, color: "var(--cal-muted-soft)", alignSelf: "center", marginRight: 2 }}>예시</span>
          {D.SAMPLE_QUESTIONS.map((sq) => (
            <button key={sq} className="mb-chip click" onClick={() => ask(sq)} disabled={busy}
              style={{ opacity: busy ? 0.5 : 1 }}>
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 영역 */}
      <div style={{ marginTop: 24 }}>
        {phase === "idle" && (
          <div className="mb-panel">
            <EmptyState icon="search" title="무엇이든 물어보세요"
              sub="과거 회의의 결정사항을 근거로 답합니다. 위 예시 질문을 눌러 바로 체험해 보세요." />
          </div>
        )}

        {phase === "searching" && (
          <div className="mb-panel" style={{ padding: "52px 20px", textAlign: "center", color: "var(--cal-muted)" }}>
            <span className="mb-spin" style={{ width: 22, height: 22, color: "var(--mb-blue)" }} />
            <p style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: "var(--cal-ink)" }}>검색 중…</p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>관련 회의록을 찾아 답변을 정리하고 있어요</p>
          </div>
        )}

        {phase === "empty" && (
          <div className="mb-panel">
            <EmptyState icon="inbox" title="관련 회의록을 찾지 못했습니다"
              sub="질문을 조금 더 구체적으로 바꿔 보세요. 예: ‘신제품 가격’, ‘팝업 운영 기간’, ‘마케팅 예산’." />
          </div>
        )}

        {phase === "error" && (
          <ErrorNotice code={errorCode} onRetry={() => ask()} />
        )}

        {phase === "done" && res && (
          <div className="mb-rise" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 답변 카드 */}
            <div className="mb-panel mb-panel-pad">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <span className="mb-answer-mark"><Icon name="sparkle" size={15} /></span>
                <span className="mb-title" style={{ fontSize: 14.5 }}>답변</span>
                <span className="mb-chip" style={{ marginLeft: "auto", padding: "3px 9px", fontSize: 11 }}>
                  {res._source === "ai" ? "실시간 AI" : "데모 검색"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.72, color: "var(--cal-ink)", fontWeight: 500, textWrap: "pretty" }}>
                {renderRich(res.answer)}
              </p>

              {/* 출처 */}
              {res.sources && res.sources.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--cal-hairline)" }}>
                  <p className="mb-section-eyebrow" style={{ marginBottom: 11, display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon name="link" size={13} /> 출처 · {res.sources.length}건
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {res.sources.map((src, i) => (
                      <SourceChip key={i} meetingId={src} onClick={onOpenMeeting} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 교차점검 */}
            {res.crossCheck && (
              <Crosscheck note={res.crossCheck.note} a={res.crossCheck.a} b={res.crossCheck.b} onOpenMeeting={onOpenMeeting} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

window.ScreenSearch = ScreenSearch;
