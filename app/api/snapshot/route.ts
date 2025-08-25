import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SNAPSHOT_URL = "https://hub.snapshot.org/graphql";

type SnapshotSpace = { id: string; name?: string };
export type SnapshotProposal = {
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

type SnapshotListResp = { data?: { proposals?: SnapshotProposal[] } };
type SnapshotOneResp = { data?: { proposal?: SnapshotProposal | null } };

const QUERY_LIST = `
  query Proposals($space: [String!], $limit: Int, $state: String) {
    proposals(
      first: $limit,
      where: { space_in: $space, state: $state }
      orderBy: "created",
      orderDirection: desc
    ) {
      id title body author start end state link
      space { id name }
      choices created scores_state
    }
  }
`;

const QUERY_ONE = `
  query Proposal($id: String!) {
    proposal(id: $id) {
      id title body author start end state link
      space { id name }
      choices created scores_state
    }
  }
`;

function extractProposalIdFromUrl(u: string): string | null {
  try {
    const url = new URL(u);
    const hash = url.hash || ""; // "#/space/proposal/0xHASH"
    const m = hash.match(/\/proposal\/([0-9a-zA-Zx]+)/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlParam = searchParams.get("url");
  const space = searchParams.get("space");
  const limit = Number(searchParams.get("limit") || 5);
  const state = searchParams.get("state") || "all";

  try {
    if (urlParam) {
      const id = extractProposalIdFromUrl(urlParam);
      if (!id) return NextResponse.json({ error: "Could not parse proposal id from url" }, { status: 400 });

      const r = await fetch(SNAPSHOT_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: QUERY_ONE, variables: { id } }),
      });

      if (!r.ok) {
        const txt = await r.text();
        return NextResponse.json({ error: `Snapshot upstream ${r.status}`, debug: txt.slice(0, 300) }, { status: 500 });
      }

      const j = (await r.json()) as SnapshotOneResp;
      const p = j?.data?.proposal;
      return NextResponse.json({ proposals: p ? [p] : [] });
    }

    if (!space) {
      return NextResponse.json({ error: "Provide either ?url= or ?space=" }, { status: 400 });
    }

    const r = await fetch(SNAPSHOT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: QUERY_LIST, variables: { space: [space], limit, state } }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({ error: `Snapshot upstream ${r.status}`, debug: txt.slice(0, 300) }, { status: 500 });
    }

    const data = (await r.json()) as SnapshotListResp;
    const proposals = data?.data?.proposals ?? [];
    return NextResponse.json({ proposals });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Snapshot fetch failed", debug: msg }, { status: 500 });
  }
}