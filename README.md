# Champ Real Estate

A custom, responsive website for Darryl Champion and **champrealestate.org**. Forest green and ivory branding, local Garden of the Gods photography, military buyer guidance, and six individually written community pages. Built with plain HTML, CSS, JavaScript, and Node.js; no package dependencies.

## Run locally

Requires Node.js 22.9 or later.

```powershell
npm run dev
```

Open http://localhost:3000. Saved source edits automatically rebuild the pages, `llms.txt`, sitemap, robots.txt, and Markdown companions. Refresh the browser to see changes. Restart the dev command after changing server code or environment settings. Use `npm run watch` to regenerate files without starting another server.

```powershell
npm run build
npm test
```

`dist/` contains the generated website. Edit `build.mjs` for page templates, `communities.mjs` for community content, `public/styles.css` for styling, and `public/app.js` for interactions.

## Included

- Responsive navigation, keyboard-accessible dialogs, native expandable FAQs, focus indicators, and reduced-motion support.
- A home-planning tool that creates personalized steps and a downloadable plan without collecting contact details.
- Six search-friendly community routes: Colorado Springs, Fountain, Monument, Falcon & Peyton, Security-Widefield, and Manitou Springs.
- Unique titles, meta descriptions, canonical links, real estate business structured data, Open Graph metadata, XML sitemap, robots.txt, and a public `llms.txt` business guide with Markdown page companions.
- Locally hosted photography and fonts. No analytics or advertising scripts.
- A contact endpoint with input validation, body-size limits, same-origin checks, a honeypot, rate limiting, upstream timeouts, and explicit success/failure handling.

## Keep discovery files current

The owner's standing requirement is recorded in `AGENTS.md`: **rebuild both discovery files after every completed change or edit**. `npm run build`, `npm test`, and `npm start` all regenerate them. `npm run dev` and `npm run watch` also watch for saved edits, including content and documentation changes.

- `/llms.txt` contains the business identity, military and veteran focus, service area, annotated page links, official VA resources, and clear boundaries around lending, listings, and contact delivery. `discovery.mjs` generates it from the public business configuration and the same page registry used by the sitemap.
- `/sitemap.xml` lists every registered, canonical HTML page exactly once. Error pages, API routes, fragment links, assets, and duplicate Markdown companions are excluded. `robots.txt` references the canonical sitemap.
- Each page has a generated `index.md` companion derived from its actual content. HTML discovery links point to the Markdown version and `llms.txt`. When adding an indexable page, use `shell()` in `build.mjs` so both discovery files include it automatically.
- `.site-content-state.json` records hashes of public page content/metadata and last-modified dates. Keep this file in source control and between builds; unchanged content keeps its date. An unrelated edit or a repeated build regenerates the sitemap without claiming the pages changed. If this file is deliberately removed, the next build establishes a new baseline.
- Review the business summary in `discovery.mjs` whenever facts or services change. Never hand-edit generated files in `dist/`. The guide does not include secrets or private lead data.

The AI guide follows the [llms.txt proposal](https://llmstxt.org/), and the sitemap uses [Google's guidance on canonical URLs and accurate last-modified values](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). These files assist discovery; they do not guarantee indexing, rankings, or use by an AI service.

## Connect business details and inquiries

1. Add Darryl’s verified public email, phone, brokerage, and license disclosure in `site.config.mjs`. These were not provided and are intentionally not invented.
2. Copy `.env.example` to `.env`. Set `CONTACT_WEBHOOK_URL` to the business-approved lead receiver, and optionally `CONTACT_WEBHOOK_TOKEN` for bearer authorization. The server loads `.env` automatically. Keep it private.
3. The receiver must accept POST JSON fields `source`, `name`, `email`, `phone`, `goal`, and `message`, and return a successful HTTP status only after accepting the inquiry. No live delivery service was configured or contacted during development.
4. Rebuild and restart. Perform a real delivery check with an authorized test inquiry before launch.

Without a webhook, a configured email enables a clearly labeled email-app handoff. Without either, visitors can download an inquiry draft; the UI explicitly states that it has **not been sent**. No unconfigured form reports success. The home plan itself is generated in the visitor’s browser and is not submitted.

The in-memory limit permits five contact submissions per IP per ten minutes. For deployment behind a reverse proxy, configure rate limiting at the proxy or hosting layer; the included server intentionally does not trust arbitrary forwarded IP headers. For multi-instance deployment, use a shared rate limiter.

## Publish at champrealestate.org

The domain has not been registered, connected, or deployed by this project.

- **Node hosting:** deploy the project, run `npm run build`, then `npm start`. Set `HOST=0.0.0.0` when the hosting platform requires it. Terminate HTTPS at the platform or reverse proxy and keep secrets in its environment settings.
- **Static hosting:** upload `dist/` to a host that supports directory index pages. The home planner, community pages, and FAQs work without a server. Contact uses the configured email handoff or draft download unless an equivalent `/api/contact-status` and `/api/contact` backend is provided. A static deployment should never expose webhook credentials.
- Connect `champrealestate.org` through the chosen host’s custom-domain settings and DNS instructions. Enable HTTPS and choose a redirect from `www` to the canonical non-www domain.
- Confirm public business details and disclosures, replace the typographic Darryl profile card with an approved portrait if desired, and verify inquiry delivery.
- Verify ownership with Google Search Console and submit `https://champrealestate.org/sitemap.xml`. Keep the business name and contact details consistent with the business’s verified local directory profiles.

## Summit Peak Property Management connection

Darryl Champion owns both businesses. Champ Real Estate serves buyers and sellers; Summit Peak Property Management serves landlords and renters. The Champ site includes a “Rent or manage” navigation link, a homepage section with separate landlord and renter paths, links in every page's footer, and referral links in the home planner and consultation dialog. Links are direct, open in the same tab, and do not transfer form details or append tracking parameters.

The partner details and destinations are centralized in `site.config.mjs` under `propertyManagement`. Both paths currently use the user-provided `https://summitpeakpm.com/`; dedicated owner and renter pages could not be verified during implementation. Update `ownerUrl` and `renterUrl` once their permanent public destinations are known, then rebuild. `llms.txt` describes common ownership and the distinct services and includes both links. Summit Peak URLs are external links and do not belong in Champ's sitemap or its business `sameAs` field.

Suggested reciprocal copy for the Summit Peak project: “Ready to buy or sell? Darryl Champion also owns Champ Real Estate, helping buyers and sellers in Colorado Springs and El Paso County.” Link “Explore buying or selling” to `https://champrealestate.org/#how-we-help`. Summit Peak's site was not modified in this project.

## Sources and assets

- VA loan copy: https://www.va.gov/housing-assistance/home-loans/loan-types/purchase-loan/ and https://www.va.gov/housing-assistance/home-loans/how-to-request-coe/ . Eligibility and approval are lender/VA determinations, not promises by this site.
- Colorado Springs photograph: Melanie Magdalena, Garden of the Gods, https://unsplash.com/photos/landscape-photography-of-green-trees-dDWLTcR9Gpc (Unsplash License).
- Illustrative residential photograph: https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde (Unsplash). Not a listing or a claim about a specific community.
- Typography: DM Sans and Manrope, via Google Fonts, under the SIL Open Font License. License texts are in `public/assets/`.

Automated tests verify local page/asset links, metadata, schema JSON, HTTP routes, and contact delivery success/failure behavior. Browser visual testing was unavailable in the development session and should be performed on desktop and mobile before publication.
"# Champrealestate" 
