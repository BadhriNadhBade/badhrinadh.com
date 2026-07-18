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

## Deployment

GitHub Pages builds this natively on every push to `main`. There is no build
workflow — Pages runs Jekyll itself, which is why `_config.yml` uses
`CommonMarkGhPages` (one of the few markdown processors Pages supports) and
why the Gemfile pins the `github-pages` gem rather than Jekyll directly.

**One-time setup:** Settings → Pages → Source: *Deploy from a branch*, branch
`main`, folder `/ (root)`. The `CNAME` file handles the custom domain.

Because Pages does the build, only its allowlisted plugins work. Adding an
arbitrary gem to the Gemfile will be silently ignored in production even
though it works locally.

## Publishing from a phone

`.github/workflows/notes.yml` accepts a `workflow_dispatch` with a note body,
tags, language, location, and datetime. It runs `.github/scripts/notes.js`,
which picks the next free filename for that date, writes the file, and
commits. The push triggers a Pages rebuild.

Trigger it from an Apple Shortcut with a "Get contents of URL" action:

```
POST https://api.github.com/repos/BadhriNadhBade/badhrinadh.com/actions/workflows/notes.yml/dispatches
Authorization: Bearer <a fine-grained PAT with Actions: write>
Body: {"ref":"main","inputs":{"content":"...","tags":"Tech","datetime":"2026-07-18 09:00"}}
```

Inputs reach the script through environment variables rather than shell
arguments, so a note containing quotes or backticks can't break the runner's
shell.

`.github/workflows/robots.yml` refreshes `robots.txt` weekly from the
[ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) AI-crawler
blocklist. Delete both the workflow and `robots.txt` if you'd rather not
block them.

## Photos

`_data/photos.json` is an array of objects; `photos.html` and `photos.xml`
read from it. The expected shape:

```json
[{
  "id": "abc123",
  "url": "https://.../full.jpg",
  "thumbnail": "https://.../thumb.jpg",
  "uploaded": "2026-07-18T09:00:00Z",
  "meta": {"alt": "…", "caption": "…", "ratio": 1.5}
}]
```

Images are hosted externally, not committed. `ratio` above 1 is landscape and
spans the full width in grid layouts.

## Status

**This has never had a successful Jekyll build.** Only YAML, front matter,
and Liquid tag balance have been checked statically. Expect the first build
to surface anything that was missed.

## Things to replace

- `_includes/logo.html` and `assets/fav.svg` — placeholder monogram
- `index.html` — the three intro paragraphs
- `_pages/now.md`, `_pages/uses.md` — placeholder content
- `_posts/2026-07-18-hello.md`, `_notes/2026-07-18-aa.md` — sample content
- `_config.yml` — `timezone` and `open_heart_endpoint`
- `assets/root.js` — the `timeZone` in the clock
- `colophon.md`, `accessibility-statement.md` — drafted for you; read before publishing
- `assets/logo.png` — social preview image, referenced but not yet added
