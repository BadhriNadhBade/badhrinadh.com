# badhrinadh.com

Code for https://badhrinadh.com/.

A small desktop. Every page is a window on a dotted desk, titled with the name
of the file it came from; the ✦ in the menu bar opens a control panel for
appearance, accent and wallpaper.

## Technology

- HTML, CSS, and as little JavaScript as possible
- [RSS](https://en.wikipedia.org/wiki/RSS)
- [Jekyll on GitHub Pages](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll)
- A thermal receipt printer

## Layout

```
_includes/head.html       everything in <head>
_includes/nav.html        the menu bar
_includes/titlebar.html   one window's title bar
_includes/printer.html    the receipt printer form
_includes/footer.html     the footer links, rendered inside window content
_layouts/body.html        the shell: menu bar, desk icons, desktop
_layouts/home.html        the desk: about + posts/notes + printer windows
_layouts/page.html        one window — static pages, listings, 404
_layouts/post.html        a post, in its own window
_layouts/note.html        a single note, in a smaller window
assets/base.scss          type, tokens, prose
assets/desk.scss          palette and window chrome
assets/desk.js            dragging, clock, control panel
assets/print.js           the printer form
```

A new post or note needs no `layout:` line — `defaults` in `_config.yml` maps
each collection to its window layout. Pages at the repo root aren't in a
collection, so those name `layout: page` themselves.

## Development

Requires a Ruby 3 environment.

```
$ ./start
```

The stylesheets are compiled by `jekyll-sass-converter` 1.x, which uses
libsass. libsass has its own `min()`/`max()` and errors on the CSS versions
when the arguments carry different units, so `assets/desk.scss` passes those
through a `min-w()` helper. `clamp()` is fine as-is.

## Credit

This theme is someone else's idea first, so the attribution is in the footer of
every page as well as here.

The window metaphor, the menu bar and the layout structure are adapted from
[meowni.ca](https://meowni.ca) by Monica Dinculescu
([source](https://github.com/notwaldorf/notwaldorf.github.com)), MIT licensed.

The page structure underneath — the notes collection, the feeds, the i18n
config — is adapted from [muan.co](https://muan.co) by muan
([source](https://github.com/muan/site)), also MIT licensed. The minimal theme
this site wore before the desk came from there too; it still lives on the `main`
branch.

The palettes, the light/dark handling, the hue-based accent handling and the
content here are my own.

## License

The following directories and their contents are Copyright Badhri Nadh. You may
not reuse anything therein without my permission:

```
_posts/
_notes/
_pages/
```

All other directories and files are MIT Licensed (where applicable).
