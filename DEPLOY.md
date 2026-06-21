# Deploying browsercade

Two pieces deploy independently:

| Piece | Where | Notes |
| --- | --- | --- |
| `web/` (the arcade) | Vercel (static) | Built with Vite `base: /arcade/`. |
| `server/` (multiplayer) | Render (Docker) | See [`server/README.md`](./server/README.md). Already live. |

## Arcade → mounted at `<portfolio>/arcade`

The arcade is served under the **`/arcade`** path of the portfolio domain via a
Vercel rewrite (a "multi-zone" setup), so it feels like part of the site without
merging the two codebases.

### 1. Deploy the arcade (this repo)

- Vercel → **New Project** → import `browsercade`.
- **Root Directory = `web`** (Vercel auto-detects Vite: `npm run build` → `dist`).
- Deploy. `web/vercel.json` maps the `/arcade` prefix onto the built assets, so
  the deployment serves correctly at `https://<arcade>.vercel.app/arcade`.
- Verify that URL loads the arcade before wiring the portfolio.

### 2. Point the portfolio at it

In the **portfolio** repo's `vercel.json`, replace `your-arcade-deployment.vercel.app`
with the arcade's production host, then redeploy the portfolio:

```jsonc
"rewrites": [
  { "source": "/arcade",          "destination": "https://<arcade>.vercel.app/arcade" },
  { "source": "/arcade/",         "destination": "https://<arcade>.vercel.app/arcade" },
  { "source": "/arcade/:path*",   "destination": "https://<arcade>.vercel.app/arcade/:path*" }
]
```

Now `https://<portfolio>/arcade` serves the arcade. The portfolio's browsercade
showcase already links there (`/arcade/`, and `/arcade/#/play/<id>` per game).

> Prefer a subdomain instead? Deploy the arcade with Vite `base: "/"`, point a
> domain like `arcade.<portfolio>` at it, and set `NEXT_PUBLIC_ARCADE_URL` in the
> portfolio to that origin. No rewrite needed.

### 3. Allow the origin for online play

The Go server validates the WebSocket `Origin`. Add the portfolio origin to the
Render service's **`ALLOWED_ORIGINS`** (comma-separated) and redeploy, e.g.:

```
ALLOWED_ORIGINS=https://your-portfolio.example,http://localhost:5173
```

Otherwise online chess from the arcade is rejected with a 403.
