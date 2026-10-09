---
title: Colophon
layout: page
type: static
header_content: How this site is put together.
---

This site is built with [Jekyll](https://jekyllrb.com/) and hosted on [GitHub Pages](https://pages.github.com/). There is no framework, no bundler, and no client-side router.

## The desk

The theme is a small desktop. Every page is a window on a dotted desk, titled with the name of the file it came from, with a close box that is a real link — `/colophon` is `colophon.md`, and closing it takes you home. Posts are listed on the front page and each opens as its own window.

The window metaphor, the menu bar, and the structure of the layouts are adapted from [meowni.ca](https://meowni.ca) by Monica Dinculescu ([source](https://github.com/notwaldorf/notwaldorf.github.com)), MIT licensed. The palette, the light/dark handling, and the contents are mine.

Before the desk, this site wore a minimal theme adapted from [muan.co](https://muan.co) by muan ([source](https://github.com/muan/site)), also MIT licensed. Plenty of what holds this one up — the notes collection, the feeds, the page structure — still comes from there.

## Type

Everything is set in [IBM Plex Mono](https://github.com/IBM/plex), with IBM Plex Sans kept for italics. Both are served from this domain rather than from Google Fonts — it keeps two third-party connections off the critical path, and means no font request for this page leaves badhrinadh.com. Two weights of the mono carry the whole interface, which is four small subsetted files in total.

## Colour

The palette has one light and one dark version, and by default it follows your system preference. The ✦ in the menu bar opens a control panel if you want to override that, change the accent colour, or switch the wallpaper; those three choices are remembered in `localStorage`.

The same panel has three retro palettes — CGA, DOS, and an amber terminal. Those are a joke, so they deliberately do not persist: being greeted by magenta-on-black because you picked it for a laugh last week is a worse joke than the palette.

An accent is stored as a hue, not as a colour. Lightness comes from whichever palette is active, which is how a link stays readable on both white and near-black without anyone maintaining two values by hand.

## JavaScript

Almost none, and nothing you need. The script adds dragging to the window title bars, the clock in the menu bar, and the control panel. The printer form needs it, because the printer is on the other end of an API. Everything else — every page, post, note, listing, and the navigation — is HTML and CSS. With scripting off you get a static desk, which is still a readable site.

The one script this site does not serve itself is the like button on posts and notes, which loads a custom element from a CDN. It is off unless `open_heart_endpoint` is set in the config, and it is unset.
