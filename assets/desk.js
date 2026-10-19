---
---
/* ============================================================
   desk.js — behaviour for the desk theme.

   About those two dashes up top: empty front matter, on purpose, the same
   trick desk.scss uses. It makes Jekyll run this file through Liquid, so the
   settings further down come straight from _data/desk.yml — the file the
   inline script in _includes/head.html reads too. The other way was for that
   script to hang the lists on a global for this one to pick up, which works
   but ties the two together at runtime through a name neither declares; this
   way desk.js stays self-contained and the copying happens at build time.
   The front matter never reaches the browser. The catch: a literal pair of
   opening braces, or a brace and a percent sign, anywhere in this file —
   comments included — is Liquid now. There is exactly one, and it's meant.

   Nothing here is required to read the site. Without JavaScript
   you get a static menu bar, static windows, and no clock; every
   page, post and note is fully readable.

   Adapted from meowni.ca (github.com/notwaldorf/notwaldorf.github.com),
   MIT licensed.
   ============================================================ */
(function () {
  "use strict";

  const root = document.documentElement;
  let zTop = 10; // running counter, so a dragged window jumps above its siblings

  const X_SVG = '<svg viewBox="0 0 16 16" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';

  /* The allowed values, their labels and the defaults, from _data/desk.yml
     (the header comment says why Liquid works in a .js file). Each list is
     [{ id, label }, …]; DESK.defaults is { shell, appearance, retro, accent, wall }. */
  const DESK = {{ site.data.desk | jsonify }};
  const ids = (list) => list.map((o) => o.id);

  const SHELLS = ids(DESK.shells);
  const APPEARANCES = ids(DESK.appearances);
  const ACCENTS = ids(DESK.accents);
  const WALLS = ids(DESK.walls);

  /* The swatch fills. Not in desk.yml: these approximate the hue/chroma
     pairs in desk.scss's accent presets at a mid lightness, so they belong
     beside that CSS more than beside the list. An accent missing here still
     gets a button, just an unfilled one. */
  const SWATCHES = {
    green: "oklch(0.55 0.10 162)",
    pink: "oklch(0.62 0.15 8)",
    blue: "oklch(0.58 0.13 248)",
    gold: "oklch(0.70 0.13 75)",
    rainbow: "linear-gradient(135deg,#F79533,#EF4E7B,#A166AB,#1098AD,#6DBA82)",
  };

  /* ---------- preferences ----------
     The theme (Desk or Classic) persists, and is acted on by the inline
     script in head.html, not here; see "the theme" below.
     Appearance, accent and wallpaper persist: appearance in particular is a
     readability setting, and losing it on every navigation would be hostile.
     The retro themes deliberately do not persist — being greeted by CGA
     because you picked it for a laugh last week is a worse joke. */
  const read = (k, allowed, fallback) => {
    try {
      const v = localStorage.getItem("desk." + k);
      return allowed.includes(v) ? v : fallback;
    } catch (e) {
      return fallback; // private mode, or storage disabled
    }
  };
  const write = (k, v) => {
    try { localStorage.setItem("desk." + k, v); } catch (e) { /* nothing to do */ }
  };

  const store = {
    appearance: read("appearance", APPEARANCES, DESK.defaults.appearance),
    accent: read("accent", ACCENTS, DESK.defaults.accent),
    wall: read("wall", WALLS, DESK.defaults.wall),
    retro: DESK.defaults.retro, // never read back: see above
  };

  /* ---------- the theme: Desk or Classic ----------
     Classic is a build-time copy of every page under /classic/, with none of
     this file in it. head.html leaves a <meta name="classic-url"> on any page
     that has a copy, so this is the one place that asks where it is. A page
     without one sends Classic to the front page instead: there's no twin to
     go to, and a Classic 404 for a page you didn't ask for would only look
     like the switch had broken something. */
  const ON_CLASSIC = /^\/classic(\/|$)/;

  function classicTwin() {
    const v = document.querySelector('meta[name="classic-url"]')?.content;
    return v && ON_CLASSIC.test(v) ? v : null; // same check the head script makes
  }

  function goClassic() {
    write("shell", "classic");
    sync(".cp-seg[data-shell]", "shell", "classic"); // feedback while the next page loads
    // replace, not assign: this Desk entry would only redirect to Classic again
    // if Back landed on it, so Back would look broken. Switching theme is a
    // setting, not a step forward — Back goes to wherever you were before.
    location.replace((classicTwin() || "/classic/") + location.search + location.hash);
  }

  /* The pressed button is what you're looking at, which on any page this
     file runs on is Desk — even when the store says Classic, as it can on
     an unknown /classic/ path, which is served the Desk 404. */
  const syncShell = () => sync(".cp-seg[data-shell]", "shell", "desk");

  /* Back from Classic can restore this page from the back/forward cache,
     and then the head script doesn't run again: you'd be on Desk with
     Classic chosen. So make the same decision it would have made. (If the
     choice didn't stick — storage off — stay, and put the panel's pressed
     button back on Desk.) */
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    const twin = classicTwin();
    if (twin && !ON_CLASSIC.test(location.pathname) &&
        read("shell", SHELLS, DESK.defaults.shell) === "classic") {
      location.replace(twin + location.search + location.hash);
      return;
    }
    syncShell();
  });

  /* ---------- applying a preference ----------
     Everything is set on <html> rather than <body> so the inline script in
     <head> can apply the stored theme before the first paint. */
  function applyTheme() {
    // a retro theme wins over the light/dark choice while it is on
    const theme = store.retro !== "off" ? store.retro
      : store.appearance === "auto" ? null
      : store.appearance;

    if (theme) root.dataset.theme = theme;
    else delete root.dataset.theme;

    syncChrome(!theme);

    sync(".cp-seg[data-appearance]", "appearance", store.appearance);
    sync(".cp-seg[data-retro]", "retro", store.retro);

    // the accent picker has no effect while a retro theme pins its own
    const group = document.getElementById("cp-accent-group");
    if (group) group.classList.toggle("is-disabled", store.retro !== "off");
  }

  function applyAccent() {
    root.dataset.accent = store.accent;
    sync(".cp-sw", "acc", store.accent);
  }

  function applyWall() {
    root.dataset.wall = store.wall;
    sync(".cp-seg[data-wall]", "wall", store.wall);
  }

  /* ---------- the browser's own chrome ----------
     head.html ships two theme-color metas, one per OS colour scheme, which is
     right for Auto and for anyone without JavaScript. Pin Light, Dark or a
     retro palette and they're wrong — Dark on a light OS left a pale toolbar
     over a dark page. So while a theme is pinned, both metas get the colour
     the desk is actually painted in, and whichever the browser happens to
     match is correct; back on Auto they get their original values back.

     Overwriting both, rather than adding a third media-less meta in front,
     sidesteps relying on every browser re-picking the first match when the
     head changes. The colour is read off <body>, which paints --desk-bg, so a
     new palette in desk.scss needs no change here. */
  const themeMetas = () => document.querySelectorAll('meta[name="theme-color"]');

  function syncChrome(auto) {
    const metas = themeMetas();
    metas.forEach((m) => { if (!("auto" in m.dataset)) m.dataset.auto = m.content; });

    if (auto) {
      metas.forEach((m) => { m.content = m.dataset.auto; });
      return;
    }
    const colour = deskColour();
    if (colour) metas.forEach((m) => { m.content = colour; });
  }

  /* getComputedStyle hands back the background in whatever space it was
     written in — oklch() for the light and dark palettes — and not every
     browser takes oklch in a theme-color. Painting it into a 1x1 canvas and
     reading the pixel back gets plain sRGB hex from any of them. */
  function deskColour() {
    if (!document.body) return null;
    const bg = getComputedStyle(document.body).backgroundColor;
    try {
      const ctx = document.createElement("canvas").getContext("2d");
      // start from transparent: a colour the canvas can't parse is ignored,
      // and the default black would otherwise come back looking like an answer
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      if (!a) return bg;
      return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      return bg; // no canvas: the computed value is still better than the wrong colour
    }
  }

  // mark whichever control matches the current value
  function sync(selector, key, value) {
    document.querySelectorAll(selector).forEach((el) => {
      const on = el.dataset[key] === value;
      el.classList.toggle("on", on);
      if (el.tagName === "BUTTON") el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* ---------- the clock ----------
     Shows my time, not yours — the point of the line on the home page was
     always "here is what o'clock it is where I am". */
  const TZ = "America/Chicago";
  let clockTimer;

  function tick() {
    const now = new Date();
    let time;
    try {
      time = new Intl.DateTimeFormat("en-GB", {
        timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(now);
    } catch (e) {
      return; // no Intl: leave the placeholder alone
    }

    const el = document.getElementById("clock");
    if (!el) return;
    el.textContent = "";
    const [h, m] = time.split(":");
    const colon = document.createElement("span");
    colon.className = "clock-colon";
    colon.textContent = ":";
    el.append(h, colon, m);

    // line the blink up with the actual second, then re-run on the minute
    const sec = now.getSeconds();
    colon.style.animationDelay = `${(sec % 2 === 0 ? 0 : 1000) - now.getMilliseconds()}ms`;
    clearTimeout(clockTimer);
    clockTimer = setTimeout(tick, 60000 - (sec * 1000 + now.getMilliseconds()));
  }

  /* ---------- control panel (✦) ----------
     A native <dialog>, opened modal. showModal() gives us, for free, what
     the old div-with-role="dialog" only claimed: focus kept inside, the page
     behind made inert, and Escape. Built once, on first open, and kept in
     the DOM after that — closing just closes it.

     Closing is two-step so the exit transition plays: drop `.in`, wait for
     the slide/fade, then close(). Everything that can close it goes through
     closeCP() — the × button, a click on the backdrop, and Escape, which
     arrives as a `cancel` event we take over. The `close` event is the
     backstop for anything that closes it some other way (Chrome, for one,
     will close a dialog outright on a second Escape without asking again),
     and is where the state is tidied up and focus goes back to ✦. */
  let cp = null;
  let cpOpener = null;
  let cpTimer = 0;

  const seg = (key, list) => list.map((o) =>
    `<button class="cp-seg" type="button" data-${key}="${o.id}">${o.label}</button>`).join("");

  const swatches = () => DESK.accents.map((o) =>
    `<button class="cp-sw" type="button" data-acc="${o.id}" aria-label="${o.label}" style="background:${SWATCHES[o.id] || "none"}"></button>`).join("");

  function buildCP() {
    const dlg = document.createElement("dialog");
    dlg.className = "cp";
    dlg.setAttribute("aria-label", "Control panel");
    dlg.innerHTML = `
      <div class="titlebar">
        <span class="ttl">control.md</span>
        <button class="tb-box tb-x" data-cp-close type="button" aria-label="Close control panel">${X_SVG}</button>
      </div>
      <div class="cp-body">
        <div class="cp-group cp-shell">
          <div class="cp-label" id="cp-l-shell">Theme</div>
          <div class="cp-seg-row" role="group" aria-labelledby="cp-l-shell" aria-describedby="cp-shell-note">${seg("shell", DESK.shells)}</div>
          <p class="cp-note" id="cp-shell-note">Classic is this site's earlier, plainer look. The ✦ in its corner brings you back.</p>
        </div>
        <div class="cp-group">
          <div class="cp-label" id="cp-l-appearance">Appearance</div>
          <div class="cp-seg-row" role="group" aria-labelledby="cp-l-appearance">${seg("appearance", DESK.appearances)}</div>
        </div>
        <div class="cp-group">
          <div class="cp-label" id="cp-l-retro">Retro</div>
          <div class="cp-seg-row" role="group" aria-labelledby="cp-l-retro">${seg("retro", DESK.retros)}</div>
        </div>
        <div class="cp-group" id="cp-accent-group">
          <div class="cp-label" id="cp-l-accent">Accent</div>
          <div class="cp-sw-row" role="group" aria-labelledby="cp-l-accent">${swatches()}</div>
        </div>
        <div class="cp-group">
          <div class="cp-label" id="cp-l-wall">Wallpaper</div>
          <div class="cp-seg-row" role="group" aria-labelledby="cp-l-wall">${seg("wall", DESK.walls)}</div>
        </div>
        <p class="cp-foot">Theme, appearance, accent and wallpaper are remembered.
        The retro themes are not — they go back to Off on your next visit.</p>
      </div>`;

    // Escape: run our own close so it animates, instead of the instant one
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); closeCP(); });
    dlg.addEventListener("close", onCPClosed);

    // A click on the backdrop is a click on the <dialog> itself, but so is
    // one on its border — hence the check that it landed outside the box.
    // pointerdown, as the old scrim used, so a text selection dragged out of
    // the panel doesn't close it; the dialog stays modal through the exit
    // transition, so the rest of that tap can't land on a link underneath.
    dlg.addEventListener("pointerdown", (e) => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) closeCP();
    });

    document.body.appendChild(dlg);
    return dlg;
  }

  function openCP(opener) {
    // <dialog> landed everywhere in 2022; anything older just doesn't get a
    // panel. Checked before building, or an unsupported browser would render
    // the whole thing inline at the foot of the page.
    if (!window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal) return;
    if (cp && cp.open) return;
    if (!cp) cp = buildCP();

    // the ✦ button itself, not document.activeElement: Safari doesn't focus
    // a button on click, so that would hand focus back to <body>
    cpOpener = opener || document.activeElement;
    closeMenu(); // it would only sit open, inert, behind the backdrop
    applyTheme(); applyAccent(); applyWall(); syncShell();
    cp.showModal();
    cp.querySelector("[data-cp-close]").focus();

    // Read a layout value so the closed state (.cp without .in) is committed
    // before .in goes on; otherwise the browser can fold both into one style
    // change and skip the transition.
    void cp.offsetWidth;
    cp.classList.add("in");
  }

  function closeCP() {
    if (!cp || !cp.open || !cp.classList.contains("in")) return;
    cp.classList.remove("in");
    // match the CSS: 0.2s on the panel, 0.22s on the backdrop. With reduced
    // motion the panel doesn't move at all, so there is nothing to wait for.
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    clearTimeout(cpTimer);
    cpTimer = setTimeout(() => { if (cp.open) cp.close(); }, reduce ? 0 : 240);
  }

  function onCPClosed() {
    clearTimeout(cpTimer);
    cp.classList.remove("in");
    // close() restores focus by itself in most browsers; this covers the rest
    if (cpOpener && document.contains(cpOpener)) cpOpener.focus();
    cpOpener = null;
  }

  /* ---------- window focus + dragging ----------
     Clicking a window brings it forward and un-dims its title, the way a
     desktop does. Dragging is pointer-only and never moves a window out of
     the document flow, so nothing shifts for anyone who can't drag. */
  function focusWindow(win) {
    document.querySelectorAll(".window").forEach((w) => w.classList.toggle("inactive", w !== win));
  }

  function dragify() {
    document.querySelectorAll(".deskwrap .window").forEach((win) => {
      const bar = win.querySelector(".titlebar");
      if (!bar || bar.dataset.drag) return;
      bar.dataset.drag = "1";

      let sx, sy, ox, oy, dragging = false;

      bar.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".tb-box")) return;
        dragging = true;
        if (getComputedStyle(win).position === "static") win.style.position = "relative";
        win.style.zIndex = ++zTop;
        sx = e.clientX; sy = e.clientY;
        ox = parseFloat(win.style.left) || 0;
        oy = parseFloat(win.style.top) || 0;
        bar.setPointerCapture(e.pointerId);
      });

      bar.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        win.style.left = ox + (e.clientX - sx) + "px";
        win.style.top = oy + (e.clientY - sy) + "px";
      });

      const stop = () => (dragging = false);
      bar.addEventListener("pointerup", stop);
      bar.addEventListener("pointercancel", stop);
    });

    document.querySelectorAll(".window").forEach((win) => {
      win.addEventListener("pointerdown", () => focusWindow(win));
    });
  }

  /* ---------- clicks ---------- */
  document.addEventListener("click", (e) => {
    const control = e.target.closest("[data-control]");
    if (control) { e.preventDefault(); openCP(control); return; }
    if (e.target.closest("[data-cp-close]")) { closeCP(); return; }

    // Classic leaves the page; Desk is where you already are, so it only
    // records the choice (which also undoes a Classic stuck on the 404)
    const shell = e.target.closest(".cp-seg[data-shell]");
    if (shell) {
      if (shell.dataset.shell === "classic") goClassic();
      else { write("shell", "desk"); syncShell(); }
      return;
    }

    const sw = e.target.closest(".cp-sw");
    if (sw) { store.accent = sw.dataset.acc; write("accent", store.accent); applyAccent(); return; }

    const wall = e.target.closest(".cp-seg[data-wall]");
    if (wall) { store.wall = wall.dataset.wall; write("wall", store.wall); applyWall(); return; }

    const app = e.target.closest(".cp-seg[data-appearance]");
    if (app) { store.appearance = app.dataset.appearance; write("appearance", store.appearance); applyTheme(); return; }

    const retro = e.target.closest(".cp-seg[data-retro]");
    if (retro) { store.retro = retro.dataset.retro; applyTheme(); return; }

    // the mobile menu: the toggle opens it, anything else closes it
    const group = document.getElementById("mi-group");
    if (!group) return;
    const toggle = e.target.closest("[data-menu]");
    if (toggle) {
      const open = group.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      return;
    }
    if (group.classList.contains("open")) closeMenu();
  });

  function closeMenu() {
    document.getElementById("mi-group")?.classList.remove("open");
    document.querySelector("[data-menu]")?.setAttribute("aria-expanded", "false");
  }

  // Escape closes the mobile menu. The control panel handles its own, as a
  // <dialog> — and while it's open the page behind is inert anyway.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- init ---------- */
  function init() {
    applyTheme();
    applyAccent();
    applyWall();
    dragify();
    // the first window on the page starts focused, the rest dimmed
    const first = document.querySelector(".deskwrap .window");
    if (first) focusWindow(first);
    tick();
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
