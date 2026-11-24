# Deploy the Stow landing page to Vercel

Definition of done: Vercel serves the static `landing/` site at a production HTTPS URL, the page and assets load without browser errors, and the public URL matches the canonical, social, sitemap and robots metadata. The user receives a short custom-domain recommendation. Scope is one static site, one Vercel project and up to four small configuration changes. Rigor is high for the public production change and the unchanged browser checks. The GitHub repository is `code-sharad/stow`, and the Vercel account is `code-sharad`.

- [x] Read the Principles section of poteto-mode.
- [ ] Frame the deployment and confirm the existing landing-page baseline.
- [ ] Design the deployment from the repository's static-site setup and official Vercel CLI behavior.
- [ ] Inspect available Vercel project and domain names. Choose `stow-tabs` for Vercel and assess `stowtabs.com` as the custom-domain recommendation.
- [ ] Prepare a Vercel configuration that serves only `landing/` and excludes the hero development files.
- [ ] Update public URL metadata and its existing tests only when the production URL is established.
- [ ] Run the landing-page browser, accessibility, responsive and metadata checks.
- [ ] Inspect a Vercel preview in a real browser before production.
- [ ] Obtain explicit production deployment confirmation at the deployment gate.
- [ ] Deploy the reviewed site to Vercel production.
- [ ] Verify the production page, assets and metadata against the public URL.
- [ ] Connect the Vercel project to `code-sharad/stow` when supported without changing the extension deployment.
- [ ] Audit the decision trail and hand back the live URL, checks and custom-domain recommendation.
