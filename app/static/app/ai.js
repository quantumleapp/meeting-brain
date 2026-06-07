/* 회의록 브레인 — AI 클라이언트 (FastAPI 백엔드 연결) */
(function () {
  const _source = "ai";

  async function _post(path, body) {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const status = r.status;
      if (status === 401 || status === 403) throw new Error("no-claude");
      if (status === 504 || status === 408) throw new Error("timeout");
      throw new Error("network");
    }
    return r.json();
  }

  const MB_AI = {
    async extractMeeting(title, date, attendees, rawText) {
      const data = await _post("/meetings", {
        title,
        meeting_date: date || null,
        attendees: attendees || null,
        raw_text: rawText,
      });
      return { ...data, _source };
    },

    async ragSearch(question) {
      const data = await _post("/ask", { question });
      return { ...data, _source };
    },
  };

  window.MB_AI = MB_AI;
})();
