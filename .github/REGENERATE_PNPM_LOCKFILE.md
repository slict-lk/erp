---
Why
CI on Vercel is failing: pnpm aborts because pnpm-lock.yaml is out of sync with package.json and installs run with a frozen lockfile in CI.

Recommended action
Regenerate and commit pnpm-lock.yaml using pnpm v8, then open a PR from chore/update-pnpm-lockfile into erp2026_branch.

Commands to run locally (recommended)
corepack enable
corepack prepare pnpm@8 --activate
git checkout erp2026_branch
git pull origin erp2026_branch
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update pnpm-lock.yaml"
git push origin HEAD:chore/update-pnpm-lockfile

Quick CI workaround (not recommended long-term)
In Vercel build settings, change the install step to:
pnpm install --no-frozen-lockfile && pnpm build

Notes
- Use pnpm v8 when regenerating the lockfile (the existing lockfile was produced by pnpm@8).
- package.json currently declares "engines": { "node": "22.x" } — Vercel will use Node 22.x because engines takes precedence. If you want Node 24.x on Vercel, update package.json engines accordingly and confirm compatibility with your dependencies.
---