/* 회의록 브레인 — 공용 컴포넌트 (전역 노출) */
const DS = window.CalComDesignSystem_436c9d;
const { Avatar } = DS;
const D = window.MB_DATA;

/* ---------- 인라인 아이콘 (Lucide 스타일 스트로크) ---------- */
const ICON_PATHS = {
  "file-plus": '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/><path d="M12 12v6"/><path d="M9 15h6"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  gantt: '<path d="M8 6h10"/><path d="M6 12h9"/><path d="M11 18h7"/><path d="M3 4v16"/>',
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  "bar-chart": '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12.5" y="7" width="3" height="10" rx="1"/><rect x="18" y="13" width="3" height="4" rx="1"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  send: '<path d="M14.5 9.5 21 3m0 0-6.5 18-4-9-9-4z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M16 2.5v4"/><path d="M8 2.5v4"/><path d="M3 10h18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  "file-text": '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h6"/>',
  sparkle: '<path d="M12 3l1.6 4.8L18 9.4l-4.4 1.6L12 16l-1.6-5L6 9.4l4.4-1.6z"/><path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9z"/>',
  link: '<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 0 1 0 10h-2"/><path d="M8 12h8"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  "wifi-off": '<line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/>',
};

function Icon({ name, size = 18, style, strokeWidth = 2 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || "" }}
    />
  );
}

/* ---------- **bold** → 하이라이트 변환 ---------- */
function renderRich(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <span key={i} className="mb-hl">{p.slice(2, -2)}</span>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

/* ---------- 상태 배지 ---------- */
function StatusBadge({ status }) {
  const s = D.STATUS[status];
  return (
    <span className="mb-status" style={{ color: s.color }}>
      <span className="dot" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

/* ---------- 진행률 바 ---------- */
function ProgressBar({ value, color = "var(--mb-blue)", height = 7 }) {
  return (
    <div className="mb-bar-track" style={{ height }}>
      <div className="mb-bar-fill" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    </div>
  );
}

/* ---------- 출처 칩 ---------- */
function SourceChip({ meetingId, onClick }) {
  // 시드 출처: 회의 id 문자열 / 백엔드 출처: {title, date} 객체 둘 다 지원
  let m;
  if (meetingId && typeof meetingId === "object") {
    m = {
      title: meetingId.title,
      date: meetingId.date || meetingId.meeting_date || "",
      summary: [], decisions: [], attendees: [], tags: [],
    };
  } else {
    m = D.meetingById(meetingId);
  }
  if (!m || !m.title) return null;
  return (
    <button className="mb-chip click" onClick={() => onClick && onClick(m)}>
      <Icon name="file-text" size={13} style={{ color: "var(--mb-blue)" }} />
      <span style={{ color: "var(--cal-ink)" }}>{m.title}</span>
      {m.date && <span className="mb-chip-date mono">{m.date}</span>}
    </button>
  );
}

/* ---------- 교차점검 콜아웃 ---------- */
function Crosscheck({ note, a, b, onOpenMeeting }) {
  // a/b: 시드 출처는 회의 id 문자열, 백엔드 출처는 {title, date} 객체 둘 다 지원
  const resolve = (x) => (x && typeof x === "object") ? x : D.meetingById(x);
  const ma = resolve(a);
  const mb = resolve(b);
  return (
    <div className="mb-crosscheck mb-rise">
      <span className="mb-crosscheck-icon"><Icon name="alert" size={20} /></span>
      <div style={{ minWidth: 0 }}>
        <p className="mb-crosscheck-title">⚠️ 과거 결정 교차점검</p>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--cal-body)" }}>{note}</p>
        {(ma || mb) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
            {ma && <SourceChip meetingId={a} onClick={onOpenMeeting} />}
            {mb && <SourceChip meetingId={b} onClick={onOpenMeeting} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 빈 상태 ---------- */
function EmptyState({ icon = "inbox", title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "54px 20px", color: "var(--cal-muted)" }}>
      <div style={{ width: 54, height: 54, borderRadius: 14, background: "var(--cal-surface-card)", border: "1px solid var(--cal-hairline)", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "var(--cal-muted)" }}>
        <Icon name={icon} size={24} />
      </div>
      <p className="mb-title" style={{ fontSize: 16, marginBottom: 6 }}>{title}</p>
      {sub && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, maxWidth: 360, marginInline: "auto" }}>{sub}</p>}
    </div>
  );
}

/* ---------- 회의록 상세 모달 ---------- */
function MeetingModal({ meeting, onClose }) {
  if (!meeting) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)", zIndex: 120, display: "grid", placeItems: "center", padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mb-panel mb-rise"
        style={{ width: "min(560px, 100%)", maxHeight: "84vh", overflowY: "auto", background: "var(--mb-elev)" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "22px 22px 0" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {meeting.tags && meeting.tags.map((t) => (
                <span key={t} className="mb-chip" style={{ padding: "3px 9px", fontSize: 11.5 }}>{t}</span>
              ))}
            </div>
            <h3 className="mb-display mb-h2">{meeting.title}</h3>
            <p className="mono" style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--cal-muted)" }}>
              {meeting.date} · 참석 {meeting.attendees.join(", ")}
            </p>
          </div>
          <button onClick={onClose} className="mb-chip click" style={{ padding: 8, borderRadius: 9 }} aria-label="닫기">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <ModalBlock label="요약" items={meeting.summary} />
          <ModalBlock label="결정사항" items={meeting.decisions} accent />
        </div>
      </div>
    </div>
  );
}
function ModalBlock({ label, items, accent }) {
  return (
    <div>
      <p className="mb-section-eyebrow" style={{ marginBottom: 10 }}>{label}</p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.6, color: "var(--cal-body)" }}>
            <span style={{ marginTop: 7, width: 6, height: 6, borderRadius: 2, flexShrink: 0, background: accent ? "var(--mb-green)" : "var(--cal-muted-soft)", transform: accent ? "rotate(45deg)" : "none" }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- 토스트 ---------- */
function Toast({ show, message }) {
  return (
    <div className={"mb-toast" + (show ? " show" : "")}>
      <Icon name="check-circle" size={17} style={{ color: "var(--mb-green)" }} />
      {message}
    </div>
  );
}

/* ---------- 검색 결과 카드 (갤러리·외부 재사용용) ---------- */
function SearchResult({ res, onOpenMeeting }) {
  return (
    <div className="mb-rise" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
      {res.crossCheck && (
        <Crosscheck note={res.crossCheck.note} a={res.crossCheck.a} b={res.crossCheck.b} onOpenMeeting={onOpenMeeting} />
      )}
    </div>
  );
}

/* ---------- 오류 알림 배너 ---------- */
const _ERR_META = {
  "no-claude": { icon: "alert",    title: "CLOVA API 키가 설정되지 않았습니다", sub: "서버의 .env 파일에 CLOVA_API_KEY를 설정해 주세요.", retry: false },
  timeout:     { icon: "clock",    title: "응답 시간이 초과됐습니다",           sub: "다시 시도해 주세요.",                                retry: true  },
  network:     { icon: "wifi-off", title: "네트워크에 연결할 수 없습니다",      sub: "인터넷 연결을 확인하고 다시 시도해 주세요.",          retry: true  },
};
function ErrorNotice({ code, onRetry }) {
  const { Button } = window.CalComDesignSystem_436c9d;
  const meta = _ERR_META[code] || _ERR_META.network;
  return (
    <div className="mb-panel mb-panel-pad"
      style={{ borderColor: "rgba(248,113,113,0.5)", background: "rgba(248,113,113,0.07)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ color: "var(--cal-error)", flexShrink: 0, marginTop: 2 }}>
          <Icon name={meta.icon} size={18} />
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--cal-error)" }}>{meta.title}</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--cal-muted)", lineHeight: 1.5 }}>{meta.sub}</p>
          {meta.retry && onRetry && (
            <div style={{ marginTop: 12 }}>
              <Button variant="primary" size="sm" onClick={onRetry}
                iconLeft={<Icon name="refresh" size={14} />}>다시 시도</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, renderRich, StatusBadge, ProgressBar, SourceChip, Crosscheck, EmptyState, MeetingModal, Toast,
  SearchResult, ErrorNotice,
});
