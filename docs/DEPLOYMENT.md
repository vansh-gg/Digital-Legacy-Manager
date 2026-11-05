# Deployment (Vercel + Neon Postgres)

The React app is served by Vercel's CDN. Every `/api/*` request runs the same Express app as a
serverless function (`api/index.mjs`). Data lives in a free **Neon PostgreSQL** database.

| Piece | Where it runs |
|---|---|
| Web app (`client/dist`) | Vercel static hosting |
| API (`server/src`) | Vercel serverless function |
| Database | Neon Postgres (free tier, connected through Vercel Storage) |
| Uploaded documents | Encrypted inside the database (AES-256-GCM) |
| Daily inactivity check | Vercel Cron → `GET /api/cron/sweep` at 06:00 UTC |

## One-time setup

1. **Import the repo:** on vercel.com, click **Add New → Project** and pick the GitHub repository. Vercel reads
   `vercel.json`, so no build settings are needed.
2. **Add the database:** in the project, open **Storage → Create Database → Neon (Postgres)**, then **Connect** it to the project.
   This adds `DATABASE_URL` (and `DATABASE_URL_UNPOOLED`) automatically.
3. **Add environment variables:** under **Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `JWT_SECRET` | 48+ random characters |
| `ENCRYPTION_KEY` | 32 random bytes, base64. **Keep a backup. Without it, stored secrets cannot be decrypted** |
| `CRON_SECRET` | Any long random string (protects the cron endpoint) |
| `NODE_ENV` | `production` |
| `ENABLE_DEV_TOOLS` | `true` for a classroom demo (demo mailbox + time travel), otherwise leave unset |
| `SEED_DEMO` | `true` to load the 6 demo scenarios on each deploy |
| `DEMO_PASSWORD` | Private password for all demo accounts (never put it in the code or README) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Optional real email (e.g. Brevo, or a Gmail app password) |

4. **First administrator:** with `SEED_DEMO=true` the build creates `admin@example.com` (password =
   `DEMO_PASSWORD`). For a real deployment, register normally and then run this on your computer,
   with `DATABASE_URL` set to the Neon connection string:

   ```bash
   npm run make-admin -w server -- you@yourmail.com
   ```

5. **Redeploy.** During the build, `server/scripts/prepare-db.js` detects Postgres, switches the Prisma
   provider, and creates the tables (`prisma db push`).

Generate the secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Notes and limits (free tier)

- **Uploads:** Vercel functions accept up to 4.5 MB per request, so the app limits uploads to 4 MB there (10 MB locally).
- **Cron:** the Hobby plan runs crons once a day, so reminders go out daily rather than hourly.
- **Rate limiting:** limits are kept in memory per function instance. That's fine for a demo; a shared store such as Upstash Redis would be needed at scale.
- **Demo mailbox in production:** it only shows emails addressed to the signed-in user, so invitation and reset links are never exposed to others.

## Local development

Nothing changes locally: SQLite, `npm run setup`, `npm run dev`. See the README.
