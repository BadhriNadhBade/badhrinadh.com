---
title: Accessibility statement
layout: page
type: static
header_content: What works, and what doesn't.
---

This site is a desktop metaphor, which is the kind of idea that can quietly break a page for people who navigate it differently. I want it to be usable by everyone. Concretely, that means:

## What I do

- Every page is readable without JavaScript, with the exceptions noted below. The window chrome is CSS; the close boxes are real links.
- Images carry meaningful `alt` text.
- Landmarks (`nav`, `main`, `footer`) are used properly, every `nav` has an `aria-label`, and there is a skip link to the content.
- Colour is never the only way information is conveyed — the printer form's success and failure messages carry a symbol as well as a colour.
- Body text, interface labels, and borders meet WCAG AA contrast in both the light and dark palettes, for every accent colour. The numbers are computed from the palette rather than eyeballed.
- The site respects `prefers-color-scheme` and `prefers-reduced-motion`.
- Text reflows and remains readable when zoomed, and the layout drops to a single column of windows on a narrow screen.

## Known gaps

This section is honest rather than aspirational.

- **The windows can only be dragged with a pointer.** Dragging is decoration — nothing is hidden behind it, and windows are fully readable where they start — but there is no keyboard equivalent.
- **The three retro palettes are not held to the AA promise above.** They are a joke about old computers; the Auto, Light, and Dark palettes are the audited ones, and they are what you get unless you deliberately pick otherwise.
- **The message printer needs JavaScript.** It posts to an API, so there is no no-JS fallback; without scripting you get a line of text explaining that instead of the form.
- **The clock in the menu bar needs JavaScript.** Without it, it reads `--:--` rather than claiming a time it doesn't know.
- **The character counter on the printer form is not announced while you type.** It used to update a live region on every keystroke, which meant screen readers read "1 / 500", "2 / 500" and so on continuously. It is now described-by the message field, so it is read once when you focus it. The 500-character limit is enforced by the field itself either way.
- **Long code blocks scroll sideways.** Browsers that do not make scroll containers keyboard-focusable will not let you reach the overflowing part with a keyboard alone.
- **The printer form depends on a server I run at home.** If it is down you get an error message rather than a working alternative.

If you find something broken, it belongs on this list — please tell me.

## Contact

If any part of this site is difficult for you to use, [open an issue](https://github.com/BadhriNadhBade/badhrinadh.com/issues) and I will fix it.
