# Install — Self-hosted

This guide gets BookBrain OS running on your own machine in under 10 minutes.

If you only want to **try it**, follow [Quick install](#quick-install).
If you plan to **sell it**, finish [Stripe setup](#stripe-yes-saas-mode)
and [Production hardening](#production-hardening) too.

---

## Prerequisites

| Tool      | Version            | Notes                                            |
| --------- | ------------------ | ------------------------------------------------ |
| Node.js   | 20.x or 22.x LTS   | `node -v`                                        |
| npm       | 10+                | ships with Node                                  |
| git       | any recent         | for clone + updates                              |
| Build     | Xcode CLI / VS C++ | needed by `better-sqlite3` and `sharp`           |

The native modules (`better-sqlite3` for SQLite and `sharp` for image
rendering) are compiled on `npm install`. On Mac and most Linux distros
this is automatic; on Windows you'll need the Visual Studio Build Tools.

## Quick install

```bash
git clone <your-source>/bookbrain-os.git
cd bookbrain-os
cp .env.example .env
# Open .env in an editor and paste your three API keys (see below).
npm install
npm run dev
```

Open http://localhost:3000. The onboarding wizard takes over.

To run in production (single host):

```bash
npm install
npm run build
npm run start
# defaults to http://localhost:3000
```

Behind a reverse proxy (nginx, Caddy), terminate TLS in front of port 3000
and forward all traffic to it.

## Get your API keys

| Provider  | Where                                                 | Used for                                 |
| --------- | ----------------------------------------------------- | ---------------------------------------- |
| OpenAI    | https://platform.openai.com/api-keys                  | James (concept, editorial, KDP, ingestion), embeddings, AI cover image |
| Anthropic | https://console.anthropic.com/settings/keys           | Claude (structure, drafting, revision)   |
| Gemini    | https://aistudio.google.com/app/apikey                | Gemini (research, fact check)            |

Paste them into `.env` (or into the wizard at `/onboard` — they get stored
in SQLite as overrides).

## Platform notes

### macOS

```bash
xcode-select --install         # if not already installed
brew install node@22 git
```

If `npm install` fails on `better-sqlite3`, run
`npm rebuild better-sqlite3 --build-from-source`.

### Windows

1. Install [Node.js LTS](https://nodejs.org/) — pick the option that also
   installs the Build Tools when prompted. Otherwise, install the Visual
   Studio Build Tools separately and pick the C++ workload.
2. Open a PowerShell:
   ```powershell
   npm config set msvs_version 2022
   npm install
   ```
3. If `sharp` fails, run:
   ```powershell
   npm install --include=optional sharp
   ```

### Ubuntu VPS (20.04 / 22.04 / 24.04)

```bash
# 1. Node 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs build-essential git

# 2. App
git clone <your-source>/bookbrain-os.git /opt/bookbrain
cd /opt/bookbrain
cp .env.example .env
nano .env                       # paste keys
npm install
npm run build

# 3. systemd
sudo tee /etc/systemd/system/bookbrain.service >/dev/null <<EOF
[Unit]
Description=BookBrain OS
After=network.target

[Service]
WorkingDirectory=/opt/bookbrain
ExecStart=/usr/bin/npm run start
Restart=always
EnvironmentFile=/opt/bookbrain/.env
User=www-data

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now bookbrain
sudo systemctl status bookbrain
```

Front it with nginx or Caddy and a TLS certificate. The app listens on
`localhost:3000` by default; forward `https://yourdomain` to it.

## Configuration: `.env`

The minimum needed to run the pipeline:

```dotenv
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

OPENAI_MODEL=gpt-4o
ANTHROPIC_MODEL=claude-sonnet-4-6
GEMINI_MODEL=gemini-2.0-flash
OPENAI_EMBED_MODEL=text-embedding-3-small

BOOKBRAIN_DB_PATH=./data/bookbrain.db
BOOKBRAIN_EXPORT_DIR=./data/exports
BOOKBRAIN_KNOWLEDGE_TOPK=8

# Always set this in production. The default secret is public.
BOOKBRAIN_LICENSE_SECRET=replace-with-a-32+-char-random-string
```

You can also enter API keys in the in-app wizard — they will override these
without a restart.

## Stripe — no (manual / direct sales mode)

You don't need Stripe to use, sell, or activate BookBrain OS.
You can issue keys yourself:

```bash
# 1. Set the secret used to sign every key you'll ever issue.
echo 'BOOKBRAIN_LICENSE_SECRET=your-long-random-secret' >> .env

# 2. Issue keys from the command line.
npm run issue-license -- --plan pro --email customer@example.com
# → prints "BBOS-..."

# 3. Send the key to the customer.
# 4. Customer pastes it at /license in their install.
```

Lifetime keys never expire. To issue a time-limited key:

```bash
npm run issue-license -- --plan starter --expires 2026-12 --email ...
```

To allow remote (admin API) key issuance, set `BOOKBRAIN_ADMIN_TOKEN` and
call `POST /api/license/issue` with `Authorization: Bearer <token>`.

## Stripe — yes (SaaS mode)

For self-serve checkout:

```dotenv
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://yourdomain.com

# Set price IDs for each plan you want to sell. Unset prices are hidden.
STRIPE_PRICE_STARTER_LIFETIME=price_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PRO_LIFETIME=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_STUDIO_LIFETIME=price_...
STRIPE_PRICE_STUDIO_MONTHLY=price_...
```

Then:

1. Create the products + prices in your Stripe dashboard.
2. In Stripe → Developers → Webhooks, add an endpoint at
   `https://yourdomain.com/api/stripe/webhook` and select these events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Restart the app.

A successful Checkout flow now writes a license key into the customer's
Stripe metadata as `bookbrain_license_key` and into your local DB. See
[SELLER_GUIDE.md](SELLER_GUIDE.md) for the customer-facing email flow.

## Production hardening

- **Rotate the license secret.** `BOOKBRAIN_LICENSE_SECRET` defines what
  keys are valid for *this install*. Choose one secret per
  product/install when you start selling, write it down, and don't change
  it later — every previously issued key would become invalid.
- **Set an admin token.** `BOOKBRAIN_ADMIN_TOKEN` is required to call
  `POST /api/license/issue`. Without it, that endpoint returns 403.
- **Use HTTPS.** Stripe webhooks require HTTPS. Run behind nginx/Caddy.
- **Backups.** `GET /api/backup` returns a single ZIP of the SQLite DB
  (clean copy via `VACUUM INTO`) plus the `exports/` directory. Schedule a
  cron to download it nightly.
- **Cost cap.** `Settings → Cost limit` blocks new agent runs once the
  current month's logged provider spend reaches the cap. Recommended
  default: $50–200/month.
- **Restart policy.** Use systemd or PM2 (Linux) so the app restarts on
  crash. `npm run start` is intended to run under a supervisor.

## Sanity check

After install, run:

```bash
npm run sanity
```

It checks: required env vars, DB schema initializes, license HMAC works,
provider keys, and disk writability. Output is a checklist with PASS / WARN /
FAIL.

## Troubleshooting

**`npm install` fails on `better-sqlite3`.**
Install build tools (Xcode CLI on macOS, Build Tools on Windows,
`build-essential` on Ubuntu), delete `node_modules` and `package-lock.json`,
then run `npm install` again. Or force a rebuild:
`npm rebuild better-sqlite3 --build-from-source`.

**`sharp` install hangs / fails on a fresh VPS.**
Try `npm install --include=optional sharp`. On Alpine Linux, also
`apk add vips-dev`.

**Port 3000 in use.**
`PORT=4000 npm run start`.

**"OPENAI_API_KEY is not set" during a pipeline run.**
Either paste the key into `.env` (and restart) or open `/settings` and
paste it as an override (no restart needed).

**Provider 429 / rate-limit errors.**
The runner retries with exponential backoff. If it still fails, lower the
target word count (smaller drafting calls), or switch to a faster model in
`/settings`.

**"License has expired" after activating a working key.**
Subscription licenses expire when Stripe sends `subscription.deleted`.
Re-subscribe via `/billing` and the webhook will re-activate it. For
manual lifetime keys, this should never happen — if it does, your system
clock is wrong.

**Onboarding wizard keeps reappearing.**
The dashboard checks `app_state.onboarded`. Reset by deleting
`bookbrain.db` (you'll lose existing data) or run this in a Node REPL:
```js
require("better-sqlite3")("./data/bookbrain.db")
  .prepare("UPDATE app_state SET value='1' WHERE key='onboarded'")
  .run();
```

**Cover Studio AI generation fails: "model not found".**
`gpt-image-1` requires a verified OpenAI account. The endpoint falls back
to `dall-e-3` automatically. If that also fails, your OpenAI account does
not have image-generation access — upload an image manually instead.

**Manuscript generation feels too short.**
Increase `estimatedWords` on the project (per-chapter target is derived
from this). Note: longer books cost more — see `/estimate` first.

**The dashboard shows the wrong plan after activating a key.**
Refresh the page — the license check is server-side and the page caches.
If still wrong, visit `/license` and re-activate; this rewrites
`app_state.active_license_key`.
