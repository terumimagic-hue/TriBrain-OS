# Seller's guide

This is the operator's playbook. It covers selling BookBrain OS as a
self-hosted lifetime license, then graduating to hosted SaaS.

## 1. Pick your launch shape

| Shape                       | Pros                                  | Cons                                  |
| --------------------------- | ------------------------------------- | ------------------------------------- |
| **Direct sale (no Stripe)** | Zero infra, fastest to start          | Manual receipts and key delivery      |
| **Stripe Checkout**         | Self-serve buying                     | Need a Stripe account + webhook host  |
| **Hosted SaaS**             | Highest LTV, easiest customer onboard | You operate the infrastructure        |

Recommended order:

```
1. Direct sale, lifetime — first 10–20 customers
2. Add Stripe Checkout for lifetime + subscription
3. Stand up Hosted Pro instance, sell monthly
```

## 2. Set the license signing secret

`BOOKBRAIN_LICENSE_SECRET` defines what license keys are valid for your
product. Treat it like a private key.

- Generate once: `openssl rand -base64 32`
- Save it in your password manager.
- Put the same value into every install you operate, and into the .env you
  ship to lifetime customers' VMs (or into the docs you send them).
- **Never change it** after the first sale. All previously issued keys
  would stop validating.

For a hosted SaaS install, you can use a different secret per environment.
For self-hosted lifetime sales, you must publish the secret with the
product so the customer's install can verify the key offline.

> The default secret in the code is public. It is intentionally weak so
> that anyone running `npm run dev` gets working test keys. **Override it
> before you sell.**

## 3. Issue licenses

### CLI (recommended for direct sales)

```bash
# Lifetime Starter
npm run issue-license -- --plan starter --email customer@example.com

# Lifetime Pro with a note
npm run issue-license -- --plan pro --email founder@acme.com --notes "Black Friday 2026"

# Time-limited Starter (expires end of 2026-12)
npm run issue-license -- --plan starter --expires 2026-12 --email annual@x.com
```

Output:

```
  License key:
  BBOS-P-LIFE0X-R5FCEN665AJYJR-BZPC5X8X

  plan:      pro
  expires:   lifetime
  customer:  founder@acme.com
```

Copy the key into the customer email (template below).

### Admin API (for headless ops)

```bash
curl -X POST https://yourdomain.com/api/license/issue \
  -H "Authorization: Bearer $BOOKBRAIN_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"pro","email":"customer@example.com"}'
```

`BOOKBRAIN_ADMIN_TOKEN` must be set on the install you call. Without it,
the endpoint returns 403.

## 4. Stripe wiring

1. Create products in Stripe:
   - "BookBrain OS — Starter (Lifetime)" — one-time price
   - "BookBrain OS — Starter (Monthly)" — recurring price
   - …repeat for Pro and Studio.
2. Copy each price ID (`price_…`) into the corresponding
   `STRIPE_PRICE_*` env var. Unset prices are hidden in `/pricing`.
3. Add the webhook endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`,
     `customer.subscription.deleted`, `customer.subscription.updated`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.
4. Test:
   - Use Stripe CLI: `stripe trigger checkout.session.completed`
   - Or buy your own product in Test mode.
5. The webhook automatically:
   - Issues the right license key (lifetime or subscription).
   - Stores the key as `bookbrain_license_key` in the Stripe customer
     metadata. You can pull it from there to email.
   - Marks subscription licenses `expired` on cancellation.

## 5. Customer email templates

### Lifetime — order confirmed

> Subject: Your BookBrain OS license
>
> Thanks for buying BookBrain OS, {plan} Lifetime.
>
> **Your license key**
> `BBOS-...`
>
> Activate it in two steps:
>
> 1. Install — five-minute guide:
>    https://yourdomain.com/docs/install (or run the bundled
>    INSTALL_SELF_HOSTED.md).
> 2. In your install, go to **/license**, paste the key, click
>    **Activate**.
>
> Your purchase includes 12 months of updates. We'll email release notes
> when there's something worth shipping.
>
> Quick start: docs/CUSTOMER_QUICKSTART.md

### Subscription — order confirmed

> Subject: BookBrain OS Pro — active
>
> Your BookBrain OS Pro subscription is live.
>
> **Your license key**
> `BBOS-...`
>
> The key is also available any time in your Stripe customer portal
> metadata.
>
> Activate at /license. Manage payment and cancel any time at /billing.

### Refund request

The beta policy is **non-refundable except for critical malfunction**.
Use this template:

> Subject: Re: refund
>
> Thanks for reaching out. Per our refund policy
> (https://yourdomain.com/refund), beta lifetime sales are
> non-refundable except when the Software cannot be installed or run on
> a supported platform.
>
> {If reported issue is a real malfunction:} I want to make this right.
> Can you send me the output of `npm run sanity` from your install, the
> exact error message you're seeing, and your OS / Node version? If we
> can't get it working together, I'll issue a full refund and revoke
> the license.
>
> {If the report is "didn't like the output" / "got busy" / similar:}
> I understand. Per the policy, I can't issue a refund for that. If
> there's a specific blocker — a bug, missing feature, unclear docs —
> tell me what it is and I'll see what I can do for the next release.

To revoke a license:
```bash
# in a Node REPL on the seller install
require("better-sqlite3")("./data/bookbrain.db")
  .prepare("UPDATE license_key SET status='revoked' WHERE key=?")
  .run("BBOS-...");
```

### "Key won't activate"

Most causes:

1. **Whitespace.** Strip leading/trailing spaces.
2. **Wrong install.** A key signed with secret A won't validate against an
   install running secret B. Confirm the customer is on a build you
   shipped, with the same `BOOKBRAIN_LICENSE_SECRET`.
3. **Expired.** Run `npm run issue-license -- --plan pro --email <email>`
   to issue a fresh one and revoke the old one.

## 6. Distributing updates

Lifetime customers get 12 months of updates. Recommended cadence: tag a
release once a month, post the changelog, send an email.

```bash
# 1. Bump version in package.json + VERSION
# 2. Update CHANGELOG.md
# 3. Build the release ZIP
npm run release:zip
# → dist/bookbrain-os-1.x.y.zip
```

Send the ZIP via email or post it to a download URL gated by license key
(roadmap). The ZIP excludes `node_modules`, `.next`, `data/`, `.env`, and
`.git` — customers run `npm install && npm run build` to upgrade.

A safe upgrade procedure for the customer:

```bash
# back up first
cp data/bookbrain.db data/bookbrain.db.$(date +%Y%m%d)
# (or use the in-app /api/backup endpoint)

# replace source
unzip -o bookbrain-os-1.x.y.zip -d /opt/bookbrain
cd /opt/bookbrain
npm install
npm run build
sudo systemctl restart bookbrain
```

The DB is migrated automatically on app start (`schema.sql` is idempotent).

## 7. Customer support — first 30 days

Track these in a single doc:

- "Where did they get stuck in the wizard?"
- "Which step of the pipeline failed first, and why?"
- "Which feature did they expect that doesn't exist?"

The first 10 customers will tell you everything you need to fix in v1.1.
Don't add more features until at least 5 of them have shipped a real book.

## 8. Pricing playbook

Beta pricing (first 20 customers):

- Lifetime Starter: ¥29,800 (instead of ¥49,800)
- Lifetime Pro: ¥49,800 (instead of ¥98,000)

Promotion code in Stripe (e.g. `LAUNCH-50`) handles the discount on the
checkout side. Mention it on the pricing page during the beta.

After 20 sales, raise to standard.

Hosted Pro should launch only after the self-hosted version is stable for
your operations. Initial price: ¥14,800/month. Move to ¥29,800/month when
support load justifies it.

## 9. Roadmap to communicate

These items belong on a public roadmap page so customers can see what's
coming with their lifetime license:

- Multi-author workflows (Studio plan)
- Hosted Pro instance
- KDP direct upload integration
- A/B title testing across past covers
- Export to ePub
- Audiobook script generator

Keep this list short and ship small.
