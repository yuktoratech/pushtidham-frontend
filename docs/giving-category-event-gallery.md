# Giving categories and Event galleries

The public Donate page now requests active categories, then category-filtered Giving options. Changing category clears Giving and amount selection. The selected Giving supplies fixed/custom USD rules and remains authoritative at checkout. Category ID/slug and Giving ID/slug survive checkout navigation; no public Event can be selected.

Public navigation uses Donate as the entry point. Existing /giving and /giving/:slug routes stay available for bookmarks. Event pages remain informational and show their cover plus ordered gallery images with accessible controls, autoplay, pause, swipe and reduced motion support.

Admin: /admin/giving-categories manages categories. Giving supports category assignment/filtering while retaining legacy classification. Events support cover selection and multiple gallery previews/uploads/reordering/alternative text/removal. Upload progress/errors are per file; unsaved files are not silently saved.

The GivingCategory Atlas migration has completed: seven categories exist and all 23 active Giving records have category assignments. The two inactive records remain unassigned. Seven category artworks and English descriptions are client-approved and prepared locally, but every Atlas category image and description field remains empty until a separately authorized category-only R2/Atlas migration.

All existing payment demo guards remain active. No payment provider activation is part of this change. Historical Event/Giving donations, receipts and reports retain their existing classification and amounts.

See the backend docs/giving-categories-event-gallery.md for schema/API contracts, the exact ID mapping, guarded migration preparation, backup requirements and rollback. See r2-category-gallery-migration-manifest.json for the source/target image plan. The category migration is complete; the category-only R2 image migration has not been executed. Current audit found five R2 objects, seven empty category images and descriptions, and no Event gallery entries. The seven local images and descriptions are approved, but their seven future R2 uploads and category image/description field updates still require separate authorization.

## Image storage compatibility

New admin uploads may use immutable nested keys based on a validated entity slug and the optimized image SHA-256. Existing flat UUID keys and every current database URL remain valid. Slug-less older clients continue to get flat UUID keys. Existing local images remain as fallbacks. Home-slider and official-logo prefixes are protected and are not managed by catalog upload cleanup.

The frontend and backend image size limit is 8 MiB per source image. Only JPEG, PNG and WebP are accepted by the admin upload pipeline; signature validation, Sharp decoding and output checks remain enabled. Replaced images, cancelled uploads and removed gallery references are retained. The cleanup endpoint denies deletion until a reviewed cleanup process can prove ownership, complete references and rollback expiry.

Festival SVGs are trusted, repository-owned educational illustrations. Keep local copies as fallbacks. A static SVG migration requires the offline allowlist validator, client approval, and a separate immutable static asset path; raw SVG is never accepted by the admin uploader. The version 2 manifest records the approved category artwork, but intentionally remains execution-blocked until a fresh R2 inventory, backup, category-edit freeze and separately approved category-only rollout. Run `npm run validate:r2-manifest` locally; it reports these broader migration blockers without R2 credentials.
