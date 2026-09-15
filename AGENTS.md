# Project instructions

## Required after every change

The owner explicitly requires `llms.txt` and the sitemap to stay current after every change or edit.

- After each completed set of edits, run `npm run build` (or `npm test`, which builds first). This regenerates `dist/llms.txt`, `dist/sitemap.xml`, `dist/robots.txt`, and the Markdown page companions.
- Review discovery content when business facts, services, geography, contact details, page text, or routes change. Update `discovery.mjs` and `site.config.mjs` when their summaries need to change; never leave misleading or stale information.
- Register every indexable page through the `shell()` function in `build.mjs`. Both discovery files use this page registry. Exclude error pages, API endpoints, and duplicate Markdown versions from the XML sitemap.
- Do not hand-edit generated files in `dist/`. Edit their source and rebuild.
- Preserve `.site-content-state.json` in source control. It tracks public content hashes and accurate last-modified timestamps. Do not bump timestamps for unchanged content or unrelated edits.
- Run `npm test` when discovery generation, routing, or content structure changes. Fix stale links and generation failures before reporting completion.
- During ongoing local editing, use `npm run dev` or `npm run watch` to regenerate automatically on saved edits. The final build remains required even if the watcher is running.

Business contact details and loan approval claims must never be invented. The public AI guide must contain only verified public business information, never credentials, private inquiries, or environment variables.
