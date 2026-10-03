---
title: Colophon
layout: default
type: static
---

This site is built with [Jekyll](https://jekyllrb.com/) and hosted on [GitHub Pages](https://pages.github.com/). There is no framework, no bundler, and no client-side router.

The architecture, layout structure, and colour palette are adapted from [muan.co](https://muan.co) ([source](https://github.com/muan/site)), whose non-content files are MIT licensed. The writing, images, and personal marks on this site are my own.

## Type

Body text is [IBM Plex Sans](https://github.com/IBM/plex), served from this domain rather than from Google Fonts — it keeps two third-party connections off the critical path, and no request for this page leaves badhrinadh.com. The roman is a variable font covering weights 300 to 600, so headings and body text are one download. Monospace is whatever your system provides.

## JavaScript

Almost none. There is a share button that only appears if your browser supports the Web Share API, a clock on the home page, and the form that talks to the receipt printer. Everything else is HTML and CSS. If you disable JavaScript you lose the clock and the printer; the rest of the site is unaffected.

## Colour

The palette adapts to your system light/dark preference via `prefers-color-scheme`. There is no theme toggle, on purpose — your OS already knows.
