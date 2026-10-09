# Phase 4E-2B Part 1: frontend tooling security review

Review date: 2026-10-09. This document records the repository and registry evidence for controlled remediation. Application behavior, UI, payment configuration, backend source, deployment target and Git branches are outside the permitted change scope.

## Baseline and evidence

| Repository | Branch | Initial HEAD | Initial working tree |
| --- | --- | --- | --- |
| Frontend | `backend-integration` | `5f6c0f506ab4501467c55d9edc60790b3bda4cf0` | Clean |
| Backend | `main` | `ba08cff1ad0ae15ee0c22488a6e14c56acded402` | Clean |

The environment is Windows 11, Node.js 22.23.3 and npm 10.9.9. Commands use `npm.cmd` and `npx.cmd` because the machine's PowerShell execution policy blocks the corresponding `.ps1` wrappers; the policy is not changed.

Baseline evidence comes from `package.json`, `package-lock.json`, the installed package manifests, source/configuration reference searches, npm registry metadata, and the full JSON audit captured before remediation. The audit has **20 vulnerable package entries**, comprising **10 high and 10 moderate** findings, with no critical findings. These entries include ancestor packages affected by vulnerable dependencies; they are not 20 independent advisories. There are 27 distinct leaf advisories: one for braces, two for esbuild, one for fflate, 21 for undici and two for ws.

The [previous Phase 4E-2A security handoff](../../pushtidham-backend/docs/phase-4e2a-dependency-security.md) in the sibling backend repository was reviewed without editing it. It records the compatible Next.js/React/Vite hardening already present in this baseline, the earlier Cloudflare Workers-types major-5 peer-resolution blocker, and the blocked overall tooling security gate. Its historical check results are context only, not fresh verification for this remediation.

`npm audit --omit=dev` reports zero vulnerabilities. This identifies no reported vulnerability in the production dependency tree; it does **not** clear build, development or deployment tools for use. Tools installed in CI or used to deploy still have an exposure even when omitted from a runtime installation.

The npm registry is `https://registry.npmjs.org/`; `force` is false. The machine user configuration has `legacy-peer-deps=true`. No repository `.npmrc` is present. The machine configuration is preserved; remediation resolution and validation should explicitly use `--legacy-peer-deps=false` to check peer compatibility rather than rely on that inherited bypass.

The original `npm ls --all` JSON has six extraneous optional/native-support package entries: `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`, `@img/sharp-wasm32`, `@napi-rs/wasm-runtime` and `@tybys/wasm-util`. These are installed dependency artifacts, not repository source. A clean `npm ci` is the appropriate reproducibility check; no manual `node_modules` edits are permitted.

## Actual tooling usage and exposure

| Tooling root | Evidence of use | Exposure and scope |
| --- | --- | --- |
| Next.js / React | `dev=next dev`, `build=next build --webpack`, `start=next start`; Next.js 16.3.8 and React/React DOM 19.2.8 | Standard application runtime/build. These versions and scripts are preserved. |
| `eslint-config-next` | `eslint.config.mjs` imports its core-web-vitals and TypeScript configurations | Used for linting. The affected glob parser is in development/CI lint tooling, not a browser donation route. Repository-controlled patterns reduce exposure but do not remove the advisory. |
| Vinext / Vite | `scripts/run-framework.mjs` selects Vite or Vinext; `scripts/build-verified.sh` invokes Vinext; install helpers check its executable and integrity-pinned tarball | Retained optional original Sites/preview tooling. Standard npm dev/build/start do not invoke it. Its optional build/preview use must still be reviewed before use. |
| Cloudflare / Wrangler / Miniflare | Retained direct development dependencies; `scripts/sites-env.mjs` and `.sh` configure Wrangler/Miniflare paths; Vinext can provision Cloudflare tooling; `db/index.ts` imports `cloudflare:workers` and `drizzle-orm/d1` | Optional local simulation/deployment ecosystem. The retained D1 helper defines `getDb()` using a `DB` binding but has no discovered application imports. No tracked Vite/Wrangler deployment configuration was found. README documents Vercel, but that is insufficient authorization to remove the Cloudflare tools. Intended production deployment remains an operator decision. |
| `@cloudflare/workers-types` | Explicitly listed in `tsconfig.json` compiler `types`; retained D1 helper expects a Workers environment | Typechecking currently depends on Workers types even though normal npm scripts use Next.js. Removal or a major update requires review. |
| `drizzle-kit` | `db:generate=drizzle-kit generate`; `drizzle.config.ts` selects SQLite and `db/schema.ts` | Retained configured migration generator. Schema is intentionally empty; backend MongoDB is separate. The vulnerable old esbuild copy belongs to its loader. No esbuild serve or Drizzle Studio command is configured. |
| OG rendering / fflate | `vinext -> @vercel/og -> satori -> fflate`; no application imports of OG/Satori/Vinext were found | Optional rendering/build path. fflate's reported bug is malformed ZIP64 handling in `unzipSync`; retaining the dependency still requires resolving the vulnerable version where compatible. |

These findings do not authorize tool removal. No affected package is removed merely because the normal Next.js commands do not invoke it.

## All 20 baseline package findings

The paths below are exact lockfile package keys. H = high; M = moderate. Entries without their own advisory inherit the indicated leaf advisories through the listed dependency chain. The installed versions refer to the baseline, not a proposed final dependency tree.

| # | Vulnerable package and version | Severity / directness | Exact path(s) and introducing parent/root | Advisory or propagated cause | Compatible remedy / npm suggestion assessment |
| --- | --- | --- | --- | --- | --- |
| 1 | `@cloudflare/vite-plugin@1.37.1` | M / direct dev | `node_modules/@cloudflare/vite-plugin`; root manifest | Miniflare undici/ws; Wrangler esbuild; direct ws | npm suggests 1.63.1 as a non-major plugin update, but its dependency stack crosses to Miniflare 5 alpha and newer Workers types. Approval required before that stack upgrade. |
| 2 | `@esbuild-kit/core-utils@3.3.2` | M / transitive | `node_modules/@esbuild-kit/core-utils`; `drizzle-kit -> @esbuild-kit/esm-loader` | E1: old esbuild | Parent pins an older esbuild series. No verified compatible update established. npm suggests Drizzle downgrade to 0.18.1; rejected as breaking. |
| 3 | `@esbuild-kit/esm-loader@2.6.5` | M / transitive | `node_modules/@esbuild-kit/esm-loader`; `drizzle-kit` | Core utils -> E1 | Same Drizzle blocker; no speculative esbuild override. |
| 4 | `@next/eslint-plugin-next@16.3.8` | H / transitive | `node_modules/@next/eslint-plugin-next`; `eslint-config-next` | `fast-glob -> micromatch -> B1` | No published braces fix established. npm suggests `eslint-config-next@14.2.35`, a breaking downgrade from the Next.js 16 configuration. |
| 5 | `@vercel/og@1.0.3` | M / transitive | `node_modules/@vercel/og`; `vinext` | `satori -> F1` | Narrowly scoped fflate 0.7.5 override applied; targeted OG/WOFF rendering and final application checks pass. No Vinext downgrade to npm's suggested 0.2.1. |
| 6 | `braces@3.0.3` | H / transitive | `node_modules/braces`; `micromatch`; roots Next ESLint and Vinext | B1 | Advisory affects <=3.0.3; no published patched version established. Updating already-current micromatch/fast-glob does not fix braces. |
| 7 | `drizzle-kit@0.31.10` | M / direct dev | `node_modules/drizzle-kit`; root manifest | `@esbuild-kit/esm-loader -> core-utils -> E1` | Registry 0.31.11 retains the old loader chain. npm's 0.18.1 suggestion is a downgrade, not a compatible patch remedy. |
| 8 | `esbuild@0.18.20` and `0.27.3` | M / transitive | `node_modules/@esbuild-kit/core-utils/node_modules/esbuild` (Drizzle); `node_modules/wrangler/node_modules/esbuild` (Cloudflare/Wrangler) | E1 (0.18.20); E2 (0.27.3, low leaf advisory) | E1 fixed in 0.25.0; E2 fixed in 0.28.1. Both cross the respective parent-pinned 0.x minor API boundary. Parent-supported upgrade required; npm reports the Drizzle breaking downgrade. |
| 9 | `eslint-config-next@16.3.8` | H / direct dev | `node_modules/eslint-config-next`; root manifest | Next plugin -> glob -> B1 | Preserve matching Next.js 16 configuration; no unsupported downgrade to npm's 14.2.35. |
| 10 | `fast-glob@3.3.1` and `3.3.3` | H / transitive | `node_modules/fast-glob` (Next ESLint); `node_modules/vite-plugin-dynamic-import/node_modules/fast-glob` (Vinext) | `micromatch -> B1` | No leaf fix established. npm's Next ESLint 14 downgrade does not constitute a safe general glob fix. |
| 11 | `fflate@0.7.3` | M / transitive | `node_modules/fflate`; `vinext -> @vercel/og -> satori` | F1 | Patched same-series 0.7.5 scoped override applied; malformed ZIP64 rejection, Satori rendering, clean install and final application checks pass. npm's breaking Vinext downgrade to 0.2.1 was rejected. |
| 12 | `micromatch@4.0.8` | H / transitive | `node_modules/micromatch`; both fast-glob copies | B1 | Current micromatch retains braces. No supported leaf fix established. |
| 13 | `miniflare@4.20260515.0` | M / transitive | `node_modules/miniflare`; Cloudflare plugin and Wrangler | U1-U21; W1-W2 | External undici 7.24.8 and ws 8.18.0 imports remain. Networking overrides were withdrawn because native-worker startup prevented required consumer validation; separately, parent plugin/CLI embedded copies cannot be patched by installed-dependency overrides. |
| 14 | `satori@0.33.5` | M / transitive | `node_modules/satori`; `@vercel/og -> vinext` | F1 | Scoped fflate 0.7.5 patch applied; actual WOFF/inflate/SVG rendering checks pass. Satori/Vinext versions preserved. |
| 15 | `undici@7.24.8` | H / transitive | `node_modules/undici`; `miniflare`, introduced by Cloudflare plugin/Wrangler | U1-U21 | 7.29.1 resolves all listed installed-series advisories and supports Node 22. Parent exact pins and embedded code prevent declaring a scoped package override a complete Cloudflare fix. |
| 16 | `vinext@1.1.0` | H / direct dev | `node_modules/vinext`; root manifest | OG -> F1 and CommonJS -> dynamic-import -> glob -> B1 | fflate patch addresses only OG branch. npm's Vinext 0.2.1 downgrade is breaking; braces branch remains. Preserve optional tooling unless removal approved. |
| 17 | `vite-plugin-commonjs@0.10.4` | H / transitive | `node_modules/vite-plugin-commonjs`; `vinext` | Dynamic import -> fast-glob -> B1 | No verified compatible leaf fix. npm suggests breaking Vinext downgrade. |
| 18 | `vite-plugin-dynamic-import@1.6.0` | H / transitive | `node_modules/vite-plugin-dynamic-import`; CommonJS plugin -> Vinext | Fast-glob -> B1 | Same braces blocker. |
| 19 | `wrangler@4.92.0` | M / direct dev | `node_modules/wrangler`; root manifest and Cloudflare plugin | E2; Miniflare -> U/W advisories | Upgrade requires coordinated exact-pinned Cloudflare stack review. npm's plugin 1.63.1 suggestion hides transitive major changes. |
| 20 | `ws@8.18.0` | H / transitive | `node_modules/ws`; Cloudflare plugin and Miniflare | W1-W2 | 8.20.1 fixes W1; 8.21.0 fixes both. Plugin and Miniflare import external ws; Wrangler also embeds ws 8.18.0. Networking override withdrawn pending actual consumer validation; no claim based only on audit disappearance. |

## Leaf advisories and patched versions

Patched versions below refer to the installed release series. Ancestor package advisories in npm are propagation entries, not additional vulnerability reports.

| Key | Advisory | Leaf severity | Baseline affected range | Patched version in relevant series |
| --- | --- | --- | --- | --- |
| B1 | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | High | braces <=3.0.3 | No published fix established |
| E1 | [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | Moderate | esbuild <=0.24.2 | 0.25.0 |
| E2 | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) | Low | esbuild >=0.27.3 <0.28.1 | 0.28.1 |
| F1 | [GHSA-px8p-9vwx-vf98](https://github.com/advisories/GHSA-px8p-9vwx-vf98) | Moderate | fflate >=0.7.0 <0.7.5 | 0.7.5 |
| W1 | [GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx) | Moderate | ws >=8.0.0 <8.20.1 | 8.20.1 |
| W2 | [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) | High | ws >=8.0.0 <8.21.0 | 8.21.0 |

The original esbuild development-server advisory concerns a malicious website reading local development-server responses. Its Windows advisory concerns file access through the esbuild development server. The configured Drizzle command is migration generation, not a server, and standard Next.js scripts use webpack/Next tooling rather than these affected esbuild copies. This limits the currently configured trigger, but does not justify ignoring vulnerable deployment helpers.

The braces advisory requires a deeply nested malicious glob pattern. Existing ESLint and helper patterns are repository-controlled. No public route accepting arbitrary glob patterns was found. CI operating on untrusted source or future helper usage still requires consideration.

The ws advisories concern WebSocket processing. Undici has HTTP, cookie/cache, retry, TLS/proxy and WebSocket vulnerabilities; this broader networking exposure matters if Cloudflare preview/deployment tooling is invoked. Not every advisory feature is demonstrably exercised by this application, but exact installed versions are vulnerable.

### Undici advisory appendix

All 21 advisories are reported for the baseline installed `undici@7.24.8`. The fixed version column is the earliest relevant patched 7.x version for that advisory, not an instruction to install several versions; 7.29.1 covers the entire list.

| Key | Advisory | Severity | Affected 7.x range | Fixed 7.x version | Feature |
| --- | --- | --- | --- | --- | --- |
| U1 | [GHSA-vmh5-mc38-953g](https://github.com/advisories/GHSA-vmh5-mc38-953g) | High | >=7.23.0 <7.28.0 | 7.28.0 | SOCKS5 TLS validation |
| U2 | [GHSA-p88m-4jfj-68fv](https://github.com/advisories/GHSA-p88m-4jfj-68fv) | Moderate | >=7.0.0 <7.28.0 | 7.28.0 | Set-Cookie percent decoding |
| U3 | [GHSA-vxpw-j846-p89q](https://github.com/advisories/GHSA-vxpw-j846-p89q) | High | >=7.0.0 <7.28.0 | 7.28.0 | WebSocket fragment limits |
| U4 | [GHSA-hm92-r4w5-c3mj](https://github.com/advisories/GHSA-hm92-r4w5-c3mj) | High | >=7.23.0 <7.28.0 | 7.28.0 | SOCKS5 pool origin routing |
| U5 | [GHSA-g8m3-5g58-fq7m](https://github.com/advisories/GHSA-g8m3-5g58-fq7m) | Low | >=7.0.0 <7.28.0 | 7.28.0 | SameSite cookie matching |
| U6 | [GHSA-pr7r-676h-xcf6](https://github.com/advisories/GHSA-pr7r-676h-xcf6) | Moderate | >=7.0.0 <7.28.0 | 7.28.0 | Shared-cache whitespace |
| U7 | [GHSA-8xcm-r25x-g524](https://github.com/advisories/GHSA-8xcm-r25x-g524) | Moderate | >=7.0.0 <7.29.0 | 7.29.0 | Retry response desynchronization |
| U8 | [GHSA-4cwx-7wf7-3272](https://github.com/advisories/GHSA-4cwx-7wf7-3272) | High | >=7.0.0 <7.29.0 | 7.29.0 | Private cache parsing |
| U9 | [GHSA-m8rv-5g2x-5cg5](https://github.com/advisories/GHSA-m8rv-5g2x-5cg5) | Moderate | >=7.0.0 <7.29.0 | 7.29.0 | Blob-like body CRLF injection |
| U10 | [GHSA-jr45-8vmc-qm54](https://github.com/advisories/GHSA-jr45-8vmc-qm54) | Moderate | >=7.0.0 <7.29.0 | 7.29.0 | Cache-Control parsing |
| U11 | [GHSA-v3r7-h72x-cjcm](https://github.com/advisories/GHSA-v3r7-h72x-cjcm) | Moderate | >=7.0.0 <7.29.0 | 7.29.0 | Cookie domain/field injection |
| U12 | [GHSA-35p6-xmwp-9g52](https://github.com/advisories/GHSA-35p6-xmwp-9g52) | Low | >=7.0.0 <7.28.0 | 7.28.0 | Keep-alive response queue |
| U13 | [GHSA-pmjh-fq2x-6v4x](https://github.com/advisories/GHSA-pmjh-fq2x-6v4x) | Moderate | >=7.11.0 <7.29.1 | 7.29.1 | RetryHandler body cleanup |
| U14 | [GHSA-r53p-7pc4-xj5r](https://github.com/advisories/GHSA-r53p-7pc4-xj5r) | Low | >=7.0.0 <7.29.1 | 7.29.1 | Retry response splitting |
| U15 | [GHSA-rfgv-xxqx-mfg5](https://github.com/advisories/GHSA-rfgv-xxqx-mfg5) | High | >=7.0.0 <7.29.1 | 7.29.1 | Unrequested WebSocket subprotocol |
| U16 | [GHSA-3xpg-4rpp-hhhm](https://github.com/advisories/GHSA-3xpg-4rpp-hhhm) | Moderate | >=7.15.0 <7.29.1 | 7.29.1 | Unbounded response decompression |
| U17 | [GHSA-2jfj-6hjv-fm6j](https://github.com/advisories/GHSA-2jfj-6hjv-fm6j) | Moderate | >=7.0.0 <7.29.1 | 7.29.1 | Shared-cache Set-Cookie exposure |
| U18 | [GHSA-2gqq-gqf2-x968](https://github.com/advisories/GHSA-2gqq-gqf2-x968) | Low | >=7.1.0 <7.29.1 | 7.29.1 | Dump-interceptor oversized chunks |
| U19 | [GHSA-w293-vg96-wgc3](https://github.com/advisories/GHSA-w293-vg96-wgc3) | High | >=7.24.1 <7.29.1 | 7.29.1 | BalancedPool TLS options |
| U20 | [GHSA-8436-99hf-9mmv](https://github.com/advisories/GHSA-8436-99hf-9mmv) | Low | >=7.0.0 <7.29.1 | 7.29.1 | Unsafe-method caching |
| U21 | [GHSA-rx4f-c7p8-82vq](https://github.com/advisories/GHSA-rx4f-c7p8-82vq) | Moderate | >=7.0.0 <7.29.1 | 7.29.1 | WebSocketStream unclean close |

## Remediation groups and approval boundaries

### A. Compatible fflate patch applied

The retained fix is `satori -> fflate@0.7.5`, using npm's supported scoped override mechanism. Registry metadata publishes that same-series patch and the advisory ends below it. Satori pins 0.7.3, so the scoped patch avoids broad Vinext changes. Strict peer resolution succeeds with the final manifest. The pre-existing Miniflare `sharp@0.35.5` override is preserved.

Targeted security and consumer checks passed: malformed ZIP64 input is rejected, Satori exercises the patched fflate inflate path 15 times while rendering WOFF fonts, the SVG result is 7,302 bytes and exactly matches TTF rendering, and OG rendering produces a 4,987-byte PNG in a CommonJS-context harness. The installed OG bundle's bare ESM dynamic-`require("fs")` failure was observed separately; the harness verifies rendering without changing that bundle or application source. No application route imports this optional OG package, and this observation is not a frontend regression claim.

Expected effect: remove the three moderate package findings for fflate, Satori and `@vercel/og`, addressing the corresponding Vinext dependency branch. Vinext itself remains high through the separate braces chain. No Next.js, React, checkout, routes, Windows environment or deployment target change is needed.

The final full audit confirms that these three entries are removed: 20 -> 17 findings, with 10 high and 7 moderate. Production-only audit remains zero. This is a partial remediation; networking and glob/legacy-loader findings remain.

**Application status:** the scoped patch, final strict clean installation, targeted compatibility checks, lint, contract tests, typecheck, production build, all nine Chrome tests and 13 live local browser checks are verified.

### B. Networking candidates withdrawn; Cloudflare stack upgrade deferred

The plugin 1.37.1 and Miniflare 4 manifests pin ws 8.18.0 and undici 7.24.8 exactly. A coordinated parent upgrade is required to address both external dependencies and embedded networking code rather than merely reduce audit output.

Scoped ws 8.21.0 and undici 7.29.1 overrides were evaluated because they are same-major networking releases compatible with Node 22 and the inspected Miniflare APIs. They were **withdrawn from the final manifest and lockfile**: actual Miniflare worker startup could not complete because the native workerd process crashed with Windows exception `0xc0000005` both inside and outside the sandbox. This prevented required consumer verification. The native workerd version was unchanged during evaluation, and the crash is not attributed to the candidate networking versions. A crash under the original untouched baseline was not established, so no baseline-regression conclusion is asserted.

The executed-copy distinctions are important:

- The Cloudflare plugin bundle embeds **undici 7.24.8** but imports external `ws`.
- The Wrangler CLI bundle embeds **undici 7.24.8 and ws 8.18.0**.
- Miniflare imports external `undici` and `ws`; no corresponding embedded old-version markers were found in its distributed entrypoint.

Installed-dependency overrides cannot patch the plugin/CLI embedded copies. Their networking risk remains outside what the lockfile audit alone can detect. A coordinated upstream-supported release and a working native simulation test remain necessary before clearing this toolchain for deployment use. No networking override is retained.

The [Cloudflare plugin 1.51.1 release](https://github.com/cloudflare/workers-sdk/releases/tag/%40cloudflare%2Fvite-plugin%401.51.1) brings Wrangler 4.120.0 and Miniflare 5.20260801.1-alpha. The published Wrangler 4.120.0 manifest declares the optional peer `@cloudflare/workers-types@^5.20260801.1`, while this frontend pins Workers types 4.20260515.1. npm's recommended plugin 1.63.1 also carries the newer Miniflare 5 alpha stack. The Miniflare and Workers-types major upgrades must be coordinated rather than forcing peer resolution; they are deferred under the explicit approval requirement.

Possible approved paths are: retain Cloudflare and validate an upstream-supported coordinated upgrade including simulation/deployment smoke tests; or explicitly choose the Next.js/Vercel deployment architecture and approve removal of the obsolete optional Cloudflare/Sites toolchain after its references and types are handled. Neither is performed during this controlled patch pass. A supported Miniflare 4 backport would also be preferable if published; none is established here.

Expected effect of an approved stack upgrade: fix Cloudflare ws/undici/esbuild branches while preserving the actual chosen deployment capability. Browser checkout behavior must remain unchanged, and credentials/payment enablement must stay disabled during tests.

### C. Braces / Next ESLint / Vinext glob chain

No fixed published braces version has been established. Do not invent `braces@3.0.4`, override to an unrelated glob implementation, downgrade matching Next.js 16 lint tooling to 14, or remove lint checks to satisfy audit output. An upstream fix with compatible parent ranges is preferred. If unavailable, the owner must explicitly accept documented bounded tooling exposure or approve a supported tooling change. Removing Vinext alone would not fix the retained Next ESLint glob chain.

### D. Drizzle loader / old esbuild

Drizzle's configured migration generator retains its old `@esbuild-kit` loader chain. Updating to published Drizzle 0.31.11 does not remove that chain. The advisory fixes cross old esbuild 0.x API boundaries; an arbitrary override is not supported by evidence. Preserve the configured migration tool, seek an upstream supported update, or obtain approval to remove it after deciding that the frontend SQLite migration tooling is no longer part of the project. Backend MongoDB code and data are unrelated and must remain untouched.

## Verification and final audit

The confirmed results below are from fresh runs after the final canonical fflate-only lockfile was installed; historical setup results are not used as substitutes.

| Check | Fresh result |
| --- | --- |
| Strict-resolution clean `npm.cmd ci --legacy-peer-deps=false` | Passed, exit 0; 761 packages installed |
| `npm.cmd ls --all` | Exit 0; no invalid peer issues; same six optional WASM/native-support entries reported extraneous |
| `npm.cmd run lint` | Passed, exit 0; 0 errors and 12 existing image warnings |
| `npx.cmd tsc --noEmit` | Passed, exit 0 |
| All frontend contract tests | Passed: 19 tests, 0 failed, 0 skipped |
| `npm.cmd run build` | Passed, exit 0; Next.js 16.3.8 webpack build generated 26 static pages; two dynamic detail routes preserved |
| Final-install fflate security and Satori/OG consumer smoke checks | Passed: malformed ZIP64 rejected; 15 inflate calls; SVG 7,302 bytes exactly matches TTF rendering; PNG 4,987 bytes |
| `npm.cmd run test:browser` using installed Chrome | Passed: 9 tests, 0 failures, in 2.2 minutes; viewport widths 320, 375, 390, 430, 768, 1024 and 1440 px, checkout/PayPal fixture behavior, keyboard focus, ACH history and admin reporting |
| `npm.cmd audit --omit=dev` | Verified: 0 vulnerabilities |
| Full `npm.cmd audit` | Verified: 17 findings, 10 high and 7 moderate; 0 critical |
| Local frontend/backend startup and health | Passed: Next.js dev server on localhost:3000, backend health HTTP 200 on localhost:4000; 13 additional real Chrome checks against the local backend passed |
| Capabilities remain disabled; no provider transactions | Confirmed: Stripe card/ACH false, PayPal enabled false, Venmo false; no real or sandbox payment transactions initiated |
| `git diff --check` and final Git review in both repositories | Passed: only the three intended frontend files differ; both branches and HEADs unchanged, staged diffs empty; backend clean |

Contract verification used `node --experimental-strip-types --test` with all three test files explicitly: `tests/auth-client.test.mjs`, `tests/payment-checkout.test.mjs` and `tests/donation-history-reporting.test.mjs`. The targeted fflate security/render checks were rerun successfully after the final canonical clean install.

| Audit | Before | After |
| --- | --- | --- |
| Production | 0 | 0 |
| Full high | 10 | 10 |
| Full moderate | 10 | 7 |
| Full critical | 0 | 0 |
| Full total | 20 | 17 |

### Exact remaining package findings

These 17 entries are from the final full JSON audit after the fflate-only change. They retain the original package locations; no package is added, removed or relocated. The paths are exact lockfile keys, and the advisory keys refer to the leaf tables above.

| Package/version | Severity | Final path(s) | Remaining introducing chain / cause |
| --- | --- | --- | --- |
| `@cloudflare/vite-plugin@1.37.1` | Moderate | `node_modules/@cloudflare/vite-plugin` | Root dev tool -> Miniflare/Undici/ws and Wrangler/esbuild |
| `@esbuild-kit/core-utils@3.3.2` | Moderate | `node_modules/@esbuild-kit/core-utils` | Drizzle -> esm-loader -> esbuild E1 |
| `@esbuild-kit/esm-loader@2.6.5` | Moderate | `node_modules/@esbuild-kit/esm-loader` | Drizzle -> core-utils -> esbuild E1 |
| `@next/eslint-plugin-next@16.3.8` | High | `node_modules/@next/eslint-plugin-next` | Next ESLint -> fast-glob -> micromatch -> braces B1 |
| `braces@3.0.3` | High | `node_modules/braces` | Micromatch under Next ESLint and Vinext; B1 |
| `drizzle-kit@0.31.10` | Moderate | `node_modules/drizzle-kit` | Root migration generator -> legacy loader -> esbuild E1 |
| `esbuild@0.18.20` / `0.27.3` | Moderate | `node_modules/@esbuild-kit/core-utils/node_modules/esbuild`; `node_modules/wrangler/node_modules/esbuild` | Drizzle E1 and Wrangler E2 |
| `eslint-config-next@16.3.8` | High | `node_modules/eslint-config-next` | Root lint configuration -> Next plugin -> glob chain -> B1 |
| `fast-glob@3.3.1` / `3.3.3` | High | `node_modules/fast-glob`; `node_modules/vite-plugin-dynamic-import/node_modules/fast-glob` | Next plugin / Vinext dynamic-import plugin -> micromatch -> B1 |
| `micromatch@4.0.8` | High | `node_modules/micromatch` | Both fast-glob copies -> braces B1 |
| `miniflare@4.20260515.0` | Moderate | `node_modules/miniflare` | Cloudflare plugin / Wrangler -> external Undici U1-U21 and ws W1-W2 |
| `undici@7.24.8` | High | `node_modules/undici` | Miniflare -> U1-U21; separate plugin/CLI embedded copies also remain |
| `vinext@1.1.0` | High | `node_modules/vinext` | Root optional tool -> CommonJS -> dynamic-import -> glob -> B1; OG/fflate branch fixed |
| `vite-plugin-commonjs@0.10.4` | High | `node_modules/vite-plugin-commonjs` | Vinext -> dynamic-import -> glob -> B1 |
| `vite-plugin-dynamic-import@1.6.0` | High | `node_modules/vite-plugin-dynamic-import` | CommonJS plugin -> fast-glob -> B1 |
| `wrangler@4.92.0` | Moderate | `node_modules/wrangler` | Root / Cloudflare plugin -> esbuild E2 and Miniflare -> Undici/ws |
| `ws@8.18.0` | High | `node_modules/ws` | Cloudflare plugin / Miniflare -> W1-W2; separate Wrangler CLI embedded copy remains |

**Security gate:** cannot pass an unrestricted tooling/deployment vulnerability gate while the remaining vulnerable dependency chains are retained without an explicitly approved remediation or risk decision. Passing application tests and a zero production audit do not override this conclusion.

## Final file scope and next action

Final scope is the narrowly scoped Satori/fflate package manifest override, the reproducible npm lockfile, and this evidence report. No source/UI/provider configuration, backend application code, branch changes, commits or pushes are authorized.

The final lockfile changes only one resolved package version: **fflate 0.7.3 -> 0.7.5**. npm also marks 27 optional Sharp transitive package entries `dev: true` during normal strict resolution. These metadata changes do not upgrade those packages. No packages are added, removed or relocated. No direct dependency versions or scripts are changed; undici and ws retain their original versions after withdrawal of the unverified candidates. The minimal final lockfile was reproduced through normal npm resolution from the saved clean baseline; no installed package source was manually edited.

The final uncommitted files are exactly `package.json`, `package-lock.json` and `docs/phase-4e2b-tooling-security.md`. The first two are modified and the report is new; all remain unstaged. Frontend remains on `backend-integration` at `5f6c0f506ab4501467c55d9edc60790b3bda4cf0`; backend remains clean on `main` at `ba08cff1ad0ae15ee0c22488a6e14c56acded402`. Staged diffs are empty, and no commit, push, merge or branch switch occurred. Local environment files, dependencies, build output and test reports remain ignored and untracked. The existing MongoDB 5 service and its data were not changed; no backend application/configuration or payment-secret changes were made.

Before extending remediation, request the operator's choice to preserve and upgrade the Cloudflare stack or approve retiring the optional hosting toolchain. Separately require an upstream braces fix or an explicit risk decision for lint/build use, and a supported Drizzle loader remedy or approved tooling removal. Do not deploy or enable payments as part of these decisions.
