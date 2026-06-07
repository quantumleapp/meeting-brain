/* =====================================================================
   회의록 브레인 — 시드 데이터 (전부 가상 팀 시나리오 / 실존 인물 아님)
   window.MB_DATA 로 전역 노출. 바닐라 JS.
   ===================================================================== */
(function () {
  // 가상 팀원
  const PEOPLE = [
    { id: "u1", name: "김하늘", color: "violet" },
    { id: "u2", name: "이도현", color: "orange" },
    { id: "u3", name: "정유진", color: "pink" },
    { id: "u4", name: "박서준", color: "emerald" },
    { id: "u5", name: "최민서", color: "violet" },
    { id: "u6", name: "한지우", color: "orange" },
  ];
  const byName = (n) => PEOPLE.find((p) => p.name === n) || { name: n };

  // 회의록 (가상)
  const MEETINGS = [
    {
      id: "m1",
      title: "강남 팝업 이벤트 기획 회의",
      date: "2026-01-08",
      attendees: ["김하늘", "이도현", "정유진"],
      summary: [
        "2월 강남 팝업스토어 운영 방향을 확정하기 위한 첫 기획 회의.",
        "메인 컨셉은 '도심 속 휴식'으로 정하고 2주 운영을 목표로 함.",
      ],
      decisions: [
        "운영 기간은 2주(2/10~2/23)로 확정",
        "메인 컨셉 '도심 속 휴식' 채택",
        "굿즈는 한정 수량으로 선발주",
      ],
      tags: ["이벤트", "팝업"],
    },
    {
      id: "m2",
      title: "신제품 출시 전략 회의",
      date: "2026-01-22",
      attendees: ["박서준", "최민서", "김하늘"],
      summary: [
        "봄 신제품 라인의 출시 전략과 가격 정책을 논의.",
        "사전예약은 자사몰 우선으로 진행하기로 함.",
      ],
      decisions: [
        "출시일은 3월 중순으로 확정",
        "가격 정책은 '중가 포지셔닝'으로 결정",
        "사전예약 채널은 자사몰 우선",
      ],
      tags: ["신제품", "전략", "가격"],
    },
    {
      id: "m3",
      title: "1분기 마케팅 예산 배분 회의",
      date: "2026-02-05",
      attendees: ["정유진", "박서준", "한지우"],
      summary: [
        "1분기 마케팅 예산을 채널별로 배분.",
        "인플루언서 비중을 전 분기 대비 확대하기로 합의.",
      ],
      decisions: [
        "디지털 : 오프라인 = 6 : 4 비율로 배분",
        "인플루언서 마케팅 비중 확대",
      ],
      tags: ["마케팅", "예산"],
    },
    {
      id: "m4",
      title: "신제품 출시 점검 회의",
      date: "2026-02-19",
      attendees: ["박서준", "최민서", "김하늘", "한지우"],
      summary: [
        "출시 D-30 점검. 사전예약 전환율을 끌어올리기 위한 보완책 논의.",
        "가격 정책을 일부 수정해 사전예약 한정 혜택을 추가.",
      ],
      decisions: [
        "사전예약가에 한해 10% 추가 할인 적용",
        "할인 쿠폰은 출시 2주 전 오픈",
      ],
      tags: ["신제품", "가격"],
      conflict: {
        with: "m2",
        note: "1/22 회의의 '중가 포지셔닝' 결정과 가격 방향이 일부 어긋남 — 사전예약 한정 10% 할인이 추가됨.",
      },
    },
    {
      id: "m5",
      title: "팝업 운영 리뷰 회의",
      date: "2026-03-12",
      attendees: ["김하늘", "이도현", "정유진"],
      summary: [
        "강남 팝업 2주 운영 결과 회고.",
        "방문객 대비 굿즈 소진율이 예상보다 높았음.",
      ],
      decisions: ["굿즈 차기 발주는 1.5배 수량으로 상향", "팝업 데이터는 리포트로 정리"],
      tags: ["이벤트", "회고"],
    },
    {
      id: "m6",
      title: "2분기 로드맵 킥오프",
      date: "2026-04-02",
      attendees: ["김하늘", "이도현", "정유진", "박서준", "최민서", "한지우"],
      summary: [
        "2분기 제품/마케팅 로드맵 방향을 정렬.",
        "디자인 시스템 정비를 분기 과제로 포함.",
      ],
      decisions: ["2분기 핵심 과제 3개 선정", "디자인 시스템 정비 착수"],
      tags: ["로드맵", "킥오프"],
    },
  ];

  // 액션 (간트) — status: planned(예정) / progress(진행) / done(완료)
  const ACTIONS = [
    { id: "a1", title: "부스 디자인 시안", owner: "이도현", start: "2026-01-10", end: "2026-01-24", status: "done", meeting: "m1" },
    { id: "a2", title: "인플루언서 섭외", owner: "정유진", start: "2026-01-12", end: "2026-02-02", status: "done", meeting: "m1" },
    { id: "a3", title: "굿즈 선발주", owner: "김하늘", start: "2026-01-15", end: "2026-01-28", status: "done", meeting: "m1" },
    { id: "a4", title: "가격표 확정", owner: "박서준", start: "2026-01-24", end: "2026-02-04", status: "done", meeting: "m2" },
    { id: "a5", title: "랜딩페이지 제작", owner: "최민서", start: "2026-01-26", end: "2026-02-16", status: "progress", meeting: "m2" },
    { id: "a6", title: "채널별 KPI 설정", owner: "한지우", start: "2026-02-06", end: "2026-02-16", status: "done", meeting: "m3" },
    { id: "a7", title: "광고 소재 제작", owner: "정유진", start: "2026-02-08", end: "2026-02-28", status: "progress", meeting: "m3" },
    { id: "a8", title: "사전예약 오픈", owner: "김하늘", start: "2026-02-10", end: "2026-02-22", status: "progress", meeting: "m2" },
    { id: "a9", title: "할인 쿠폰 세팅", owner: "최민서", start: "2026-02-20", end: "2026-02-27", status: "planned", meeting: "m4" },
    { id: "a10", title: "CS 스크립트 작성", owner: "한지우", start: "2026-02-21", end: "2026-03-02", status: "planned", meeting: "m4" },
    { id: "a11", title: "디자인 시스템 정비", owner: "이도현", start: "2026-04-03", end: "2026-04-24", status: "planned", meeting: "m6" },
    { id: "a12", title: "로드맵 초안", owner: "박서준", start: "2026-04-03", end: "2026-04-17", status: "planned", meeting: "m6" },
  ];

  // 누적 대시보드 — 연도별 회의록 건수 (가상)
  const YEARLY = [
    { year: "2022", count: 6 },
    { year: "2023", count: 14 },
    { year: "2024", count: 33 },
    { year: "2025", count: 58 },
    { year: "2026", count: 24 },
  ];

  // 입력 화면 "예시 채우기"용 원문 (가상)
  const SAMPLE_NOTE = `[신제품 출시 점검 회의]
일시: 2026-02-19 / 참석: 박서준, 최민서, 김하늘, 한지우

- 출시 D-30 기준으로 사전예약 현황 점검함. 현재 전환율이 목표 대비 낮음.
- 박서준: 가격은 1월에 정한 중가 포지셔닝 유지하되, 사전예약 고객에 한해 혜택을 더 주자는 의견.
- 최민서: 사전예약가에 10% 추가 할인 쿠폰을 붙이는 방안 제안. 다들 동의.
- 결정: 사전예약 한정 10% 추가 할인 적용. 쿠폰은 출시 2주 전 오픈.
- 액션: 최민서 - 할인 쿠폰 세팅(2/20~2/27), 한지우 - CS 스크립트 작성(2/21~3/2).`;

  // 예시 추출 결과 (위 원문에 대응 — 실제 호출 실패 시 폴백)
  const SAMPLE_EXTRACTION = {
    title: "신제품 출시 점검 회의",
    date: "2026-02-19",
    attendees: ["박서준", "최민서", "김하늘", "한지우"],
    summary: [
      "출시 D-30 점검 회의. 사전예약 전환율이 목표보다 낮아 보완책을 논의함.",
      "가격은 중가 포지셔닝을 유지하되 사전예약 고객 한정 혜택을 추가하기로 함.",
    ],
    decisions: ["사전예약가 한정 10% 추가 할인 적용", "할인 쿠폰은 출시 2주 전 오픈"],
    actions: [
      { title: "할인 쿠폰 세팅", owner: "최민서", start: "2026-02-20", end: "2026-02-27" },
      { title: "CS 스크립트 작성", owner: "한지우", start: "2026-02-21", end: "2026-03-02" },
    ],
  };

  // RAG 예시 질문 + 폴백 답변
  const SAMPLE_QUESTIONS = [
    "신제품 가격은 어떻게 결정했지?",
    "팝업 운영 기간이 며칠이었더라?",
    "1분기 마케팅 예산은 어떻게 나눴어?",
  ];

  // 키워드 기반 폴백 RAG (실제 호출 실패 시)
  function fallbackRAG(q) {
    const text = (q || "").toLowerCase();
    if (/가격|할인|포지셔닝|price/.test(text)) {
      return {
        answer:
          "신제품 가격은 1월 22일 '신제품 출시 전략 회의'에서 **중가 포지셔닝**으로 결정됐습니다. 이후 2월 19일 '신제품 출시 점검 회의'에서 사전예약 고객에 한해 **10% 추가 할인**을 적용하기로 보완 결정했습니다.",
        highlights: ["중가 포지셔닝", "10% 추가 할인"],
        sources: ["m2", "m4"],
        crossCheck: {
          note: "두 회의의 가격 결정이 다릅니다. 1/22에는 '중가 포지셔닝'을 정했지만, 2/19에 사전예약 한정 10% 할인이 추가됐습니다. 최종 정책 확정 시 두 결정을 함께 확인하세요.",
          a: "m2",
          b: "m4",
        },
      };
    }
    if (/팝업|운영|기간|이벤트/.test(text)) {
      return {
        answer:
          "강남 팝업은 1월 8일 기획 회의에서 **2주 운영(2/10~2/23)**으로 확정됐습니다. 3월 12일 리뷰 회의에서 굿즈 소진율이 예상보다 높아 차기 발주를 1.5배로 상향하기로 했습니다.",
        highlights: ["2주 운영(2/10~2/23)"],
        sources: ["m1", "m5"],
        crossCheck: null,
      };
    }
    if (/예산|마케팅|배분|비율/.test(text)) {
      return {
        answer:
          "1분기 마케팅 예산은 2월 5일 회의에서 **디지털 : 오프라인 = 6 : 4**로 배분하기로 했고, 인플루언서 비중을 확대했습니다.",
        highlights: ["디지털 : 오프라인 = 6 : 4"],
        sources: ["m3"],
        crossCheck: null,
      };
    }
    return {
      answer:
        "관련된 과거 회의를 찾아 요약했습니다. 더 구체적으로 질문하시면(예: '신제품 가격', '팝업 기간') 출처와 함께 정확히 답해 드립니다.",
      highlights: [],
      sources: ["m2", "m1"],
      crossCheck: null,
    };
  }

  window.MB_DATA = {
    PEOPLE,
    byName,
    MEETINGS,
    ACTIONS,
    YEARLY,
    SAMPLE_NOTE,
    SAMPLE_EXTRACTION,
    SAMPLE_QUESTIONS,
    fallbackRAG,
    meetingById: (id) => MEETINGS.find((m) => m.id === id),
    STATUS: {
      planned: { key: "planned", label: "예정", color: "var(--mb-status-planned)" },
      progress: { key: "progress", label: "진행", color: "var(--mb-status-progress)" },
      done: { key: "done", label: "완료", color: "var(--mb-status-done)" },
    },
    STATUS_CYCLE: { planned: "progress", progress: "done", done: "planned" },
  };
})();
