# DAO Decision Dashboard

A web application that converts DAO governance proposals into decision-ready summaries. Users can paste a proposal or import from Snapshot or Discourse forums, then receive a structured analysis including TL;DR, Pros, Cons, Risks, and a Recommendation.

---
## Live Demo

The live demo is hosted on Netlify at https://daodecision.asishpanda.com/ . I have updated the domain name to make the url more trustable and easy to remember at a glance.

## Why

DAO governance is often opaque and inefficient. Proposals are long, written in varying styles and scattered across multiple platforms. Delegates and voters lack time to parse every document thoroughly, leading to rushed or uninformed decisions. This project addresses that gap by providing a consistent, rapid way to transform any proposal into a concise, structured decision brief.

---

## What

The dashboard provides three core functions:

1. **Proposal ingestion**

   - Manual paste of any text document.
   - Import from **Snapshot** via space name or direct proposal URL.
   - Import from **Discourse forums** via topic ID.

2. **AI-driven analysis**

   - Summarisation through OpenAI API with strict JSON schema enforcement.
   - Output includes TL;DR, Pros, Cons, Risks, and Recommendation.
   - Analysis designed to be concise, transparent, and repeatable.

3. **Decision pack output**
   - Results displayed in a card-based UI.
   - Copy-to-clipboard and download-as-text options for reuse.
   - No persistence; data is analysed on demand and discarded.

---

## Who

The tool is designed for:

- DAO members and token holders who need quick clarity on votes.
- Delegates who must review large volumes of proposals.
- Community managers and analysts preparing digests for wider audiences.

---

## How

### Architecture

- **Frontend**: Next.js (App Router) with TypeScript.
- **Backend**: Serverless API routes on Netlify.
- **AI Integration**: OpenAI GPT model (4o-mini) using response format set to JSON for reliability.
- **External Sources**:
  - Snapshot GraphQL API (proposals by space or proposal URL).
  - Discourse forum API (topic JSON, stripped of HTML).

### Workflow

1. Scaffolded a Next.js application and added a serverless API for AI analysis.
2. Built a card-based interface for summarisation results.
3. Integrated Snapshot import (initially by space, later by proposal URL).
4. Added Discourse import for first-post topic content.
5. Implemented loaders, toasts, copy/download actions for polish.
6. Deployed to Vercel/Netlify with environment-based API key management.

### Technical Notes

- Error handling ensures graceful degradation if APIs fail.
- Summarisation prompt engineered to produce concise, schema-compliant results.
- All analysis is stateless; no data stored.
- TypeScript interfaces used for safety, replacing `any` types.

### Future Work

- Wallet connect and token gating can be layered over imports.
- Proposal discussion sentiment analysis.
- Scheduled digests of active votes.
- Comparison of multiple proposals.
- Retrieval-augmented generation for cross-proposal memory.

---

## Setup

### Requirements

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/assh/daodecision_AI
cd daodecision_AI
npm install
echo "OPENAI_API_KEY=sk-xxxx...." > .env.local
npm run dev
```

### Testing Procedure

The Dao Dashbaord is prefilled with an example proposal and can be analysed as soon as the website has loaded. A list of public DAO proposals have been provided below to help the user test the import functionality from public forums.

1. Snapshot spaces

- arbitrumfoundation.eth
- balancer.eth

2. Snapshot URL

- https://snapshot.box/#/s:arbitrumfoundation.eth/proposal/0x45513bb63946582432afa7213bcb2677e877dabbd5722210efd5eaf45797031c
- https://snapshot.box/#/s:balancer.eth/proposal/0x9c6b8036203f996f7f991de0ef57ee254623dd776525ce1772fcb1f3f19f4e70

3. Discourse

- https://stargate.discourse.group/ topic id:682
- https://meta.discourse.org/ topic id:373574
