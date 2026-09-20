# ATScore

Upload a resume and paste a job description → get an instant ATS
compatibility score, matched/missing keywords, and specific rewrite
suggestions.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS**
- **NextAuth** (credentials provider, JWT sessions)
- **Prisma** — SQLite for local dev, swap to Postgres (Neon/Supabase) for prod
- **pdf-parse** / **mammoth** — resume text extraction (.pdf / .docx / .txt)
- Optional: OpenAI API for sharper rewrite suggestions — the app works fully
  without a key (rule-based scoring/suggestions only)

## How scoring works

`lib/scoring.ts` extracts significant keywords from the job description
(a curated tech/professional skill list plus frequency-ranked terms/phrases),
then checks which ones appear in the resume text. Score = matched / total
keywords. No LLM is required for this — it's deterministic and free to run.
If `OPENAI_API_KEY` is set, `lib/ai.ts` adds a few extra context-aware
suggestions on top.

## Local setup

```bash
npm install
cp .env.example .env
# generate a real value: openssl rand -base64 32
# put it in NEXTAUTH_SECRET in .env

npx prisma generate
npx prisma migrate dev --name init

npm run dev
```

Note: `prisma generate` downloads engine binaries from
`binaries.prisma.sh`. If you're behind a restrictive proxy/firewall, allow
that host, or run this step somewhere with normal internet access before
copying `node_modules` over.

## Deploying (Vercel + Neon, free tier)

1. Push this repo, import it into Vercel.
2. Create a free Postgres DB on Neon (or Supabase), copy the connection
   string into `DATABASE_URL` in Vercel's project env vars.
3. In `prisma/schema.prisma`, change `provider = "sqlite"` to
   `provider = "postgresql"`.
4. Set `NEXTAUTH_URL` to your deployed domain and `NEXTAUTH_SECRET` to a
   generated secret in Vercel env vars.
5. Deploy. Vercel runs `prisma generate` automatically via the `postinstall`
   script already in `package.json`.

## Known items / roadmap

- `npm audit`: one moderate/high advisory in `postcss`, bundled as a
  transitive dependency *inside* Next.js's own `node_modules` — not
  independently upgradable without a Next 16 major bump. Low real-world risk
  for this app (no user-supplied CSS processing).
- No payments/plan gating yet — `ResumeScan` history is free and unlimited.
  A Stripe-metered tier (e.g. free = 3 scans/month) is the natural next step.
- Scoring is keyword-based, not semantic — synonyms ("JS" vs "JavaScript")
  aren't matched unless both are in `SKILL_HINTS` in `lib/scoring.ts`. A
  fast follow would be embedding-based similarity for near-miss terms.
- No password reset flow yet (credentials auth only, no email provider wired
  up).
- No file size/type validation ceiling on uploads yet — add a max size check
  in `app/api/scan/route.ts` before production traffic.
