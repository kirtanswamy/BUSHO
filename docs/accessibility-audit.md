# BUSHO accessibility and interface audit — automated baseline

**Reviewed:** 17 November 2026  
**Target:** WCAG 2.2 AA. This file records static checks and targeted color-token corrections only; it is not a conformance report.

## Checks made

- The public landing page has a skip link and a visible `:focus-visible` treatment.
- The primary portal stylesheet defines a shared `:focus-visible` outline and a skip-link focus state.
- The worker, supervisor and administrator pages were checked for literal `<img>` elements. No such elements were found in those HTML pages; decorative graphics are CSS/SVG-based. If meaningful raster images are added later, they need suitable alternative text.
- No positive `tabindex` values were found in the reviewed main portal markup.
- The landing-page soft-text token and several pale small-text colors were darkened to improve contrast. The administrator workspace's low-contrast secondary text colors were also darkened. A sample contrast check against the primary light backgrounds found the revised landing-page soft token at approximately 4.8:1, above the 4.5:1 normal-text threshold.

## Still required

- Full rendered contrast audit of every text/background state, including hover, disabled, badges, charts, form errors and translated content.
- Keyboard-only walkthrough of every portal and modal/dialog; verify focus order, focus trapping, escape handling and return focus.
- Screen-reader testing with at least NVDA/Firefox or Chrome and VoiceOver/Safari.
- 200% zoom and 320 CSS-pixel reflow; check tables and long labels.
- Native-speaker review of Hindi, Tamil, Telugu, Bengali and Marathi labels, validation and status announcements.
- Manual review of dynamic `aria-live` content, custom controls and chart alternatives.

Do not claim WCAG 2.2 AA conformance until these checks are completed and documented.