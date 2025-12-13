# SLICT ERP

Multi-tenant SaaS ERP system built with Next.js, TypeScript, Prisma and Tailwind CSS.

This repository contains a large, modular ERP application with multiple sub-apps and features (accounting, sales, inventory, HR, projects, real-estate, etc.). The README below documents how to get started, common scripts, database setup, testing, and troubleshooting.
## Table of contents

- About
- Prerequisites
- Quick start
- Development
- Database (Prisma)
- AI / Ollama
- Testing
- Build & Production
- Useful npm scripts
- Project layout
- Environment variables
- Contributing
- Troubleshooting
- License


## About

This is a multi-tenant SaaS ERP platform optimized for modular development. It uses Next.js (app router), TypeScript, Prisma for DB access, Tailwind CSS, and includes integrations for payments, AI, and background jobs.

## Prerequisites

- Node.js 22.x (project uses `engines.node: 22.x`)
- pnpm >= 8 (or npm, but pnpm is recommended)
- PostgreSQL (or another DB supported by Prisma)
- Optional: Ollama (for local AI model serving) if you use the AI features
- Git

On Windows (PowerShell), you can install pnpm globally:

```powershell
npm install -g pnpm
```

## Quick start (development)

1. Clone the repo and open it:

```powershell
git clone <repo-url> slict-erp
cd slict-erp
```

2. Install dependencies and prepare the project:

```powershell
pnpm install
pnpm run db:generate
pnpm run build
```

3. Create a `.env` file at the repository root (see "Environment variables" below) and set your database connection string.

4. Start the dev server:

```powershell
pnpm run dev
```

The app will be available at http://localhost:3000 by default.

## Development

- The project uses Next.js App Router under `src/app`.
- Components live in `src/components` and feature apps live in `src/apps`.
- Shared utilities are in `src/lib` and types in `src/types`.

Recommended workflow:

- Use feature branches per module.
- Run type checking regularly:

```powershell
pnpm run type-check
```

- Linting:

```powershell
pnpm run lint
```

## Database (Prisma)

Prisma is configured in `prisma/schema.prisma`.

Common commands:

- Generate the client:

```powershell
pnpm run db:generate
```

- Run migrations (development):

```powershell
pnpm run db:migrate
```

- Deploy migrations (production):

```powershell
pnpm run db:migrate:prod
```

- Push schema to the database (non-destructive):

```powershell
pnpm run db:push
```

- Open Prisma Studio:

```powershell
pnpm run db:studio
```

- Seed the database (project has `prisma/seed.ts`):

```powershell
pnpm run db:seed
```

If you need to reset your local DB (destructive):

```powershell
pnpm run db:reset
```

## AI / Ollama

This repository includes integration with Ollama for local model hosting.

- Start Ollama-backed AI service (project uses `scripts/ollama-start.sh`):

```powershell
pnpm run ai:serve
```

- Pull models with:

```powershell
pnpm run ai:pull
```

- Test local AI API (example):

```powershell
pnpm run ai:test-local
```

Note: On Windows you might need WSL or Git Bash to run some bash scripts, or convert them to PowerShell equivalents.

## Testing

This project uses Jest and Playwright for tests.

- Unit / integration tests:

```powershell
pnpm run test
pnpm run test:watch
```

- Coverage:

```powershell
pnpm run test:coverage
```

- End-to-end (Playwright):

```powershell
pnpm run test:e2e
```

- Integration-only tests:

```powershell
pnpm run test:integration
```

## Build & Production

Build the Next.js app:

```powershell
pnpm run build
```

Run the production build locally:

```powershell
pnpm run start
```

There is a `deploy` script that runs `./deploy.sh` — review it before using in CI.

## Useful npm scripts

Key scripts (see `package.json` for full list):

- `dev` - start Next.js dev server
- `build` - build the Next.js app
- `start` - start Next.js in production
- `lint` - run ESLint
- `type-check` - run TypeScript type checking
- `db:*` - various Prisma/database tasks (generate, migrate, studio, seed)
- `test`, `test:watch`, `test:coverage`, `test:e2e` - test commands
- `ai:*` - Ollama/AI helper commands
- `setup` - install dependencies, generate prisma client, build

There are also several convenience `dev:assign-*` scripts that print an emoji and start `dev`. They are for developer ergonomics and do not change behavior.

## Project layout (top-level)

- `src/app` - Next.js app router
- `src/components` - shared UI components
- `src/lib` - shared libraries, utilities, and integrations
- `src/hooks` - custom React hooks
- `prisma` - Prisma schema, migrations and seed scripts
- `scripts` - helper scripts (e.g., sync permissions, groq setup)

## Environment variables

Create a `.env` file with at least the following values (examples):

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/slict
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=some_long_random_secret
# Optional: third-party keys
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
```

Refer to `src/lib/auth-config.ts`, `src/lib/prisma.ts`, or other files for other env variables the project expects.

## Contributing

- Fork and open a pull request.
- Add tests for new features or bug fixes.
- Run linters and type checks before opening a PR.

## Troubleshooting

- If you hit Prisma/client errors, regenerate the client:

```powershell
pnpm run db:generate
```

- If Node version mismatches occur, use `nvm` or install the recommended Node 22.x.

- Some scripts use bash; on Windows, run them under WSL or convert to PowerShell.

## License

This project does not include a license file. Add a `LICENSE` if you plan to open-source it.


---

If you'd like, I can:
- Add a sample `.env.example` file with commonly required variables.
- Convert bash scripts to PowerShell equivalents (Windows-friendly).
- Generate a short architecture diagram and developer onboarding checklist.

Tell me which of those you'd like next.
