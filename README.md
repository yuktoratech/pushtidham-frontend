# Pushthidham Haveli — Frontend Demo

Complete Next.js, React, TypeScript and Tailwind CSS frontend source.

## Local development
Use Node.js 22.13 or newer with npm.

```sh
npm install
npm run dev
```

Production build: `npm run build`. Next.js writes the production build to `.next/`. Run `npm start` after building to serve it at http://localhost:3000.

## Deploy to Vercel
1. Clone this repository and install its locked dependencies with `npm ci`.
2. Connect the GitHub repository to Vercel.
3. Import that repository into Vercel.
4. Select Next.js as the framework, the folder containing package.json as Root Directory, Node.js 22.x, and npm run build as Build Command. Keep Output Directory at its framework default.
5. Deploy. Configure NEXT_PUBLIC_API_URL and the backend permitted frontend origin before using authentication. Payments remain a demo.

## Real authentication on backend-integration

The main branch retains the approved demo. This branch integrates authentication only; Giving, Events, Donations, offline records and reports remain browser-local/demo data.

Copy .env.example to .env.local and configure NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1. This public setting is the API base URL, not a secret. Run the separate backend with its normal npm run dev command, valid private environment configuration and MongoDB, then run this frontend with npm run dev on port 3000. Set backend FRONTEND_URL=http://localhost:3000 exactly. Never commit .env.local or use production secrets in NEXT_PUBLIC variables. Production API URL and backend allowed origin must be configured for the actual deployment, with HTTPS.

Login and public registration use real backend accounts; public registration always creates a donor. Administrators must be seeded manually by the backend operator using private environment variables. There are no hardcoded login credentials or localStorage login flags. Access JWTs stay in memory. Startup rotates the HttpOnly refresh cookie and calls /auth/me. Requests include credentials, and protected requests include a Bearer token. Refresh is single-flight, serialized across tabs where Web Locks are available, with one retry after a 401. Focus rechecks the current identity. Logout must successfully revoke the backend session before the UI clears authentication; failures allow retry. Only old demo session keys are removed; unrelated demo state is retained.

The existing Remember Me checkbox does not extend the backend-controlled absolute session lifetime. Registration combines first and last name into name and sends only name, email and password; phone remains optional UI input and is not persisted by auth. Registration requires 12–72 characters, at most 72 UTF-8 bytes, matching the backend. Authenticated name/email/role come from the backend. Donation history remains explicitly shared sample data, not private real history. Profile/password-update and forgot/reset email APIs are not connected.

Admin management changes remain local to the browser and do not update public listings. Reset Demo Data restores sample admin records. Payments, contact messages, password resets and profile edits remain previews; authentication is real. Production CORS/cookie settings must be agreed with the backend operator before deployment.

## Pages
Home, About, Events and dynamic Event Details, Giving and dynamic Giving Details, Contact, donor authentication, donor Account, Checkout, donation success/pending confirmations, and Admin login/dashboard/giving/events/donations/reports.

## Included
Source, reusable components, centralized sample data, public assets, package manifest and npm lockfile. Dependencies, build output, repository metadata and local credentials are excluded.

The standard npm commands use Next.js directly: `npm run dev`, `npm run build`, `npm start` and `npm run lint`. Development runs at http://localhost:3000. The remaining Sites helper scripts are optional tools from the original hosting environment and are not used by these commands.

## Repository hygiene

Commit source, required public assets, configuration, documentation and `package-lock.json`. Dependencies, static exports, build output, local Sites/Cloudflare state, logs, test reports, caches and editor files are ignored.

Environment files (`.env` and `.env.*`) must stay local. Sanitized templates named `.env.example` or `.env.*.example` may be committed. Authentication uses the configured backend; never put real payment, email, JWT signing or database secrets in client code or public assets.

Validate a clean checkout with Node.js 22.13 or newer and npm:

```sh
npm ci
npm run lint
npm run build
npx tsc --noEmit
```

The build generates Next.js route types used by the TypeScript check. Review `git status`, `git diff` and `git ls-files` before publishing. The development-only `public/__final-qa.html` preview was removed. Source, reusable UI components, configured database tooling and hosting helpers are retained.

The unused `examples/d1` sample, unreferenced `vendor` CSS and its accompanying license, and empty `drizzle/meta` migration journal were removed after reference checks. `db/schema.ts` remains the schema configured in `drizzle.config.ts`; `npm run db:generate` recreates migration metadata when tables are added. The `scripts` folder retains optional hosting and connector preview tools. Forms use local validation, so the unimported `@hookform/resolvers` dependency was removed.
