# Stow Landing Page --- Design & Layout Specification

**Version:** 1.0\
**Product:** Stow\
**Reference implementation:** `landing/`\
**Canonical URL:** https://stow-tabs.vercel.app/\
**Primary goal:** Turn visitors into confident Stow installs without
compromising the product's local-first identity.

------------------------------------------------------------------------

## 1. Product positioning

### Core promise

**Close the tabs. Keep the work.**

Stow saves browser tabs into searchable stacks so people can close
clutter without losing the pages they intend to revisit.

### Supporting message

Save a whole window or an individual tab, find saved pages later, and
restore only what you need. Your library stays in your browser profile.

### Audience

Primary: - People who routinely keep many tabs open. - Developers and
technical users working across projects. - Researchers and students
collecting reference material. - People who want to reduce browser
clutter without losing context.

Secondary: - Users migrating from OneTab or bookmark-based workflows. -
Privacy-conscious users who prefer local storage over hosted accounts.

### Positioning principles

1.  Sell the outcome before listing features.
2.  Make local-first privacy a verifiable product property, not a vague
    slogan.
3.  Show the real interface; avoid generic SaaS illustrations and
    invented UI.
4.  Use concise, specific language. Avoid inflated claims such as "10x
    productivity."
5.  Keep the page focused on one action: install Stow.

------------------------------------------------------------------------

## 2. Conversion strategy

### Primary conversion

Install Stow.

The page must provide a clear installation route for each browser that
is actually supported by the published release.

-   **Chrome / Chromium:** "Download for Chrome" or "Install for
    Chrome," depending on the available distribution.
-   **Firefox:** "Install for Firefox" only when a public Firefox
    Add-ons listing is available.
-   **Source build:** "View source" as the secondary action.

Do not present "Load unpacked" as the primary public-facing CTA. It is
appropriate only for developer installation instructions.

### Trust signals near the first CTA

Use a compact factual line:

`No account · No cloud · No tracking`

Only make claims that match the current extension implementation and
permission manifest.

### Conversion path

`Problem → Product promise → Real UI → Feature proof → Privacy proof → Install`

------------------------------------------------------------------------

## 3. Information architecture

Use one page with a compact sticky header and six content areas.

``` text
┌──────────────────────────────────────────────────────────────────┐
│ STOW                         FEATURES  PRIVACY       INSTALL      │
├──────────────────────────────────────────────────────────────────┤
│ HERO                                                             │
│ Close the tabs. Keep the work.       Product receipt / summary   │
│ Short explanation + install CTA                                   │
│ Trust line                                                       │
│                                                                  │
│ ┌──────────────────── REAL STOW LIBRARY SCREENSHOT ────────────┐ │
│ └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│ HOW IT WORKS                                                     │
│ Save → Search → Restore                                          │
├──────────────────────────────────────────────────────────────────┤
│ FEATURES                                                         │
│ Capture · Search · Organize · Restore · Import/Export · Keyboard │
├──────────────────────────────────────────────────────────────────┤
│ PRIVACY                                                          │
│ Local-first explanation + data storage table                     │
├──────────────────────────────────────────────────────────────────┤
│ INSTALL                                                          │
│ Browser-specific installation path and requirements              │
├──────────────────────────────────────────────────────────────────┤
│ FOOTER: source · privacy · changelog · version                   │
└──────────────────────────────────────────────────────────────────┘
```

### Section order

1.  Header
2.  Hero and primary CTA
3.  Actual product screenshot
4.  How it works
5.  Feature grid
6.  Privacy and data handling
7.  Installation
8.  Footer

The existing "parts" and "ledger" structure can be retained, but "How it
works" should make the basic workflow understandable before visitors
encounter detailed feature tiles.

------------------------------------------------------------------------

## 4. Header

### Desktop layout

-   Height: 56 px.
-   Content width: 1120 px maximum.
-   Left: Stow icon and wordmark.
-   Center: `features`, `privacy`, `install`.
-   Right: local-only status and primary install CTA.
-   Sticky at the top with a subtle bottom border after scrolling.

### Mobile layout

-   Height: 52 px.
-   Left: icon and wordmark.
-   Right: menu button.
-   Menu opens a simple full-width navigation panel with section links
    and the install CTA.
-   Close on Escape and return focus to the menu button.

### Header copy

-   Brand: `stow`
-   Navigation: `features`, `privacy`, `install`
-   Status: `local-only`
-   CTA: `get Stow` or browser-specific install label

------------------------------------------------------------------------

## 5. Hero section

### Goal

In five seconds, visitors should understand: - What Stow does. - Why it
is useful. - Why it is trustworthy. - What to do next.

### Recommended copy

**Kicker:** `A LOCAL-FIRST TAB MANAGER`

**H1:** \> Close the tabs.\
\> Keep the work.

**Body:** \> Stow saves your open tabs as searchable stacks, so you can
clear the clutter and return to what matters whenever you need it.

**Primary CTA:** `Get Stow`

**Secondary CTA:** `View source`

**Trust line:** `No account · No cloud · No tracking`

**Compatibility note:** Show only verified browser support and minimum
versions.

### Layout

Desktop: - Two-column grid, approximately 7/5. - Left: kicker, headline,
body, CTAs, trust line. - Right: compact product summary panel. - Actual
library screenshot spans the full content width below the copy.

Mobile: - Single column. - Headline and CTA first. - Product summary
below the CTA. - Screenshot follows at full available width. - Avoid
placing important copy inside an image.

### Product summary panel

Use a restrained, terminal-inspired panel that explains the workflow. It
may show illustrative values, but must be labelled "example" or "demo."

Suggested rows: - `tabs captured` - `saved stacks` - `tabs restored` -
`storage` - `network`

Never present illustrative numbers as measured performance or real user
statistics.

------------------------------------------------------------------------

## 6. Product screenshot system

Real product UI is a core trust asset.

### Required screenshots

1.  **Library overview:** Show saved stacks and tab rows.
2.  **Quick capture:** Show the browser toolbar icon and Stow popup.
3.  **Search:** Show a query and matching saved tabs.
4.  **Restore:** Show restoring a stack or selected tabs.
5.  **Privacy:** Show the local-only status or settings relevant to
    privacy, if present.

### Screenshot rules

-   Use real captures from the current extension build.
-   Do not generate fake browser controls, tab titles, counts, or
    settings.
-   Keep text legible at the rendered size.
-   Use a thin border and a simple title strip, not a decorative device
    mockup.
-   Provide dark and light captures when the site supports both themes.
-   Use descriptive alt text.
-   Use WebP where suitable and provide explicit intrinsic dimensions.
-   On mobile, use a purpose-captured vertical composition rather than
    shrinking a desktop screenshot until text becomes unreadable.

### Screenshot captions

Keep captions factual and benefit-led: - "Your saved tabs, grouped into
searchable stacks." - "Stow the current window without losing its
tabs." - "Find a page by title, URL, or domain." - "Restore a whole
stack or only the tabs you need."

------------------------------------------------------------------------

## 7. How it works

### Heading

**A calmer browser in three steps.**

### Three-step sequence

**01 --- Stow**\
Save a whole window or an individual tab as a stack.

**02 --- Find**\
Search saved pages by title, URL, domain, or stack name.

**03 --- Restore**\
Bring back one page, selected tabs, or an entire stack.

### Visual layout

-   Three equal columns on desktop.
-   A numbered vertical sequence on mobile.
-   Each step uses a real product crop or a minimal UI still.
-   Keep descriptions to one or two sentences.

------------------------------------------------------------------------

## 8. Feature grid

### Heading

**Everything you need to put tabs away---and find them again.**

Use a 3-column grid on desktop, 2 columns on tablet, and one column on
mobile. Use flat bordered cells rather than floating cards.

### Feature content

#### Capture

**Save the whole window.**\
Turn the current window into a saved stack. Keep pinned tabs open if
that is the actual product behavior.

#### Search

**Find it from half a memory.**\
Search saved pages by title, URL, domain, or stack name. Mention fuzzy
matching or filters only if implemented.

#### Organize

**Keep related tabs together.**\
Rename, pin, reorder, merge, or manage stacks using only capabilities
present in the current release.

#### Restore

**Pick up where you left off.**\
Restore an individual tab, selected tabs, or a complete stack.

#### Import and export

**Bring your existing tabs with you.**\
List supported import and export formats precisely. Avoid implying
compatibility with formats that have not been tested.

#### Keyboard

**Keep your hands on the keys.**\
Show the supported shortcuts with platform-specific labels. Do not show
macOS-only symbols as if they apply to Windows and Linux.

### Feature tile anatomy

1.  Small mono category label.
2.  Benefit-led heading.
3.  One short explanatory paragraph.
4.  Real UI still or shortcut display.
5.  Optional factual metadata row.

------------------------------------------------------------------------

## 9. Privacy section

### Heading

**Your tabs stay on your device.**

### Body

> Stow is designed to keep your browsing library local to your browser
> profile. It does not need an account or a Stow-hosted server to save
> and restore your tabs.

The final published wording must be checked against the current code,
browser APIs, permissions, and any optional backup behavior.

### Data table

Use a real semantic table:

  Data                    Where it is stored                      Sent to Stow servers
  ----------------------- --------------------------------------- ----------------------
  Saved tabs and stacks   Browser extension storage               No
  Preferences             Browser-local storage                   No
  Optional backup files   User-selected local download location   No

Update storage labels to match the implementation exactly. If favicons
or other browser-managed data are involved, explain them accurately.

### Privacy design

-   No stock shield illustration.
-   No vague "military-grade" claims.
-   Use a clear data-flow table.
-   Show a compact `LOCAL ONLY` label.
-   Explain what happens when the extension is uninstalled and how users
    can export a backup.

------------------------------------------------------------------------

## 10. Installation section

### Heading

**Get started in a minute.**

The installation section must match the actual distribution channel.

### Store installation

If a public store listing exists: - Use a direct store CTA. - Link to
the official listing. - Show the supported browser and minimum
version. - Avoid sending users through GitHub unless they explicitly
want the source.

### Manual installation

If manual installation is the only available method: 1. Download the
latest release archive. 2. Open the browser's extensions page. 3. Follow
the browser-specific developer installation steps. 4. Confirm that the
extension is loaded.

Use separate instructions for Chromium and Firefox. Do not imply that
Chromium's "Load unpacked" workflow applies to Firefox.

### Secondary links

-   `View source`
-   `Read the changelog`
-   `Read the privacy details`

------------------------------------------------------------------------

## 11. Footer

Include: - Stow icon and wordmark. - `local-first tab manager`. - Source
repository. - Privacy details. - Changelog. - Current version.

Keep the footer compact. Do not add a newsletter form or social links
unless there is a real maintenance plan for them.

------------------------------------------------------------------------

## 12. Visual design system

### Design direction

**Quiet utility. Editorial clarity. Terminal-inspired precision.**

The site should feel like an extension of the Stow product UI:
deliberate, restrained, technical, and trustworthy.

Avoid: - Gradient blobs. - Glassmorphism. - Floating dashboard
mockups. - Excessive rounded cards. - Decorative illustrations unrelated
to the product. - Large animated backgrounds. - Fake testimonials or
fabricated usage metrics.

### Color tokens

  Token            Dark        Light
  ---------------- ----------- -----------
  Canvas           `#0C0C0C`   `#F3F1EC`
  Sheet            `#202020`   `#E9E6DF`
  Raised           `#252225`   `#F7F5F0`
  Border           `#333033`   `#CFC9BE`
  Strong border    `#47434A`   `#B4ADA0`
  Primary text     `#EEEEEE`   `#1E1D1B`
  Secondary text   `#B8B8B8`   `#46433E`
  Muted text       `#8A8A8A`   `#5C5851`
  Accent           `#A5A0B6`   `#5B566E`
  Link             `#5C9CF5`   `#2F5F9E`
  Success          `#7FC7A4`   `#2F6B4F`

Use the existing Stow palette. Orange belongs to the product icon and
may be used sparingly in product imagery; do not introduce it as a
competing site-wide accent.

### Typography

-   UI and headings: Inter variable.
-   Metadata, labels, version numbers, commands, and shortcuts: system
    monospace.
-   H1: `clamp(42px, 6vw, 68px)`, weight 600, line-height around 0.98,
    tracking `-0.045em`.
-   H2: `clamp(28px, 3.5vw, 40px)`, weight 600.
-   Body: 16--17 px, line-height 1.6--1.7.
-   Small labels: 10--11 px monospace, uppercase, letter spacing
    `0.12em`.

### Shape and borders

-   Prefer square corners or small 2--4 px radii.
-   Use 1 px borders to structure sections.
-   Avoid large soft shadows.
-   Use accent borders only for active states and primary emphasis.

### Spacing

-   8 px base spacing unit.
-   Main content maximum width: 1120 px.
-   Desktop outer padding: 32 px.
-   Tablet outer padding: 28 px.
-   Mobile outer padding: 20 px.
-   Desktop section spacing: 72--88 px.
-   Mobile section spacing: 44--56 px.

------------------------------------------------------------------------

## 13. Responsive layout

  -----------------------------------------------------------------------
  Breakpoint                          Layout
  ----------------------------------- -----------------------------------
  ≥ 1120 px                           1120 px content, 2-column hero,
                                      3-column features

  960--1119 px                        Same structure with reduced outer
                                      padding

  640--959 px                         Stacked hero, 2-column features

  \< 640 px                           Single-column layout, compact
                                      screenshots, mobile navigation
  -----------------------------------------------------------------------

### Mobile requirements

-   No horizontal scrolling at 320 px.
-   CTA buttons remain easy to tap.
-   Body text remains at least 15--16 px where practical.
-   Screenshots use mobile-specific crops.
-   Tables become stacked labelled rows if necessary.
-   Navigation is keyboard- and screen-reader-accessible.

------------------------------------------------------------------------

## 14. Interaction and motion

Keep interaction minimal: - Sticky header. - Smooth anchor navigation. -
Clear hover and focus states. - Short, subtle section reveal only if it
does not hide content from users. - Respect `prefers-reduced-motion`. -
All essential content must remain visible with JavaScript disabled.

Do not use: - Parallax. - Auto-playing video. - Carousels for essential
information. - Scroll-jacking. - Typewriter effects. - Continuous
decorative animation.

------------------------------------------------------------------------

## 15. Accessibility

-   One H1 per page.
-   Correct heading hierarchy.
-   Semantic `header`, `nav`, `main`, `section`, `footer`, and table
    markup.
-   Skip link.
-   Descriptive alt text for meaningful product screenshots.
-   Empty alt text for decorative images.
-   Visible keyboard focus.
-   Sufficient text and control contrast in both themes.
-   Menu button exposes `aria-expanded` and `aria-controls`.
-   Menu closes with Escape and restores focus.
-   Reduced-motion preference is honored.
-   Test with keyboard navigation and an automated accessibility
    checker.

Target WCAG 2.2 AA.

------------------------------------------------------------------------

## 16. SEO and social metadata

### Suggested title

`Stow — Close the tabs. Keep the work.`

### Suggested meta description

`Save browser tabs as searchable stacks. Close the clutter, find pages later, and restore only what you need. Local-first, with no account or cloud sync.`

### Metadata checklist

-   Canonical URL.
-   Open Graph title, description, URL, and image.
-   Twitter large-image card.
-   Favicon and touch icon.
-   `SoftwareApplication` structured data only with accurate browser and
    pricing information.
-   Sitemap and robots file.
-   Browser compatibility language consistent across metadata and
    visible page copy.

Do not claim Firefox support in metadata until the Firefox release is
publicly installable.

------------------------------------------------------------------------

## 17. Performance requirements

-   Static HTML, CSS, and minimal JavaScript.
-   No analytics, cookies, or third-party embeds unless explicitly
    approved.
-   Self-host fonts.
-   Preload only critical font assets.
-   Compress screenshots to WebP or AVIF where appropriate.
-   Include intrinsic image dimensions.
-   Lazy-load below-the-fold images.
-   Avoid shipping a UI framework for a static marketing page.

### Performance targets

-   Lighthouse Performance: 95+
-   Accessibility: 100 target
-   Best Practices: 100 target
-   SEO: 100 target

Targets must be validated on the deployed page; they are not assumed
results.

------------------------------------------------------------------------

## 18. Content accuracy and release checklist

Before publishing, verify:

-   [ ] Chrome installation CTA points to the correct release or store
    listing.
-   [ ] Firefox CTA appears only when the Firefox listing is live.
-   [ ] Browser support and minimum versions match the current build.
-   [ ] Every feature described exists in the released extension.
-   [ ] Keyboard shortcuts match each operating system.
-   [ ] Privacy claims match permissions and actual network behavior.
-   [ ] Storage locations match implementation.
-   [ ] Optional backup behavior is explained accurately.
-   [ ] Screenshots come from the current release.
-   [ ] Screenshot captions describe what is actually visible.
-   [ ] All links work.
-   [ ] Mobile layout tested at 320, 375, 640, and 768 px.
-   [ ] Desktop layout tested at 1024, 1280, and 1440 px.
-   [ ] Keyboard-only navigation tested.
-   [ ] Dark and light themes tested.
-   [ ] Reduced-motion mode tested.
-   [ ] Lighthouse and accessibility checks completed.

------------------------------------------------------------------------

## 19. Success measures

Measure the funnel without adding invasive tracking to the extension.

Useful metrics, if collected through privacy-respecting and
consent-aware website analytics: - Landing page visits. - Clicks on
browser-specific install links. - Clicks to GitHub releases. -
Install-to-first-use feedback gathered voluntarily.

Do not add analytics to the extension itself merely to measure marketing
performance. Prefer store-provided aggregate install statistics and
privacy-preserving website measurement.

------------------------------------------------------------------------

## 20. Final design principle

Stow should not look like a startup trying to sell a complicated
platform.

It should look like a small, dependable tool built by someone who
understands the frustration of too many tabs.

**Close the tabs. Keep the work.**
