"use client";
import { useEffect, useRef, useState } from "react";

type Result = {
  tldr: string;
  pros: string[];
  cons: string[];
  risks: string[];
  recommendation: string;
};

type SnapshotSpace = { id: string; name?: string };
type SnapshotProposal = {
  id: string;
  title: string;
  body: string;
  author: string;
  start: number;
  end: number;
  state: string;
  link: string;
  space?: SnapshotSpace;
  choices?: string[];
  created?: number;
  scores_state?: string;
};

type DiscourseImport = { title: string; text: string };

export default function Page() {
  // Analyser state
  const [title, setTitle] = useState("");
  const [context, setContext] = useState(
    "DAO: ExampleDAO • Treasury: Not specified • Vote window: Not specified"
  );
  const [text, setText] = useState(sampleProposal.trim());
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const live = useRef<HTMLDivElement>(null);

  // Snapshot (smart) state — accepts space or full proposal URL
  const [snapInput, setSnapInput] = useState("uniswap");
  const [snapLimit, setSnapLimit] = useState(5);
  const [importingSnap, setImportingSnap] = useState(false);

  // Discourse state
  const [discourseBase, setDiscourseBase] = useState(
    "https://meta.discourse.org"
  );
  const [topicId, setTopicId] = useState("");
  const [importingDisc, setImportingDisc] = useState(false);

  useEffect(() => {
    if (live.current && (res || err)) {
      live.current.textContent = err ? `Error: ${err}` : "Analysis complete";
    }
  }, [res, err]);

  // Helpers
  function looksLikeUrl(s: string) {
    return /^https?:\/\//i.test(s.trim());
  }
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }
  function smoothScrollTo(id: string) {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function formatForCopy(r: Result) {
    return `TL;DR
${r.tldr}

Pros
- ${r.pros?.join("\n- ")}

Cons
- ${r.cons?.join("\n- ")}

Risks
- ${r.risks?.join("\n- ")}

Recommendation
${r.recommendation}`;
  }
  function downloadTxt(name: string, content: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Actions
  async function analyse() {
    setErr(null);
    setRes(null);
    setLoading(true);
    try {
      const r = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text, context }),
      });
      const j = (await r.json()) as Result | { error?: string };
      if (r.status >= 400 || "error" in j)
        throw new Error(("error" in j && j.error) || "Service error");
      setRes(j as Result);
      smoothScrollTo("#results");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle("");
    setContext(
      "DAO: ExampleDAO • Treasury: Not specified • Vote window: Not specified"
    );
    setText("");
    setRes(null);
    setErr(null);
  }

  function copySummary() {
    if (!res) return;
    navigator.clipboard
      .writeText(formatForCopy(res))
      .then(() => showToast("Summary copied"));
  }

  // Snapshot import (smart: space OR proposal URL)
  async function importFromSnapshotSmart() {
    setImportingSnap(true);
    try {
      const val = snapInput.trim();
      const qs = looksLikeUrl(val)
        ? `url=${encodeURIComponent(val)}`
        : `space=${encodeURIComponent(val)}&limit=${snapLimit}&state=all`;

      const r = await fetch(`/api/snapshot?${qs}`);
      const j = (await r.json()) as {
        error?: string;
        proposals?: SnapshotProposal[];
      };
      if (!r.ok || j.error) throw new Error(j.error || "Snapshot fetch error");

      const proposals = j.proposals ?? [];
      if (!proposals.length) {
        alert("No proposals found.");
        return;
      }

      let chosen: SnapshotProposal = proposals[0];
      if (proposals.length > 1) {
        const titles = proposals
          .map((p, i) => `${i + 1}. ${p.title} (${p.space?.id})`)
          .join("\n");
        const idxStr = prompt(
          `Select a proposal number:\n\n${titles}\n\nEnter 1-${proposals.length}:`
        );
        const idx =
          Math.max(1, Math.min(proposals.length, Number(idxStr || 1))) - 1;
        chosen = proposals[idx];
      }

      const blob = `
Title: ${chosen.title}

Source
- Space: ${chosen.space?.id}
- Link: ${chosen.link}
- Author: ${chosen.author}
- State: ${chosen.state}
- Start (unix): ${chosen.start}
- End (unix): ${chosen.end}

Body
${chosen.body}
`.trim();

      setTitle(chosen.title || "");
      setContext(
        `DAO: ${chosen.space?.id || "Snapshot"} • State: ${
          chosen.state
        } • Link: ${chosen.link}`
      );
      setText(blob);
      showToast("Snapshot proposal imported");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg || "Failed to import from Snapshot.");
    } finally {
      setImportingSnap(false);
    }
  }

  // Discourse import (first post of a topic)
  async function importFromDiscourse() {
    if (!topicId) {
      alert("Enter a Discourse topic ID");
      return;
    }
    setImportingDisc(true);
    try {
      const url = `/api/discourse?base=${encodeURIComponent(
        discourseBase
      )}&topic=${encodeURIComponent(topicId)}`;
      const r = await fetch(url);
      const j = (await r.json()) as {
        error?: string;
      } & Partial<DiscourseImport>;
      if (!r.ok || j.error) throw new Error(j.error || "Discourse fetch error");

      setTitle(j.title || "");
      setContext(`Forum: ${discourseBase} • Topic: ${topicId}`);
      setText(
        `Title: ${j.title}\n\nSource: ${discourseBase}/t/${topicId}\n\nBody\n${j.text}`
      );
      showToast("Discourse topic imported");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg || "Failed to import from Discourse.");
    } finally {
      setImportingDisc(false);
    }
  }

  return (
    <>
      <main>
        {/* a11y live region */}
        <div
          ref={live}
          aria-live="polite"
          style={{ position: "absolute", left: -9999 }}
        />

        {/* Composer */}
        <section className="card">
          <label>Proposal title (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Upgrade validator rewards policy…"
          />

          <label>Context (DAO name, treasury, vote window)</label>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="DAO: ExampleDAO • Treasury: 1.2M DAI • Vote: 7 days"
          />

          <label>Proposal / document</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full text of a proposal, memo, or notes…"
          />

          {/* Snapshot import (smart) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: "8px",
              alignItems: "end",
              marginTop: "10px",
            }}
          >
            <div>
              <label>Snapshot space or proposal URL</label>
              <input
                value={snapInput}
                onChange={(e) => setSnapInput(e.target.value)}
                placeholder="e.g. uniswap  •  or paste https://snapshot.org/#/space/proposal/0x…"
              />
            </div>
            <div>
              <label>Limit</label>
              <input
                type="number"
                min={1}
                max={20}
                value={snapLimit}
                onChange={(e) => setSnapLimit(Number(e.target.value))}
                disabled={looksLikeUrl(snapInput)} // N/A when importing a single URL
              />
            </div>
            <div>
              <label>&nbsp;</label>
              <button
                onClick={importFromSnapshotSmart}
                className="btn btn-outline"
                disabled={importingSnap}
              >
                {importingSnap ? "Importing…" : "Import from Snapshot"}
              </button>
            </div>
          </div>

          {/* Discourse import */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr auto",
              gap: "8px",
              alignItems: "end",
              marginTop: "8px",
            }}
          >
            <div>
              <label>Discourse base URL</label>
              <input
                value={discourseBase}
                onChange={(e) => setDiscourseBase(e.target.value)}
                placeholder="https://forum.bankless.community"
              />
            </div>
            <div>
              <label>Topic ID</label>
              <input
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                placeholder="12345"
              />
            </div>
            <div>
              <label>&nbsp;</label>
              <button
                onClick={importFromDiscourse}
                className="btn btn-outline"
                disabled={importingDisc}
              >
                {importingDisc ? "Importing…" : "Import from Discourse"}
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "10px",
            }}
          >
            <button
              onClick={analyse}
              disabled={loading || !text.trim()}
              className="btn btn-primary"
            >
              {loading ? "Analysing…" : "Analyse"}
            </button>
            <button onClick={resetForm} className="btn btn-ghost">
              Reset
            </button>
            {err && (
              <span
                style={{
                  color: "#fca5a5",
                  fontSize: ".9rem",
                  alignSelf: "center",
                }}
              >
                {err}
              </span>
            )}
          </div>
        </section>

        {/* Results */}
        <div id="results" />

        {loading && <SkeletonPack />}

        {!loading && res && (
          <>
            <Card title="TL;DR">
              <p style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
                {res.tldr}
              </p>
            </Card>

            <div
              style={{
                display: "grid",
                gap: "14px",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              }}
            >
              <ListCard title="Pros" items={res.pros} accent="cyan" />
              <ListCard title="Cons" items={res.cons} accent="rose" />
            </div>

            <ListCard
              title="Key risks & unknowns"
              items={res.risks}
              accent="amber"
            />

            <Card title="Recommendation">
              <p style={{ marginTop: 10 }}>{res.recommendation}</p>
            </Card>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={copySummary} className="btn btn-outline">
                Copy summary
              </button>
              <button
                onClick={() =>
                  downloadTxt("decision-pack.txt", formatForCopy(res))
                }
                className="btn btn-outline"
              >
                Download .txt
              </button>
            </div>
          </>
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}

/* ---------- Components ---------- */
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "color-mix(in oklab, var(--fg) 85%, transparent)",
        }}
      >
        {title}
      </div>
      <div className="rule"></div>
      {children}
    </section>
  );
}

function ListCard({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "cyan" | "rose" | "amber";
}) {
  const color =
    accent === "cyan"
      ? "linear-gradient(90deg, #22d3ee, #60a5fa)"
      : accent === "rose"
      ? "linear-gradient(90deg, #fb7185, #f59e0b)"
      : "linear-gradient(90deg, #fbbf24, #34d399)";
  return (
    <section className="card">
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          background: color,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title}
      </div>
      <div className="rule"></div>
      <ul style={{ marginTop: 10 }}>
        {items?.length ? (
          items.map((x, i) => <li key={i}>{x}</li>)
        ) : (
          <li>Not specified.</li>
        )}
      </ul>
    </section>
  );
}

function SkeletonPack() {
  return (
    <>
      <section className="card">
        <div className="skel skel-line" style={{ width: "30%" }}></div>
        <div className="skel skel-line" style={{ width: "100%" }}></div>
        <div className="skel skel-line" style={{ width: "90%" }}></div>
        <div className="skel skel-line" style={{ width: "80%" }}></div>
      </section>

      <div
        style={{
          display: "grid",
          gap: "14px",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        <section className="card">
          <div className="skel skel-line" style={{ width: "35%" }}></div>
          <div className="skel skel-line" style={{ width: "90%" }}></div>
          <div className="skel skel-line" style={{ width: "85%" }}></div>
          <div className="skel skel-line" style={{ width: "70%" }}></div>
        </section>
        <section className="card">
          <div className="skel skel-line" style={{ width: "35%" }}></div>
          <div className="skel skel-line" style={{ width: "95%" }}></div>
          <div className="skel skel-line" style={{ width: "80%" }}></div>
          <div className="skel skel-line" style={{ width: "65%" }}></div>
        </section>
      </div>
    </>
  );
}

/* ---------- Sample text ---------- */
const sampleProposal = `
Title: Fund a community education programme (10,000 DAI over 6 months)

Objective
Increase Web3 literacy among new members through weekly online workshops and two in-person meetups.

Scope
- Develop a 12-week curriculum
- Pay three mentors a modest stipend
- Provide small learner grants for data/transport

KPIs
- 300 unique attendees
- 60% course completion
- 20 project submissions

Risks/Notes
- Mentor availability
- Attendance drop-off mid-course
`;
