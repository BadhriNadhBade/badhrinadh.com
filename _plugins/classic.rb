# frozen_string_literal: true

# Classic, rebuilt at /classic/.
#
# The site has two themes. Desk is the current one and owns the normal URLs.
# Classic is the old minimal theme, kept alive — untouched — one directory
# down: every Desk page gets a twin at /classic/<same path>, rendered with the
# old layout (_layouts/default.html) and the old stylesheet (assets/new.scss),
# both restored byte-for-byte from main.
#
# The rule this file exists to keep: never edit the restored Classic sources.
# They are a museum piece. Everything Classic needs in order to live inside a
# site that isn't its own — links that stay in /classic/, a canonical that
# points at the Desk original, a way back to Desk — is done here, at build
# time, on Classic's *built output*. If the old theme ever looks different
# from how it did on main, the bug is in this file, not in default.html.
#
# How a Classic page is made:
#
#   1. Generator (below) walks every Desk page and post/note/page document
#      that outputs HTML and makes a ClassicPage for it at "/classic" + its
#      Desk URL. Front matter and content come from _classic/<the Desk item's
#      relative path> if that file exists — the five root pages (index, notes,
#      404, colophon, accessibility statement) were rewritten for Desk, so
#      main's versions live there — and otherwise are copied from the Desk
#      item itself (posts, notes and _pages bodies are identical in both
#      themes; only their `layout:` line changed).
#   2. Jekyll renders it like any other page, through layout: default.
#   3. The :post_render hook at the bottom edits the HTML: internal links
#      into /classic/, the old syntax.css, canonical and og:url back to Desk,
#      and the ✦ switch-back link.
#
# This needs custom plugins, so it only runs because the site is built by
# .github/workflows/pages.yml with `bundle exec jekyll build`, not by GitHub
# Pages' safe-mode builder. (github-pages sits in the Gemfile's default group,
# so its safe-mode overrides are never loaded — only :jekyll_plugins are.)

require "cgi"

module ClassicTheme
  # Where Classic lives. Desk URL "/posts/hello" becomes "/classic/posts/hello";
  # Desk's "/" becomes "/classic/" — plain concatenation gets both right,
  # because every Desk URL starts with a slash.
  PREFIX = "/classic"

  # Source directory for Classic versions of pages Desk rewrote. Underscored,
  # so Jekyll never builds it on its own; only this plugin reads from it.
  SOURCE_DIR = "_classic"

  # The collections whose documents get Classic twins. default.html branches
  # on page.collection for exactly these three, so they are the ones whose
  # label has to survive the trip from Document to Page.
  COLLECTIONS = %w(posts notes pages).freeze

  # Front matter that must not be carried onto a Classic copy:
  #
  #   redirect_from / redirect_to — Desk's index.html owns the old /photos
  #     URLs. A copy that kept them would ask jekyll-redirect-from for the same
  #     redirects twice (it has already run by the time we do, but the data
  #     would still be wrong), or redirect the Classic page away entirely.
  #   permalink — the copy's URL is fixed by ClassicPage#url; a leftover
  #     permalink would only confuse Renderer#permalink_ext.
  #   excerpt — a Jekyll::Excerpt bound to the Desk document. default.html
  #     never reads it, and it shouldn't be dragged along half-attached.
  #   classic_url — only Desk items have one; a Classic copy pointing at
  #     itself would invite redirect loops in anything that trusts it.
  #   layout — replaced with "default" below.
  DROPPED_KEYS = %w(redirect_from redirect_to redirect permalink excerpt classic_url layout).freeze

  # The URL of the Classic twin of a Desk URL.
  def self.classic_url_for(desk_url)
    PREFIX + desk_url
  end

  # A Hash whose "content" is read from the page every time it's asked for,
  # rather than frozen when the hash was built.
  #
  # Why: on main, posts and notes were Jekyll::Documents, and a Document's
  # Liquid view (DocumentDrop) reads `content` live. By the time default.html
  # runs, that is the *converted HTML*, and default.html leans on it —
  # `page.content | strip_html | normalize_whitespace | truncate: 200` is the
  # meta description of every post and note. A Page's Liquid view is a plain
  # Hash snapshot taken before rendering, so the same expression would see
  # raw Markdown instead: different descriptions, and Markdown syntax leaking
  # into share cards. This puts the Document behaviour back, for copies of
  # Documents only. Liquid 4 checks key? and then calls [], so overriding []
  # is enough.
  class LiveContentHash < Hash
    def initialize(page)
      super()
      @page = page
    end

    def [](key)
      key == "content" ? @page.content : super
    end
  end

  # A Classic twin. A Jekyll::Page with its URL pinned rather than derived
  # from a filename, and front matter read from _classic/ when it exists.
  class ClassicPage < Jekyll::Page
    # The Desk URL this page is a copy of, e.g. "/posts/hello".
    attr_reader :desk_url

    # { desk_url => classic_url } for every Classic page in the build — shared
    # by all of them, so the link rewrite only touches links it knows have a
    # Classic twin to go to.
    attr_reader :classic_urls

    # site         - the Jekyll::Site.
    # relative     - the Desk item's source path, e.g. "notes.html" or
    #                "_posts/2026-07-18-hello.md". The copy pretends to live
    #                at _classic/<relative>; that is where an override file is
    #                looked for, and it gives the copy a source path no other
    #                page has (Jekyll keys Liquid stats and regeneration on it).
    # desk_url     - the Desk item's URL.
    # classic_urls - the shared map described above.
    # live_content - true when the Desk item was a Document (see
    #                LiveContentHash).
    def initialize(site, relative, desk_url, classic_urls, live_content)
      # Set before super: Page#initialize runs :post_init hooks, and anything
      # in them that asks for #url must already get the right answer.
      @desk_url     = desk_url
      @classic_urls = classic_urls
      @fixed_url    = ClassicTheme.classic_url_for(desk_url)
      @live_content = live_content

      dir = File.join(SOURCE_DIR, File.dirname(relative)).sub(%r!/\.\z!, "")
      super(site, site.source, dir, File.basename(relative))
    end

    # Only read front matter if there's an override file in _classic/. When
    # there isn't, start empty — the generator fills data and content in from
    # the Desk item. (Jekyll's own read_yaml would log a read error and carry
    # on, which is noise for the common case.)
    def read_yaml(base, name, opts = {})
      return super if File.file?(@path)

      self.content ||= ""
      self.data ||= {}
    end

    # True when this copy's front matter and content came from _classic/.
    def override?
      File.file?(@path)
    end

    def url
      @fixed_url
    end

    def to_liquid(attrs = nil)
      liquid = super
      return liquid unless @live_content

      LiveContentHash.new(self).merge!(liquid)
    end

    def inspect
      "#<ClassicTheme::ClassicPage #{@fixed_url}>"
    end
  end

  class Generator < Jekyll::Generator
    # Runs after jekyll-redirect-from (priority :normal), so the redirect
    # stubs it makes from Desk's redirect_from already exist and can be
    # recognised and skipped — and so it never sees our copies at all.
    # jekyll-sitemap runs later still (:lowest), but that doesn't matter: it
    # only filters on `sitemap: false` when sitemap.xml is rendered, and every
    # copy carries that.
    priority :low

    def generate(site)
      sources = desk_pages(site) + desk_documents(site)

      # Build the whole URL map first, so every copy — including ones whose
      # links point at pages generated after them — sees all of it.
      classic_urls = {}
      sources.each { |item| classic_urls[item.url] = ClassicTheme.classic_url_for(item.url) }

      sources.each do |item|
        copy = build_copy(site, item, classic_urls)
        site.pages << copy

        # The contract with Desk: page.classic_url is the exact URL of this
        # page's Classic twin. _includes/head.html reads it to send visitors
        # who chose Classic straight there; assets/desk.js reads it to
        # navigate when Classic is picked in the control panel. Pages that
        # aren't copied never get one, so its absence means "no twin".
        item.data["classic_url"] = copy.url
      end
    end

    private

    # Root pages (index.html, notes.html, colophon.md, …) that render to a
    # real HTML page. Skipped:
    #   - anything not output as HTML: feeds, sitemap, redirects.json, and the
    #     stylesheets/scripts that are pages only because of front matter;
    #   - jekyll-redirect-from stubs, by class and, belt and braces, by the
    #     `redirect` data it gives every stub and every redirect_to page;
    #   - anything with no layout, which isn't a themed page;
    #   - anything already under /classic/.
    def desk_pages(site)
      site.pages.select do |page|
        next false if page.is_a?(ClassicPage)
        next false if defined?(JekyllRedirectFrom::RedirectPage) &&
                      page.is_a?(JekyllRedirectFrom::RedirectPage)
        next false unless page.html?
        next false if redirect?(page)
        next false unless layout?(page)

        !under_classic?(page.url)
      end
    end

    # Posts, notes and _pages documents that are written out as HTML.
    def desk_documents(site)
      COLLECTIONS.flat_map do |label|
        collection = site.collections[label]
        next [] unless collection

        collection.docs.select do |doc|
          doc.write? &&
            Jekyll::Page::HTML_EXTENSIONS.include?(doc.output_ext) &&
            !redirect?(doc) &&
            layout?(doc) &&
            !under_classic?(doc.url)
        end
      end
    end

    def redirect?(item)
      item.data["redirect"] || item.data["redirect_to"]
    end

    def layout?(item)
      layout = item.data["layout"]
      !(layout.nil? || layout.to_s.empty? || layout == "none")
    end

    def under_classic?(url)
      url == PREFIX || url.start_with?("#{PREFIX}/")
    end

    def build_copy(site, item, classic_urls)
      document = item.is_a?(Jekyll::Document)
      copy = ClassicPage.new(site, item.relative_path, item.url, classic_urls, document)

      unless copy.override?
        # No Classic-specific source: the Desk item's body and front matter
        # are the Classic ones too. A shallow copy is enough — keys are only
        # added and removed below, never edited in place — and it leaves the
        # Desk item's own hash (and its defaults lookup) alone.
        copy.content = item.content.dup
        item.data.each { |key, value| copy.data[key] = value }
      end

      DROPPED_KEYS.each { |key| copy.data.delete(key) }

      # The restored Classic layout.
      copy.data["layout"] = "default"

      # default.html decides almost everything on page.collection: "posts"
      # gets syntax.css, the date line and <article>; "notes" the timestamp,
      # tags and the back link to /notes; "pages" the <article>; nothing at
      # all means a root page. A Page has no collection of its own, but
      # Page#to_liquid is just its data (plus content/dir/name/path/url)
      # merged over front matter defaults — so a "collection" key in data is
      # exactly what `page.collection` resolves to. Root pages stay without
      # one, as they were on main (body class "col-").
      copy.data["collection"] = item.collection.label if document

      # Classic pages are duplicates of the Desk ones; the sitemap should only
      # list the originals. jekyll-sitemap honours this flag.
      copy.data["sitemap"] = false

      # How the :post_render hook below recognises its pages.
      copy.data["classic_copy"] = true

      copy
    end
  end

  # ---------------------------------------------------------------------------
  # Post-render: adapting Classic's built HTML to living under /classic/.
  # ---------------------------------------------------------------------------

  # A root-relative URL in an href or action attribute, e.g.
  #   href="/colophon"   action='/search'
  # The attribute must follow whitespace, so data-href and friends don't
  # match; the value must be quoted, start with exactly one slash (so
  # protocol-relative "//host" is left alone), and contain no quote. Absolute
  # http(s) URLs, "#fragment" and "mailto:" never start with a slash, so they
  # can't match at all.
  LINK_ATTR = %r{(\s(?:href|action)=)(["'])(/(?!/)[^"']*)\2}

  # Paths that are never rewritten even if they somehow matched a Desk page:
  # shared static assets, Classic itself, feeds, and the crawler files. In
  # practice none of these are Classic pages, so the lookup below would skip
  # them anyway — this list is the spelled-out guarantee.
  NEVER_REWRITE = %r{\A(?:/assets/|/classic(?:/|\z)|/(?:feed|notes|sitemap)\.xml\z|/(?:robots|humans)\.txt\z)}

  # default.html's canonical tag, exactly as it writes it.
  CANONICAL = %r{(<link rel="canonical" href=")[^"]*(")}

  # default.html's og:url tag, exactly as it writes it.
  OG_URL = %r{(<meta content=")[^"]*(" property="og:url">)}

  # Posts load the old syntax highlighting. Desk changed the root
  # assets/syntax.css, so Classic's copy lives at assets/classic/syntax.css.
  SYNTAX_CSS_FROM = 'href="/assets/syntax.css"'
  SYNTAX_CSS_TO   = 'href="/assets/classic/syntax.css"'

  # Rewrite one root-relative URL to its Classic twin, if it has one.
  #
  # Only URLs that are a Desk page with a Classic copy are touched. Anything
  # else — an image, a file, the /photos redirect, a page that was skipped —
  # keeps pointing at the original, which exists, rather than at a /classic/
  # path that would 404. Matches "/notes" and "/notes.html" alike (GitHub
  # Pages serves both), and "/index.html" as "/"; the query and fragment are
  # carried over untouched.
  def self.rewrite_url(url, classic_urls)
    path, rest = url.match(%r{\A([^?#]*)(.*)\z}m).captures
    return url if path.match?(NEVER_REWRITE)

    page = path.sub(%r{(?:\A|/)index\.html\z}, "/").sub(%r{\.html\z}, "")
    page = "/" if page.empty?
    return url unless classic_urls.key?(page) || classic_urls.key?(path)

    PREFIX + path + rest
  end

  # The way back to Desk. Desk's head script sees ?shell=desk, stores Desk as
  # the visitor's choice, and strips the parameter — so the link has to land
  # on the Desk URL of this very page.
  #
  # Kept as small and sealed as possible: one class name nothing in Classic
  # uses, styles scoped to it, no JavaScript. position: fixed takes it out of
  # the flow, so Classic's layout doesn't move a pixel. Colours are Classic's
  # own custom properties from assets/new.scss, so it follows Classic's
  # light/dark. Selectors are doubled up on hover/visited/focus because
  # Classic's `a` and `a:hover`-style rules outrank a lone class.
  def self.switch_back(desk_url)
    href = CGI.escapeHTML("#{desk_url}?shell=desk")
    <<~HTML
      <style>
        .classic-to-desk,.classic-to-desk:visited{position:fixed;z-index:10;top:calc(.6rem + env(safe-area-inset-top,0px));right:calc(.6rem + env(safe-area-inset-right,0px));display:flex;align-items:center;justify-content:center;width:1.9rem;height:1.9rem;box-sizing:border-box;border:1px solid var(--borderColor);border-radius:50%;background:var(--backgroundColor);color:var(--textColor);font:14px/1 system-ui,sans-serif;text-decoration:none;opacity:.75}
        .classic-to-desk:hover{opacity:1;border-color:var(--textColor)}
        .classic-to-desk:focus-visible{opacity:1;outline:2px solid var(--textColor);outline-offset:2px}
        @media (pointer:coarse){.classic-to-desk,.classic-to-desk:visited{width:44px;height:44px;font-size:16px}}
        @media print{.classic-to-desk{display:none}}
      </style>
      <a class="classic-to-desk" href="#{href}" aria-label="Switch to the desk theme" title="Switch to the desk theme">✦</a>
    HTML
  end

  def self.adapt(page)
    output = page.output.to_s
    return if output.empty?

    # 1. Internal links stay inside Classic.
    output = output.gsub(LINK_ATTR) do
      attr = Regexp.last_match(1)
      quote = Regexp.last_match(2)
      url = Regexp.last_match(3)
      "#{attr}#{quote}#{rewrite_url(url, page.classic_urls)}#{quote}"
    end

    # 2. The old syntax highlighting, not Desk's.
    output = output.gsub(SYNTAX_CSS_FROM, SYNTAX_CSS_TO)

    # 3. Search engines and share cards should only ever know the Desk page.
    #    default.html builds both from page.url, which here is the /classic/
    #    one; on main these pointed at what is now the Desk URL, so this is
    #    also what makes them byte-identical to the old theme.
    desk_absolute = "#{page.site.config["url"]}#{page.desk_url}"
    output = output.sub(CANONICAL) { "#{Regexp.last_match(1)}#{desk_absolute}#{Regexp.last_match(2)}" }
    output = output.sub(OG_URL) { "#{Regexp.last_match(1)}#{desk_absolute}#{Regexp.last_match(2)}" }

    # 4. The way back, just before the last </body>. The block goes in after
    #    that line's indentation and repeats it at the end, so </body> keeps
    #    its original leading whitespace and the rest of the file is
    #    untouched.
    close = output.rindex("</body>")
    if close
      indent = output[0...close][%r{[ \t]*\z}]
      output = output.dup.insert(close, switch_back(page.desk_url) + indent)
    else
      Jekyll.logger.warn "Classic:", "no </body> in #{page.url}; switch-back link not added"
    end

    page.output = output
  end
end

Jekyll::Hooks.register :pages, :post_render do |page|
  next unless page.data["classic_copy"] && page.is_a?(ClassicTheme::ClassicPage)

  ClassicTheme.adapt(page)
end
