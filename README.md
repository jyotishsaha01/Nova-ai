# Nova

Nova is a standalone multi-model AI workspace. It keeps conversations, research tools, and a private RAG library in one interface, with Gemini, Groq, OpenRouter, and Cloudflare Workers AI as selectable providers.

## Run locally

```sh
npm install
cp .env.example .env
# Add the provider keys you want to use to .env
npm run dev
```

By default the standalone Nova server runs at `http://localhost:3002` so it can coexist with the previous app on port 3000.

## Deploy to Vercel

Nova uses Vite for the interface and an Express API for model calls. The API is exposed to Vercel as a serverless function; provider credentials must be added in **Vercel → Project Settings → Environment Variables** for the Production environment (and Preview if desired). Add only the provider keys you intend to use:

- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`
- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
- `APP_URL` (optional; set this to the deployed app URL for OpenRouter attribution)

Never commit `.env`. `.env.example` contains empty placeholders only. The app can be deployed without credentials, but AI requests require at least one configured provider. Vercel's SPA rewrite keeps client-side routes working.

The server can route a request to the selected provider and try other configured providers if the selected endpoint rejects the request before streaming begins. Provider credentials stay server-side. Configure these in `.env` locally and in the deployment host's secret manager in production:

- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`
- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

The settings panel lets the user select a provider and model, and set an output ceiling up to 32K tokens. This controls maximum generated output per response; it does not combine provider context windows into one enormous context or make provider quotas unlimited. Each provider's rate limits, pricing, model caps, and free-tier policies still apply.

RAG uses Cloudflare embeddings when configured, Gemini embeddings when available, and deterministic local feature vectors as a no-key fallback. Nova writes authenticated conversations to the `novaSessions` Firestore subcollection so they are separate from the legacy app's `sessions` collection.

The copied Firebase web configuration currently points to the existing Firebase project for development continuity. Create a separate Firebase app/database and replace that config before treating Nova as a fully separate production service.
