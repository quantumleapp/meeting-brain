/* 회의록 브레인 — 화면 ① 회의록 입력 */
function ScreenInput({ onSave, recent, onOpenMeeting }) {
  const DS = window.CalComDesignSystem_436c9d;
  const { Button, Input, Avatar } = DS;
  const D = window.MB_DATA;

  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState("");
  const [attendees, setAttendees] = React.useState("");
  const [note, setNote] = React.useState("");
  const [phase, setPhase] = React.useState("idle"); // idle | saving | done | error
  const [result, setResult] = React.useState(null);
  const [aiSource, setAiSource] = React.useState(null);
  const [errorCode, setErrorCode] = React.useState(null);
  const [sttPhase, setSttPhase] = React.useState("idle"); // idle | recording | transcribing
  const [sttError, setSttError] = React.useState(false);
  const recorderRef = React.useRef(null);
  const chunksRef = React.useRef([]);

  const fillSample = () => {
    setTitle("신제품 출시 점검 회의");
    setDate("2026-02-19");
    setAttendees("박서준, 최민서, 김하늘, 한지우");
    setNote(D.SAMPLE_NOTE);
  };

  const save = async () => {
    if (!note.trim() || phase === "saving") return;
    setPhase("saving");
    setResult(null);
    setErrorCode(null);
    try {
      const out = await window.MB_AI.extractMeeting(title, date, attendees, note);
      // 백엔드 응답(summary: str, actions: [{text,start_date,due_date}])을 화면 형태로 정규화
      const summary = Array.isArray(out.summary)
        ? out.summary
        : out.summary ? [out.summary] : [];
      const actions = (out.actions || []).map((a) => ({
        title: a.title || a.text,
        owner: a.owner,
        start: a.start || a.start_date,
        end: a.end || a.due_date,
      }));
      const ex = { summary, decisions: out.decisions || [], actions, _source: out._source };
      setResult(ex);
      setAiSource(ex._source);
      setPhase("done");
      const meeting = {
        id: out.id != null ? "srv-" + out.id : "new-" + Date.now(),
        title: title.trim() || "제목 없는 회의",
        date: date || new Date().toISOString().slice(0, 10),
        attendees: attendees.split(",").map((s) => s.trim()).filter(Boolean),
        summary: ex.summary,
        decisions: ex.decisions,
        tags: ["신규"],
      };
      onSave && onSave({ meeting, actions: ex.actions });
    } catch (err) {
      setErrorCode(err.message || "network");
      setPhase("error");
    }
  };

  const toggleMic = async () => {
    if (sttPhase === "recording") {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices) return;
    setSttError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const rec = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setSttPhase("transcribing");
        setSttError(false);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        try {
          const res = await fetch("/stt", {
            method: "POST",
            headers: { "Content-Type": mimeType },
            body: blob,
          });
          if (!res.ok) throw new Error("stt-error");
          const data = await res.json();
          if (data.text) {
            setNote((prev) => prev ? prev + "\n" + data.text : data.text);
          } else {
            setSttError(true);
          }
        } catch (_) {
          setSttError(true);
        }
        setSttPhase("idle");
      };
      rec.start();
      recorderRef.current = rec;
      setSttPhase("recording");
    } catch (_) {
      setSttPhase("idle");
    }
  };

  const canSave = note.trim().length > 0 && phase !== "saving";

  return (
    <div className="mb-page-pad">
      <header style={{ marginBottom: 24 }}>
        <p className="mb-section-eyebrow">회의록 입력</p>
        <h1 className="mb-display mb-h1" style={{ marginTop: 8 }}>회의록을 붙여넣으면 AI가 정리합니다</h1>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "var(--cal-muted)", lineHeight: 1.6 }}>
          요약 · 결정사항 · 담당자별 액션을 자동으로 추출해 팀의 기억으로 쌓습니다.
        </p>
      </header>

      <div className="mb-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* 입력 폼 */}
        <div className="mb-panel mb-panel-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 12 }}>
            <Input label="회의 제목" placeholder="예: 신제품 출시 점검 회의" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input label="날짜" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Input label="참석자 (선택)" placeholder="쉼표로 구분 · 예: 박서준, 최민서" value={attendees} onChange={(e) => setAttendees(e.target.value)} />

          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--cal-ink)" }}>회의록 원문</label>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button
                  onClick={toggleMic}
                  className="mb-chip click"
                  style={{
                    padding: "4px 10px", fontSize: 12,
                    ...(sttPhase === "recording" ? { color: "#ef4444", borderColor: "#ef4444" } : {}),
                  }}
                >
                  {sttPhase === "transcribing"
                    ? <><span className="mb-spin" style={{ width: 11, height: 11, display: "inline-block" }} /> 변환 중</>
                    : sttPhase === "recording"
                    ? "⏹ 녹음 중지"
                    : "🎙 음성 입력"}
                </button>
                <button onClick={fillSample} className="mb-chip click" style={{ padding: "4px 10px", fontSize: 12 }}>
                  <Icon name="sparkle" size={13} style={{ color: "var(--mb-blue)" }} /> 예시 채우기
                </button>
              </div>
            </div>
            <textarea
              className="mb-textarea"
              placeholder="회의록 원문을 그대로 붙여넣으세요…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12.5, color: sttError ? "#ef4444" : "var(--cal-muted)" }}>
              {sttError
                ? "음성 인식에 실패했어요 · 다시 시도해 주세요"
                : note.trim() ? `${note.trim().length.toLocaleString()}자` : "원문을 입력하면 저장할 수 있어요"}
            </span>
            <div style={{ marginLeft: "auto" }}>
              <Button variant="primary" onClick={save} disabled={!canSave}
                iconLeft={phase === "saving" ? <span className="mb-spin" /> : <Icon name="check" size={16} />}>
                {phase === "saving" ? "저장 중…" : "회의록 저장"}
              </Button>
            </div>
          </div>
        </div>

        {/* 결과 / 빈 상태 */}
        <div className="mb-panel" style={{ overflow: "hidden", minHeight: 320 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--cal-hairline)", display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="sparkle" size={16} style={{ color: "var(--mb-blue)" }} />
            <span className="mb-title" style={{ fontSize: 14.5 }}>AI 추출 결과</span>
            {aiSource && phase === "done" && (
              <span className="mb-chip" style={{ marginLeft: "auto", padding: "3px 9px", fontSize: 11 }}>
                {aiSource === "ai" ? "실시간 AI" : "데모 추출"}
              </span>
            )}
          </div>

          {phase === "saving" && (
            <div style={{ padding: "54px 20px", textAlign: "center", color: "var(--cal-muted)" }}>
              <span className="mb-spin" style={{ width: 22, height: 22, color: "var(--mb-blue)" }} />
              <p style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: "var(--cal-ink)" }}>저장 중…</p>
              <p style={{ margin: "4px 0 0", fontSize: 13 }}>AI가 요약·결정사항·액션을 추출하고 있어요</p>
            </div>
          )}

          {phase === "idle" && (
            <EmptyState icon="file-plus" title="회의록을 입력하면 AI가 정리해 드립니다"
              sub="왼쪽에 원문을 붙여넣고 ‘회의록 저장’을 누르면 요약과 액션이 여기에 나타납니다. ‘예시 채우기’로 바로 체험해 보세요." />
          )}

          {phase === "done" && result && (
            <div className="mb-rise" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
              <Block label="요약">
                <ul style={listStyle}>
                  {result.summary.map((s, i) => (
                    <li key={i} style={liStyle}><span style={dotStyle("var(--cal-muted-soft)")} />{s}</li>
                  ))}
                </ul>
              </Block>
              <Block label="결정사항">
                <ul style={listStyle}>
                  {result.decisions.map((s, i) => (
                    <li key={i} style={liStyle}><span style={dotStyle("var(--mb-green)", true)} />{s}</li>
                  ))}
                </ul>
              </Block>
              <Block label={`추출된 액션 · ${result.actions.length}개`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.actions.map((a, i) => {
                    const p = D.byName(a.owner);
                    return (
                      <div key={i} className="mb-inset" style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px" }}>
                        <Avatar name={a.owner} color={p.color} size={28} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--cal-ink)" }}>{a.title}</div>
                          <div className="mono" style={{ fontSize: 11, color: "var(--cal-muted)" }}>{a.owner} · {a.start} ~ {a.end}</div>
                        </div>
                        <StatusBadge status="planned" />
                      </div>
                    );
                  })}
                </div>
              </Block>
            </div>
          )}

          {phase === "error" && (
            <div style={{ padding: 20 }}>
              <ErrorNotice code={errorCode} onRetry={() => { setPhase("idle"); setErrorCode(null); }} />
            </div>
          )}
        </div>
      </div>

      {/* 최근 저장 */}
      <div style={{ marginTop: 26 }}>
        <p className="mb-section-eyebrow" style={{ marginBottom: 12 }}>최근 저장된 회의록 · {recent.length}건</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {recent.slice(0, 8).map((m) => (
            <button key={m.id} className="mb-chip click" onClick={() => onOpenMeeting(m)}>
              <Icon name="file-text" size={13} style={{ color: "var(--cal-muted)" }} />
              <span style={{ color: "var(--cal-ink)" }}>{m.title}</span>
              <span className="mb-chip-date mono">{m.date}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const listStyle = { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 };
const liStyle = { display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.6, color: "var(--cal-body)" };
const dotStyle = (c, diamond) => ({ marginTop: 7, width: 6, height: 6, borderRadius: diamond ? 1 : "50%", flexShrink: 0, background: c, transform: diamond ? "rotate(45deg)" : "none" });
function Block({ label, children }) {
  return (
    <div>
      <p className="mb-section-eyebrow" style={{ marginBottom: 10 }}>{label}</p>
      {children}
    </div>
  );
}

window.ScreenInput = ScreenInput;
