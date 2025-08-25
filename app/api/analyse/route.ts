import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { title = "", text = "", context = "" } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const system = `Respond with ONLY valid JSON.
Keys: {"tldr": string, "pros": string[], "cons": string[], "risks": string[], "recommendation": string }.
British English. Be concise and specific. Use "Not specified" if unknown.`;

    const user = `Context: ${context || "Not specified"}
Title: ${title || "Not specified"}
DOCUMENT:
${text.slice(0, 12000)}

TASK:
1) TL;DR (3–5 lines)
2) Pros: 3 bullets
3) Cons: 3 bullets
4) Risks: 2 bullets
5) Recommendation: 1–2 lines
Return JSON only.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return NextResponse.json({
        tldr: "Service temporarily unavailable.",
        pros: [], cons: [], risks: ["Not specified"],
        recommendation: "Retry shortly.",
        debug: `Upstream ${r.status}: ${errTxt.slice(0,300)}`
      }, { status: 200 });
    }

    const j = await r.json();
    const content = j?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);

    return NextResponse.json({
      tldr: parsed.tldr ?? "Summary unavailable.",
      pros: Array.isArray(parsed.pros) ? parsed.pros : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      recommendation: parsed.recommendation ?? "Not specified.",
    });
  } catch (e: any) {
    return NextResponse.json({
      tldr: "Service unavailable. Try again later.",
      pros: [], cons: [], risks: ["Not specified"],
      recommendation: "Pause and request clarification.",
      debug: String(e?.message ?? e),
    }, { status: 200 });
  }
}