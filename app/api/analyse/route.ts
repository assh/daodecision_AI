import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyseResult = {
  tldr: string;
  pros: string[];
  cons: string[];
  risks: string[];
  recommendation: string;
};

type OpenAIMessage = { role: "system" | "user" | "assistant"; content: string };
type OpenAIChoice = { index: number; message: OpenAIMessage; finish_reason?: string };
type OpenAIResponse = { choices?: OpenAIChoice[] };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { title?: string; text?: string; context?: string };
    const title = body.title ?? "";
    const text = body.text ?? "";
    const context = body.context ?? "";

    if (!text.trim()) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const system =
      'Respond with ONLY valid JSON. Keys: {"tldr": string, "pros": string[], "cons": string[], "risks": string[], "recommendation": string }. British English. Be concise and specific. Use "Not specified" if unknown.';

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
          { role: "system", content: system } as OpenAIMessage,
          { role: "user", content: user } as OpenAIMessage,
        ],
      }),
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return NextResponse.json(
        {
          tldr: "Service temporarily unavailable.",
          pros: [],
          cons: [],
          risks: ["Not specified"],
          recommendation: "Retry shortly.",
          debug: `Upstream ${r.status}: ${errTxt.slice(0, 300)}`,
        } as AnalyseResult & { debug: string },
        { status: 200 }
      );
    }

    const j = (await r.json()) as OpenAIResponse;
    const content = j.choices?.[0]?.message?.content ?? "{}";

    let parsed: Partial<AnalyseResult> = {};
    try {
      parsed = JSON.parse(content) as Partial<AnalyseResult>;
    } catch {
      // fall through to defaults below
    }

    const out: AnalyseResult = {
      tldr: parsed.tldr ?? "Summary unavailable.",
      pros: Array.isArray(parsed.pros) ? parsed.pros : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      recommendation: parsed.recommendation ?? "Not specified.",
    };

    return NextResponse.json(out);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        tldr: "Service unavailable. Try again later.",
        pros: [],
        cons: [],
        risks: ["Not specified"],
        recommendation: "Pause and request clarification.",
        debug: msg,
      } as AnalyseResult & { debug: string },
      { status: 200 }
    );
  }
}