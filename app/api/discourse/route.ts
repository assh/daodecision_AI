import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DiscoursePost = { cooked?: string };
type DiscourseTopic = {
  title?: string;
  post_stream?: { posts?: DiscoursePost[] };
};

// GET /api/discourse?base=https://meta.discourse.org&topic=12345
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const baseRaw = searchParams.get("base") || "";
  const topicId = searchParams.get("topic");

  const base = baseRaw.replace(/\/+$/, "");

  if (!base || !topicId) {
    return NextResponse.json({ error: "Missing base or topic id" }, { status: 400 });
  }

  try {
    const r = await fetch(`${base}/t/${topicId}.json`, { cache: "no-store" });
    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({ error: `Discourse upstream ${r.status}`, debug: txt.slice(0, 300) }, { status: 500 });
    }

    const j = (await r.json()) as DiscourseTopic;
    const title = j?.title ?? "";
    const firstPostHtml = j?.post_stream?.posts?.[0]?.cooked ?? "";
    const textOnly = stripHtml(firstPostHtml);

    return NextResponse.json({ title, text: textOnly });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Discourse fetch failed", debug: msg }, { status: 500 });
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}