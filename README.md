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
_data/desk.yml            appearance, accent and wallpaper values
assets/base.scss          type, tokens, prose
assets/desk.scss          palette and window chrome
assets/desk.js            dragging, clock, control panel
assets/print.js           the printer form
```

### Classic

The minimal theme this site wore before the desk is still live, untouched, at
`/classic/<same path>`. Picking Classic in the control panel takes you there
and is remembered; the ✦ in Classic's corner comes back.

```
_layouts/default.html     Classic's layout, verbatim from before the desk
_classic/                 Classic's own copies of the pages the desk rewrote
assets/new.scss           Classic's stylesheet (plus root.js, site.js, classic/)
_plugins/classic.rb       builds a /classic/ copy of every page
script/check-classic      fails the build if any page is missing its copy
```

Don't edit the Classic files above — the point is that they match what was
live before. Anything Classic needs adapting (links pointing into `/classic/`,
the canonical URL, the switch-back ✦) is done to the built output by the plugin.

A new post or note needs no `layout:` line — `defaults` in `_config.yml` maps
each collection to its window layout. Pages at the repo root aren't in a
collection, so those name `layout: page` themselves.

## Development

Requires a Ruby 3 environment.

```
$ ./start
```

The site is built and deployed by `.github/workflows/pages.yml` rather than by
GitHub Pages' own builder, because that builder runs in safe mode and skips
`_plugins/` — which would mean no Classic. It's the same `github-pages` gem,
so the same Jekyll and plugin versions. Pushes to other branches and pull
requests build and run `script/check-classic` without deploying.

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
this site wore before the desk came from there too; it is still live, as
Classic, under `/classic/`.

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
