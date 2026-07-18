# badhrinadh.com

Code for https://badhrinadh.com.

## Technology

- HTML, CSS, and as little JavaScript as possible
- [RSS](https://en.wikipedia.org/wiki/RSS)
- [Jekyll on GitHub Pages](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll)
- [OpenHeart](https://github.com/dddddddddzzzz/OpenHeart), [`<open-heart>`](https://github.com/dddddddddzzzz/open-heart-element) — optional, see below

## Credit

The architecture, layout structure, and colour palette are adapted from
[muan.co](https://muan.co) by Mu-An Chiou ([source](https://github.com/muan/site)),
whose non-content files are MIT licensed. Her content directories and the 安
logo are explicitly reserved and are **not** reused here — the writing, images,
and the monogram in `_includes/logo.html` are separate.

## Development

Requires Ruby 3.x. macOS system Ruby 2.6 is too old: `github-pages` pulls in
`ffi`, which needs >= 3.0.

On macOS 12 / Intel, avoid `brew install ruby` — Homebrew no longer ships
bottles for that combination and will compile LLVM from source, which takes
hours. Use rbenv instead, which builds only Ruby:

```
brew install rbenv
rbenv install 3.3.6
rbenv local 3.3.6
```

Then:

```
./start
```

and open http://localhost:4000.

`start` runs `jekyll server -w --future`. The `--future` flag matters: notes
are sometimes written with a timestamp slightly ahead, and without it they
silently vanish from the local build.

## Layout

```
_config.yml           site config, collections, i18n strings
_layouts/             default.html does nearly everything; redirect.html is one line
_includes/logo.html   the monogram — replace with your own
_posts/               long-form posts, YYYY-MM-DD-slug.md
_notes/               micro-posts, YYYY-MM-DD-xx.md
_pages/               standalone pages (now, uses)
_data/photos.json     photo metadata (not the images)
feeds/                RSS templates; each sets its own permalink
assets/new.scss       the entire stylesheet, compiled by Jekyll to /assets/new.css
```

## How things work

**Posts vs. notes.** Posts are essays and live in `_posts/`. Notes are
micro-posts — a link, a quote, a thought — and live in `_notes/`. Only posts
with `feature: 1` in their front matter appear on the home page, which is how
the home page stays short as the archive grows.

**Theme.** There is no theme toggle. The palette is a set of CSS custom
properties in `assets/new.scss` with a `prefers-color-scheme: dark` override —
your OS preference decides.

**Likes.** Setting `feature: 1` or `open_heart: true` renders an
[OpenHeart](https://github.com/dddddddddzzzz/OpenHeart) button. It POSTs an
emoji to an external endpoint; there are no accounts and no tracking. **This
needs your own endpoint** — set `open_heart_endpoint` in `_config.yml`. Until
you do, neither the button nor its script is rendered at all.

**Feed delay.** Notes are held out of `notes.xml` for 24 hours. It's a
deliberate cooling-off buffer: time to edit or delete before a note reaches
subscribers.

**External links** get a small `┓` marker via CSS, with the text
`, external` exposed to screen readers through the `content` alt syntax.

