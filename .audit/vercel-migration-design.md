# Stow landing page: GitHub Pages to Vercel

## Goal and boundaries

Deploy only `landing/` to Vercel, preserve the browser extension, synchronize GitHub, and leave
one canonical public landing page. Do not publish extension development files or purchase a domain.

## Chosen approach

Use the `stow-tabs` Vercel project, with `landing` as its root directory and `main` as production.
Vercel's ignored-build command compares the current and previous commits under `landing/`.
The page needs no build command or server function.

Replace the GitHub Pages artifact with a minimal, noindex redirect to the Vercel URL. Keep the
redirect workflow manually dispatched so it does not race future GitHub deployments. Keep the
existing Search Console verification file: it still belongs to the old URL-prefix property.

## Evidence

- Local and deployed `pnpm check:landing` passed responsive, accessibility, menu, motion,
  no-JavaScript and SEO checks.
- Vercel's CLI upload inventory excluded `.env.local`, `.vercel/`, `demo.html`, `HERO-DEMO.md`
  and extension files.
- `https://stow-tabs.vercel.app/` returned the landing page with the development files absent.
- Vercel project inspection confirmed GitHub repository `code-sharad/stow`, root directory
  `landing`, and production branch `main`.

## Remaining ownership

The repository owner can connect `stowtabs.com` later. Search Console needs a separate property
and verification file for the Vercel URL. DNS records are valid only for the owner's chosen domain
and should be copied from Vercel's domain setup screen rather than assumed.
