/* 회의록 브레인 — 화면 ③ 액션 보드 + 간트 */
function ScreenBoard({ actions, onCycle, onOpenMeeting }) {
  const DS = window.CalComDesignSystem_436c9d;
  const { Avatar } = DS;
  const D = window.MB_DATA;

  const parse = (s) => new Date(s + "T00:00:00");

  // 스크롤 영역 실측 → 달 수가 적으면 가용 폭을 채우고, 많으면 최소폭 유지(스크롤)
  const scrollRef = React.useRef(null);
  const [metrics, setMetrics] = React.useState(() => {
    const w = (typeof window !== "undefined") ? window.innerWidth : 1200;
    return { labelW: w < 860 ? 120 : 168, minMonthW: w < 640 ? 64 : 92, availW: 0 };
  });
  React.useLayoutEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      const labelW = w < 860 ? 120 : 168;
      const el = scrollRef.current;
      // 레인 가용 폭 = 스크롤영역 clientWidth − 좌우패딩(44) − 라벨 폭 (−2 안전여백)
      const avail = el ? el.clientWidth - 44 - labelW - 2 : 0;
      setMetrics({ labelW, minMonthW: w < 640 ? 64 : 92, availW: Math.max(0, avail) });
    };
    measure();
    let ro;
    if (typeof ResizeObserver !== "undefined" && scrollRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(scrollRef.current);
    }
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("resize", measure); if (ro) ro.disconnect(); };
  }, []);
  const { labelW, minMonthW, availW } = metrics;

  const today = React.useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const todayStr = React.useMemo(() => {
    const z = (n) => String(n).padStart(2, "0");
    return `${today.getFullYear()}-${z(today.getMonth() + 1)}-${z(today.getDate())}`;
  }, [today]);

  // 담당자별 그룹 (시드 PEOPLE 순서 유지) — 진행률 + 간트 행 공용
  const owners = React.useMemo(() => {
    const order = D.PEOPLE.map((p) => p.name);
    const set = [...new Set(actions.map((a) => a.owner))];
    set.sort((x, y) => {
      const ix = order.indexOf(x), iy = order.indexOf(y);
      return (ix === -1 ? 99 : ix) - (iy === -1 ? 99 : iy);
    });
    return set;
  }, [actions]);

  // 전체 액션을 달 경계로 스냅한 범위 (최소 start月 ~ 최대 end月, 최소 3개월)
  const span = React.useMemo(() => {
    if (!actions.length) return null;
    let lo = Infinity, hi = -Infinity;
    actions.forEach((a) => { lo = Math.min(lo, +parse(a.start)); hi = Math.max(hi, +parse(a.end)); });
    const s = new Date(lo), e = new Date(hi);
    const startY = s.getFullYear(), startM = s.getMonth();
    let count = (e.getFullYear() - startY) * 12 + (e.getMonth() - startM) + 1;
    if (count < 3) count = 3; // 한두 개 액션일 때 너무 좁지 않게
    return { startY, startM, count };
  }, [actions]);

  // 달 한 칸 너비: 달 수가 적으면 가용 폭을 꽉 채워 오른쪽 빈공간 제거, 많으면 최소폭 → 스크롤
  const monthW = React.useMemo(
    () => (span ? Math.max(minMonthW, availW / span.count) : minMonthW),
    [span, availW, minMonthW],
  );

  // 날짜 → 픽셀 (달 시작 = idx*monthW, 달 내부는 일수 비례 → 눈금과 바가 정확히 정렬)
  const xOf = React.useCallback((dateStr) => {
    if (!span) return 0;
    const d = parse(dateStr);
    const idx = (d.getFullYear() - span.startY) * 12 + (d.getMonth() - span.startM);
    const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return idx * monthW + ((d.getDate() - 1) / dim) * monthW;
  }, [span, monthW]);

  const totalW = span ? span.count * monthW : 0;

  // 월 눈금 — 달마다 1칸, 1월/첫칸은 연도 포함
  const ticks = React.useMemo(() => {
    if (!span) return [];
    const out = [];
    for (let i = 0; i < span.count; i++) {
      const m = (span.startM + i) % 12;
      const y = span.startY + Math.floor((span.startM + i) / 12);
      const label = (m === 0 || i === 0) ? `${y}.${m + 1}` : `${m + 1}월`;
      out.push({ x: i * monthW, label });
    }
    return out;
  }, [span, monthW]);

  // 주 눈금 — 각 달을 1·8·15·22일로 세분 (isMonth = 달 경계선)
  const weekTicks = React.useMemo(() => {
    if (!span) return [];
    const out = [];
    for (let i = 0; i < span.count; i++) {
      const m = (span.startM + i) % 12;
      const y = span.startY + Math.floor((span.startM + i) / 12);
      const dim = new Date(y, m + 1, 0).getDate();
      [1, 8, 15, 22].forEach((day) => {
        out.push({ x: i * monthW + ((day - 1) / dim) * monthW, label: day, isMonth: day === 1 });
      });
    }
    return out;
  }, [span, monthW]);

  // 오늘선 — 범위 안일 때만 표시
  const todayInRange = React.useMemo(() => {
    if (!span) return false;
    const startMs = +new Date(span.startY, span.startM, 1);
    const endMs = +new Date(span.startY, span.startM + span.count, 0);
    return +today >= startMs && +today <= endMs;
  }, [span, today]);
  const todayX = todayInRange ? xOf(todayStr) : null;

  // 가로 스크롤 제어 (한 달씩 이동 / 오늘로 점프)
  const scrollByMonths = (n) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: n * monthW, behavior: "smooth" });
  };
  const scrollToToday = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || !span) return;
    let tx;
    if (todayInRange) tx = xOf(todayStr);
    else tx = (+today < +new Date(span.startY, span.startM, 1)) ? 0 : totalW;
    el.scrollTo({ left: Math.max(0, tx - (el.clientWidth - labelW) / 2), behavior: "smooth" });
  }, [span, todayInRange, xOf, todayStr, today, totalW, labelW]);

  // 첫 렌더 / 레이아웃 변경 시 시작 위치를 '오늘' 근처로
  React.useEffect(() => { scrollToToday(); }, [scrollToToday]);

  // 진행률
  const overall = React.useMemo(() => {
    if (!actions.length) return { done: 0, progress: 0, planned: 0, rate: 0 };
    const done = actions.filter((a) => a.status === "done").length;
    const progress = actions.filter((a) => a.status === "progress").length;
    const planned = actions.filter((a) => a.status === "planned").length;
    return { done, progress, planned, rate: done / actions.length };
  }, [actions]);

  const ownerRate = (name) => {
    const list = actions.filter((a) => a.owner === name);
    if (!list.length) return 0;
    return list.filter((a) => a.status === "done").length / list.length;
  };

  if (!actions.length) {
    return (
      <div className="mb-page-pad">
        <BoardHeader overall={overall} total={0} />
        <div className="mb-panel" style={{ marginTop: 22 }}>
          <EmptyState icon="target" title="아직 액션이 없습니다"
            sub="회의록을 저장하면 추출된 담당자별 액션이 여기 타임라인에 나타납니다." />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-page-pad">
      <BoardHeader overall={overall} total={actions.length} />

      {/* 진행률 요약 */}
      <div className="mb-two-col" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, margin: "22px 0" }}>
        <div className="mb-panel mb-panel-pad">
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
            <span className="mb-section-eyebrow">전체 진행률</span>
            <span className="mono" style={{ marginLeft: "auto", fontSize: 22, fontWeight: 700, color: "var(--cal-ink)" }}>
              {Math.round(overall.rate * 100)}%
            </span>
          </div>
          <ProgressBar value={overall.rate} color="var(--mb-green)" height={9} />
          <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
            <Legend color="var(--mb-status-done)" label="완료" n={overall.done} />
            <Legend color="var(--mb-status-progress)" label="진행" n={overall.progress} />
            <Legend color="var(--mb-status-planned)" label="예정" n={overall.planned} />
          </div>
        </div>
        <div className="mb-panel mb-panel-pad">
          <span className="mb-section-eyebrow">담당자별 진행률</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 14 }}>
            {owners.map((name) => {
              const p = D.byName(name);
              const r = ownerRate(name);
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={name} color={p.color} size={24} />
                  <span style={{ fontSize: 12.5, color: "var(--cal-body)", width: 56, flexShrink: 0 }}>{name}</span>
                  <div style={{ flex: 1 }}><ProgressBar value={r} color="var(--mb-blue)" height={6} /></div>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--cal-muted)", width: 34, textAlign: "right" }}>{Math.round(r * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 간트 */}
      <div className="mb-panel" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "16px 22px", borderBottom: "1px solid var(--cal-hairline)", flexWrap: "wrap" }}>
          <Icon name="gantt" size={16} style={{ color: "var(--mb-blue)" }} />
          <span className="mb-title" style={{ fontSize: 14.5 }}>액션 타임라인</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button onClick={() => scrollByMonths(-1)} className="mb-chip click" style={{ padding: "4px 11px", fontSize: 12 }}>◀ 이전달</button>
            <button onClick={scrollToToday} className="mb-chip click" style={{ padding: "4px 11px", fontSize: 12 }}>오늘</button>
            <button onClick={() => scrollByMonths(1)} className="mb-chip click" style={{ padding: "4px 11px", fontSize: 12 }}>다음달 ▶</button>
          </div>
          <span style={{ width: "100%", fontSize: 12, color: "var(--cal-muted)", marginTop: 2 }}>가로로 스크롤하거나 버튼으로 달을 넘기세요 · 바를 클릭하면 상태가 바뀝니다(예정 → 진행 → 완료)</span>
        </div>

        <div className="mb-gantt-scroll" ref={scrollRef}>
          <div className="mb-gantt" style={{ width: labelW + totalW, minWidth: "100%" }}>
            {/* 축 */}
            <div className="mb-gantt-head">
              <div className="mb-gantt-rowlabel-w" />
              <div className="mb-gantt-track-area" style={{ flex: "0 0 auto", width: totalW }}>
                <div className="mb-gantt-axis">
                  {ticks.map((t, i) => (
                    <div key={"m" + i} className="mb-gantt-tick-month" style={{ left: `${t.x}px` }}>{t.label}</div>
                  ))}
                  {weekTicks.filter((t) => !t.isMonth).map((t, i) => (
                    <div key={"w" + i} className="mb-gantt-tick-week" style={{ left: `${t.x}px` }}>{t.label}</div>
                  ))}
                  {todayX != null && (
                    <div style={{ position: "absolute", left: `${todayX}px`, top: 0, bottom: 0, transform: "translateX(-50%)", display: "flex", alignItems: "flex-start", paddingTop: 2, zIndex: 5 }}>
                      <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--mb-blue)", background: "var(--mb-elev)", padding: "1px 4px", borderRadius: 4 }}>오늘</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 행 */}
            {owners.map((name) => {
              const p = D.byName(name);
              const list = actions.filter((a) => a.owner === name);
              return (
                <div key={name} className="mb-gantt-row">
                  <div className="mb-gantt-rowlabel">
                    <Avatar name={name} color={p.color} size={26} />
                    <span className="nm">{name}</span>
                  </div>
                  <div className="mb-gantt-lanes" style={{ flex: "0 0 auto", width: totalW }}>
                    <div className="mb-gantt-grid">
                      {weekTicks.map((t, i) => <span key={i} className={t.isMonth ? "m" : ""} style={{ left: `${t.x}px` }} />)}
                    </div>
                    {todayX != null && (
                      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${todayX}px`, width: 2, background: "var(--mb-blue)", opacity: 0.5, pointerEvents: "none", zIndex: 3 }} />
                    )}
                    {list.map((a) => {
                      const left = xOf(a.start);
                      const width = Math.max(xOf(a.end) - left, 10);
                      const s = D.STATUS[a.status];
                      return (
                        <button
                          key={a.id}
                          className="mb-gantt-bar"
                          onClick={() => onCycle(a.id)}
                          title={`${a.title} · ${a.start} ~ ${a.end} · ${s.label} (클릭해서 상태 변경)`}
                          style={{
                            left: `${left}px`, width: `${width}px`,
                            background: s.color,
                            opacity: a.status === "planned" ? 0.92 : 1,
                          }}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 액션 리스트 (상태 토글 가능) */}
      <div style={{ marginTop: 16 }}>
        <p className="mb-section-eyebrow" style={{ marginBottom: 12 }}>전체 액션 · {actions.length}개</p>
        <div className="mb-action-grid">
          {actions.map((a) => {
            const p = D.byName(a.owner);
            const next = D.STATUS[D.STATUS_CYCLE[a.status]];
            return (
              <div key={a.id} className="mb-panel" style={{ padding: "13px 15px", display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={a.owner} color={p.color} size={30} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--cal-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--cal-muted)", marginTop: 2 }}>{a.owner} · {a.start} ~ {a.end}</div>
                </div>
                <button className="mb-status-toggle" onClick={() => onCycle(a.id)} title={`${next.label}으로 변경`}>
                  <StatusBadge status={a.status} />
                  <Icon name="refresh" size={12} style={{ color: "var(--cal-muted-soft)" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BoardHeader({ overall, total }) {
  return (
    <header>
      <p className="mb-section-eyebrow">액션 보드</p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
        <h1 className="mb-display mb-h1" style={{ marginTop: 8 }}>담당자별 액션 타임라인</h1>
        {total > 0 && (
          <span className="mono" style={{ fontSize: 13, color: "var(--cal-muted)", paddingBottom: 4 }}>
            완료 {overall.done} · 진행 {overall.progress} · 예정 {overall.planned}
          </span>
        )}
      </div>
    </header>
  );
}

function Legend({ color, label, n }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 12.5, color: "var(--cal-body)" }}>{label}</span>
      <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--cal-ink)" }}>{n}</span>
    </div>
  );
}

window.ScreenBoard = ScreenBoard;
