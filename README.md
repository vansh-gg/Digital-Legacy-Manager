# Digital Legacy Manager

A secure, elderly-friendly **digital will**. Owners record their bank accounts, online accounts,
insurance, property papers and personal messages; choose trusted family members (**nominees**);
and the system releases each item to the right person **only if the owner stops checking in**.

> Software Engineering & Project Management (SEPM) project.

**🔗 Live demo: [digital-legacy-manager-iota.vercel.app](https://digital-legacy-manager-iota.vercel.app)**

Hosted on Vercel (Singapore region) with a Neon PostgreSQL database. Demo accounts are available on request.

---

## Why

When someone passes away, families often spend months finding bank details, policies, passwords and
property papers. Existing solutions are either paper-based (easily lost) or built for tech-savvy users.
This project is designed from the ground up for **older users** and their families.

## Features

| Area | What it does |
|---|---|
| **Secure vault** | Store accounts and assets in 8 categories, with encrypted usernames, passwords and notes |
| **Documents** | Upload wills, property papers, policies and ID proofs. Files are stored encrypted |
| **Trusted people** | Invite nominees by email. They must accept with their own account |
| **Assignment** | Decide exactly which nominee receives each asset and document, with written wishes |
| **Personal letters** | Encrypted letters delivered to one nominee after release |
| **Proof of life** | Regular check-ins (7–180 days). Logging in or one email click counts |
| **Inactivity engine** | Reminder → urgent warning + nominee heads-up → grace period → release |
| **Nominee portal** | After release, nominees see only what was assigned to them |
| **Safe reporting** | A nominee can report a death. This starts the grace period, but **never** releases anything immediately |
| **Activity history** | Full audit log, highlighting failed logins and nominee access |
| **Accessibility** | Readable font, 3 text sizes, read-aloud, high-contrast slate-blue theme (≥ 4.5:1), large labelled buttons, step-by-step forms |
| **Live demo mode** | Count check-ins in seconds to show a missed check-in and the handover live |

## Security highlights

- **AES-256-GCM** authenticated encryption with a **separate key per vault** (HKDF-SHA256)
- **bcrypt** password hashing (cost 12), account lockout after 5 wrong passwords
- **HttpOnly, SameSite** session cookies plus a CSRF header check. Sessions are revoked on password change
- Password re-entry is required to view any secret, and every view is logged
- Single-use, hashed, expiring email tokens (invite, reset, check-in)
- Helmet security headers and strict CSP, rate limiting, Zod input validation, magic-byte file-type checks
- Strict ownership checks: another user's records always return 404

See [docs/SECURITY.md](docs/SECURITY.md) for the threat model.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Tailwind CSS 4, Vite, Lucide icons, Fraunces + Atkinson Hyperlegible fonts |
| Backend | Node.js, Express 5, Prisma ORM, Zod, node-cron, Nodemailer |
| Database | SQLite locally, Neon PostgreSQL in production (switched automatically) |
| Hosting | Vercel (static site + serverless API + daily cron) |
| Testing | Node test runner + Supertest (38 API test cases) |

## Getting started

Requires **Node.js 20.12+**.

```bash
npm install        # installs server + client
npm run setup      # creates server/.env with random secrets and the database
npm run seed       # optional: 6 demo scenarios (password = DEMO_PASSWORD in server/.env)
npm run dev        # API on :4000, web app on http://localhost:5173
```

### Demo scenarios (after `npm run seed`)

The seed creates one family for each situation the system handles. All demo accounts use the
password in `DEMO_PASSWORD` (generated privately by `npm run setup`, never stored in the code).

| # | Owner | Situation |
|---|---|---|
| 1 | Ramesh Kumar | **Active**: complete plan, one nominee accepted, one invitation pending |
| 2 | Sunita Iyer | **Reminder sent**: check-in due in 2 days |
| 3 | Mohan Das | **Waiting period**: missed his check-in, release in 4 days |
| 4 | Meera Nair | **Waiting period**: her daughter reported she may have passed away |
| 5 | Gopal Rao | **Released**: son and daughter each see only what was left to them; one nominee declined |
| 6 | Harish Menon | Ready for a **live demo** |

### Live demo: show a release happening in real time

1. Log in as the live-demo owner and open **Settings → Live demo mode**. Choose, for example, 30 seconds and 30 seconds, then press **Start live demo**.
2. Open **Home** and watch the countdown. When it reaches zero the waiting period starts, and when that ends the plan is released.
3. In a second browser (or an incognito window), log in as the nominee and open **Left for me**. The page updates by itself.
4. Press **I am well** at any time to lock everything again.

For day-based demos, **Settings → Jump ahead in time** moves the schedule forward by days instead.

### Tests

```bash
npm test
```

## Project structure

```
client/                React app
  src/components/      design system (buttons, fields, dialogs, layout)
  src/pages/           screens (auth, home, assets, nominees, documents, letters, shared…)
server/
  prisma/              schema, migrations, demo seed
  src/routes/          REST API modules
  src/services/        check-in state machine, vault helpers
  src/lib/             encryption, storage, mailer, tokens, audit log
  tests/               API test suites
docs/                  SEPM documentation
```

## Documentation

- [Sprint plan & product backlog](docs/SPRINT_PLAN.md)
- [Software Requirements Specification](docs/SRS.md)
- [Architecture & UML diagrams](docs/ARCHITECTURE.md)
- [Test cases](docs/TEST_CASES.md)
- [Security design](docs/SECURITY.md)
- [Deployment (Vercel + Neon)](docs/DEPLOYMENT.md)

## Disclaimer

This is an academic project. It is not a legal will, and it does not replace one registered under the
Indian Succession Act. Users should keep a legal will and can store a copy of it here.
