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
1. Extract this ZIP.
2. Upload the contents of the pushthidham-haveli folder to your GitHub repository.
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

The .openai hosting metadata and Sites helper scripts describe the original hosting environment. Vercel uses the Next.js build, not those hosting helpers. Use pnpm exec next dev for local development.
