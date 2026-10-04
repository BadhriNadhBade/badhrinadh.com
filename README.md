# badhrinadh.com

Code for https://badhrinadh.com/.

A small desktop. Every page is a window on a dotted desk, titled with the name
of the file it came from; posts cascade over the posts listing; the ✦ in the
menu bar opens a control panel for appearance, accent and wallpaper.

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
_layouts/home.html        the desk: about + recent + printer windows
_layouts/page.html        one window — static pages, listings, 404
_layouts/post.html        a post, cascaded over the posts listing
_layouts/note.html        a single note, in a smaller window
assets/base.scss          type, tokens, prose
assets/desk.scss          palette and window chrome
assets/desk.js            dragging, clock, control panel, snake
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

The desk theme — the window metaphor, the menu bar, the layout structure — is
adapted from [meowni.ca](https://meowni.ca)
([source](https://github.com/notwaldorf/notwaldorf.github.com)), MIT licensed.
The palette, the light/dark handling and the content here are my own.

Before that, structure and layout were adapted from
[muan.co](https://github.com/muan/site), also MIT licensed, and some of that
survives underneath.

## License

The following directories and their contents are Copyright Badhri Nadh. You may
not reuse anything therein without my permission:

```
_posts/
_notes/
_pages/
```

All other directories and files are MIT Licensed (where applicable).
