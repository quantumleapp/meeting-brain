/* 회의록 브레인 — 화면 ④ 누적 대시보드 */
function ScreenDashboard({ meetings, actions }) {
  const D = window.MB_DATA;

  // 연도별 회의록 건수 — 데모 비주얼 유지(시드). RAG 검색만 실제 DB를 사용.
  const yearly = D.YEARLY;
  const maxCount = Math.max(...yearly.map((y) => y.count));
  const totalSeed = yearly.reduce((s, y) => s + y.count, 0);
  // 라이브 합계 = 시드 누적 + 데모 중 새로 추가된 회의
  const newCount = meetings.filter((m) => String(m.id).startsWith("new-")).length;
  const total = totalSeed + newCount;

  const doneRate = actions.length
    ? Math.round((actions.filter((a) => a.status === "done").length / actions.length) * 100)
    : 0;

  // 막대 애니메이션 트리거
  const [grown, setGrown] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setGrown(true), 60);
    return () => clearTimeout(t);
  }, []);

  const flow = [
    { ic: "file-text", title: "회의록 입력", sub: "원문 붙여넣기" },
    { ic: "layers", title: "임베딩", sub: "문장 단위 벡터화" },
    { ic: "database", title: "Vector DB", sub: "의미 기반 저장" },
    { ic: "search", title: "RAG 검색", sub: "출처와 함께 답변" },
  ];

  return (
    <div className="mb-page-pad">
      <header style={{ marginBottom: 22 }}>
        <p className="mb-section-eyebrow">누적 대시보드</p>
        <h1 className="mb-display mb-h1" style={{ marginTop: 8 }}>회사의 기억이 이렇게 쌓였습니다</h1>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "var(--cal-muted)", lineHeight: 1.6 }}>
          연도별 회의록 누적량과, 입력된 회의록이 검색 가능한 기억이 되기까지의 흐름입니다.
        </p>
      </header>

      {/* 스탯 카드 */}
      <div className="mb-stat-grid">
        <StatCard label="누적 회의록" value={total.toLocaleString()} unit="건" icon="file-text" accent="var(--mb-blue)" />
        <StatCard label="추적 중 액션" value={actions.length} unit="개" icon="target" accent="var(--mb-amber)" />
        <StatCard label="액션 완료율" value={doneRate} unit="%" icon="check-circle" accent="var(--mb-green)" />
        <StatCard label="검색 가능 인덱스" value={(total * 7).toLocaleString()} unit="청크" icon="layers" accent="var(--mb-blue)" />
      </div>

      {/* 연도별 막대 */}
      <div className="mb-panel mb-panel-pad" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
          <Icon name="bar-chart" size={16} style={{ color: "var(--mb-blue)" }} />
          <span className="mb-title" style={{ fontSize: 14.5 }}>연도별 회의록 건수</span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--cal-muted)" }}>2026년은 진행 중</span>
        </div>
        <div className="mb-bars">
          {yearly.map((y, i) => {
            const h = (y.count / maxCount) * 100;
            const isCurrent = i === yearly.length - 1;
            return (
              <div key={y.year} className="mb-bar-col">
                <span className="mb-bar-val">{y.count}</span>
                <div
                  className="mb-bar-rect"
                  style={{
                    height: grown ? `${h}%` : "0%",
                    background: isCurrent
                      ? "linear-gradient(180deg, var(--mb-green), color-mix(in srgb, var(--mb-green) 55%, transparent))"
                      : undefined,
                    transitionDelay: `${i * 70}ms`,
                  }}
                />
                <span className="mb-bar-year">{y.year}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 파이프라인 흐름 */}
      <div className="mb-panel mb-panel-pad" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
          <Icon name="sparkle" size={16} style={{ color: "var(--mb-blue)" }} />
          <span className="mb-title" style={{ fontSize: 14.5 }}>임베딩 → Vector DB → RAG 흐름</span>
        </div>
        <div className="mb-flow">
          {flow.map((n, i) => (
            <React.Fragment key={n.title}>
              <div className="mb-flow-node">
                <span className="ic"><Icon name={n.ic} size={18} /></span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--cal-ink)" }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "var(--cal-muted)", marginTop: 3 }}>{n.sub}</div>
                </div>
              </div>
              {i < flow.length - 1 && (
                <div className="mb-flow-arrow"><Icon name="arrow-right" size={18} /></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 12.5, color: "var(--cal-muted)", lineHeight: 1.6 }}>
          저장된 회의록은 문장 단위로 임베딩되어 Vector DB에 쌓이고, 질문이 들어오면 의미가 가까운 회의를 찾아 출처와 함께 답합니다.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, icon, accent }) {
  return (
    <div className="mb-panel mb-stat-card">
      <span className="mb-stat-ic" style={{ color: accent, background: `color-mix(in srgb, ${accent} 14%, transparent)` }}>
        <Icon name={icon} size={18} />
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span className="mono" style={{ fontSize: 28, fontWeight: 700, color: "var(--cal-ink)", letterSpacing: "-0.02em" }}>{value}</span>
        <span style={{ fontSize: 13, color: "var(--cal-muted)" }}>{unit}</span>
      </div>
      <span style={{ fontSize: 12.5, color: "var(--cal-muted)" }}>{label}</span>
    </div>
  );
}

window.ScreenDashboard = ScreenDashboard;
