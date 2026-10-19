---
title: Accessibility statement
layout: default
type: static
---

This site started from muan.co, and I want it to be usable by everyone. Concretely, that means:

## What I do

- Every page is readable without JavaScript, with one exception noted below.
- Images carry meaningful `alt` text.
- Landmarks (`header`, `main`, `footer`, `nav`) are used properly, and every `nav` has an `aria-label`.
- Colour is never the only way information is conveyed — the printer form's success and failure messages carry a symbol as well as a colour.
- Body text and interface labels meet WCAG AA contrast in both light and dark.
- Decorative rules between links are hidden from assistive tech rather than announced as separators.
- The site respects `prefers-color-scheme` and `prefers-reduced-motion`.
- Text reflows and remains readable when zoomed.

## Known gaps

This section is honest rather than aspirational.

- **The message printer needs JavaScript.** It posts to an API, so there is no no-JS fallback; without scripting you get a line of text explaining that instead of the form. Nothing else on the site depends on JavaScript — if you turn it off, you lose the clock and the share button.
- **The character counter is not announced while you type.** It used to update a live region on every keystroke, which meant screen readers read "1 / 500", "2 / 500" and so on continuously. It is now described-by the message field, so it is read once when you focus it. The 500-character limit is enforced by the field itself either way.
- **The footer comes after all content.** On the Notes index that is a long list to tab through before reaching the footer links. There is no skip link yet.
- **Long code blocks scroll sideways.** Browsers that do not make scroll containers keyboard-focusable will not let you reach the overflowing part with a keyboard alone.
- **The printer form depends on a server I run at home.** If it is down you get an error message rather than a working alternative.

If you find something broken, it belongs on this list — please tell me.

## Contact

If any part of this site is difficult for you to use, [open an issue](https://github.com/BadhriNadhBade/badhrinadh.com/issues) and I will fix it.
