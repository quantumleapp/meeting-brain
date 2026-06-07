/* 회의록 브레인 — 앱 셸 (사이드바 · 토픽바 · 전역 상태) */
function App() {
  const DS = window.CalComDesignSystem_436c9d;
  const { Switch } = DS;
  const D = window.MB_DATA;

  const [screen, setScreen] = React.useState("input"); // input | search | board | dashboard
  const [meetings, setMeetings] = React.useState(D.MEETINGS);
  const [actions, setActions] = React.useState(
    D.ACTIONS.map((a) => ({ ...a }))
  );
  const [modalMeeting, setModalMeeting] = React.useState(null);
  const [toast, setToast] = React.useState({ show: false, msg: "" });
  const [navOpen, setNavOpen] = React.useState(false);
  const [theme, setTheme] = React.useState("dark");

  // 테마 적용
  React.useEffect(() => {
    document.documentElement.setAttribute("data-mb-theme", theme);
  }, [theme]);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast((s) => ({ ...s, show: false })), 2600);
  };

  // 회의록 저장 (화면 ①)
  const handleSave = ({ meeting, actions: newActions }) => {
    setMeetings((ms) => [meeting, ...ms]);
    if (newActions && newActions.length) {
      setActions((as) => [
        ...newActions.map((a, i) => ({
          id: `na-${meeting.id}-${i}`,
          title: a.title, owner: a.owner, start: a.start, end: a.end,
          status: "planned", meeting: meeting.id,
        })),
        ...as,
      ]);
    }
    showToast("회의록을 저장했습니다");
  };

  // 액션 상태 순환 (화면 ③) — 보드는 데모 비주얼(시드+세션 저장분)이라 로컬 상태만 변경
  const cycle = (id) => {
    setActions((as) => as.map((a) =>
      a.id === id ? { ...a, status: D.STATUS_CYCLE[a.status] } : a
    ));
  };

  const navItems = [
    { key: "input", label: "회의록 입력", icon: "file-plus", count: meetings.length },
    { key: "search", label: "RAG 검색", icon: "search" },
    { key: "board", label: "액션 보드", icon: "gantt", count: actions.length },
    { key: "dashboard", label: "누적 대시보드", icon: "dashboard" },
  ];

  const go = (key) => { setScreen(key); setNavOpen(false); };

  const screenMeta = {
    input: { title: "회의록 입력", sub: "AI 정리 · 저장" },
    search: { title: "RAG 검색", sub: "출처 기반 답변" },
    board: { title: "액션 보드", sub: "담당자별 타임라인" },
    dashboard: { title: "누적 대시보드", sub: "회의 기록 누적" },
  }[screen];

  const doneCount = actions.filter((a) => a.status === "done").length;

  return (
    <div className="mb-app">
      {/* 사이드바 */}
      {navOpen && <div className="mb-nav-scrim" onClick={() => setNavOpen(false)} />}
      <aside className={"mb-sidebar" + (navOpen ? " open" : "")}>
        <div className="mb-brand">
          <div className="mb-brand-mark">
            <Icon name="layers" size={18} style={{ color: "#cdddff" }} />
          </div>
          <div>
            <div className="mb-brand-name">회의록 브레인</div>
            <div className="mb-brand-sub">MEETING BRAIN</div>
          </div>
        </div>

        <nav className="mb-nav">
          <div className="mb-nav-label">워크스페이스</div>
          {navItems.map((it) => (
            <button
              key={it.key}
              className={"mb-nav-item" + (screen === it.key ? " active" : "")}
              onClick={() => go(it.key)}
            >
              <Icon name={it.icon} size={18} />
              <span>{it.label}</span>
              {it.count != null && <span className="mb-nav-count mono">{it.count}</span>}
            </button>
          ))}
        </nav>

        <div className="mb-sidebar-foot">
          <div className="mb-board-chip">
            <span className="mb-board-dot" />
            공용 팀 보드 · 데모
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "2px 4px" }}>
            <Icon name="sparkle" size={14} style={{ color: "var(--cal-muted)" }} />
            <span style={{ fontSize: 12.5, color: "var(--cal-muted)" }}>라이트 테마</span>
            <span style={{ marginLeft: "auto" }}>
              <Switch checked={theme === "light"} onChange={(v) => setTheme(v ? "light" : "dark")} />
            </span>
          </div>
        </div>
      </aside>

      {/* 메인 */}
      <div className="mb-main">
        <div className="mb-topbar">
          <button className="mb-menu-btn mb-chip click" style={{ padding: 8, borderRadius: 9 }} onClick={() => setNavOpen(true)} aria-label="메뉴">
            <Icon name="menu" size={18} />
          </button>
          <div>
            <div className="mb-title" style={{ fontSize: 15 }}>{screenMeta.title}</div>
            <div style={{ fontSize: 11.5, color: "var(--cal-muted)" }}>{screenMeta.sub}</div>
          </div>
          <div className="mb-topbar-meta">
            <div className="mb-topbar-stat">
              <b>{meetings.length}</b>
              <span>회의록</span>
            </div>
            <div className="mb-topbar-stat">
              <b>{doneCount}/{actions.length}</b>
              <span>액션 완료</span>
            </div>
          </div>
        </div>

        <div className="mb-scroll">
          {screen === "input" && (
            <ScreenInput onSave={handleSave} recent={meetings} onOpenMeeting={setModalMeeting} />
          )}
          {screen === "search" && (
            <ScreenSearch onOpenMeeting={setModalMeeting} />
          )}
          {screen === "board" && (
            <ScreenBoard actions={actions} onCycle={cycle} onOpenMeeting={setModalMeeting} />
          )}
          {screen === "dashboard" && (
            <ScreenDashboard meetings={meetings} actions={actions} />
          )}
        </div>
      </div>

      <MeetingModal meeting={modalMeeting} onClose={() => setModalMeeting(null)} />
      <Toast show={toast.show} message={toast.msg} />
    </div>
  );
}

window.App = App;
