# Pushthidham Haveli — Frontend Demo

Complete Next.js, React, TypeScript and Tailwind CSS frontend source.

## Local development
Use Node.js 22.x or newer and the pnpm version in package.json.

```sh
corepack enable
pnpm install
pnpm exec next dev
```

Production build: `pnpm build`. The static export is written to `out/`.

## Deploy to Vercel
1. Clone this repository and install its locked dependencies with `pnpm install --frozen-lockfile`.
2. Connect the GitHub repository to Vercel.
3. Import that repository into Vercel.
4. Select Next.js as the framework, the folder containing package.json as Root Directory, Node.js 22.x, and pnpm build as Build Command. Keep Output Directory at its framework default.
5. Deploy. No backend/payment environment variables are required for this frontend demo.

## Demo access
Donor: /login — donor@pushthidham.org / Demo@123
Admin: /admin/login — admin@pushthidham.org / Admin@123

These are public frontend test credentials only. Route guards and sessions are browser-local, not production authentication.
Admin management changes remain local to the browser and do not update public listings. Reset Demo Data restores sample admin records.
Payments, contact messages, registrations, password resets and profile changes are demonstrations; no real payment, email, account or database operation takes place.

## Pages
Home, About, Events and dynamic Event Details, Giving and dynamic Giving Details, Contact, donor authentication, donor Account, Checkout, donation success/pending confirmations, and Admin login/dashboard/giving/events/donations/reports.

## Included
Source, reusable components, centralized sample data, public assets, package manifest and pnpm lockfile. Dependencies, build output, repository metadata and local credentials are excluded.

The Sites helper scripts describe the original hosting environment. This checkout does not include .openai hosting metadata. Vercel uses the Next.js build. Use pnpm exec next dev for local development; the package's dev/start helpers target the original Sites environment.

## Repository hygiene

Commit source, required public assets, configuration, documentation and `pnpm-lock.yaml`. Dependencies, static exports, build output, local Sites/Cloudflare state, logs, test reports, caches and editor files are ignored.

Environment files (`.env` and `.env.*`) must stay local. Sanitized templates named `.env.example` or `.env.*.example` may be committed. This frontend demo requires no credentials; never put real payment, email or database secrets in client code or public assets.

Validate a clean checkout with Node.js 22.13 or newer and the pinned pnpm version:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm exec tsc --noEmit
```

The build generates Next.js route types used by the TypeScript check. Review `git status`, `git diff` and `git ls-files` before publishing. The development-only `public/__final-qa.html` preview was removed. Source, reusable UI components, configured database tooling and hosting helpers are retained.

The unused `examples/d1` sample, unreferenced `vendor` CSS and its accompanying license, and empty `drizzle/meta` migration journal were removed after reference checks. `db/schema.ts` remains the schema configured in `drizzle.config.ts`; `pnpm db:generate` recreates migration metadata when tables are added. The `scripts` folder supports the existing package commands and connector preview tools. Forms use local validation, so the unimported `@hookform/resolvers` dependency was removed.
