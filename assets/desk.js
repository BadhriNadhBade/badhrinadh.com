/* ============================================================
   desk.js — behaviour for the desk theme.

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

  const APPEARANCES = ["auto", "light", "dark"];
  const RETROS = ["off", "cga", "dos", "term"];
  const ACCENTS = ["green", "pink", "blue", "gold", "rainbow"];
  const WALLS = ["dots", "grid", "plain"];

  /* ---------- preferences ----------
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
    appearance: read("appearance", APPEARANCES, "auto"),
    accent: read("accent", ACCENTS, "green"),
    wall: read("wall", WALLS, "dots"),
    retro: "off",
  };

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

  /* ---------- control panel (✦) ---------- */
  let cpOpener = null;

  function openCP() {
    if (document.querySelector(".cp-scrim")) return;
    cpOpener = document.activeElement;

    const scrim = document.createElement("div");
    scrim.className = "cp-scrim";
    scrim.innerHTML = `
      <div class="cp" role="dialog" aria-modal="true" aria-label="Control panel">
        <div class="titlebar">
          <span class="ttl">control.md</span>
          <button class="tb-box tb-x" data-cp-close type="button" aria-label="Close control panel">${X_SVG}</button>
        </div>
        <div class="cp-body">
          <div class="cp-group">
            <div class="cp-label" id="cp-l-appearance">Appearance</div>
            <div class="cp-seg-row" role="group" aria-labelledby="cp-l-appearance">
              <button class="cp-seg" type="button" data-appearance="auto">Auto</button>
              <button class="cp-seg" type="button" data-appearance="light">Light</button>
              <button class="cp-seg" type="button" data-appearance="dark">Dark</button>
            </div>
          </div>
          <div class="cp-group">
            <div class="cp-label" id="cp-l-retro">Retro</div>
            <div class="cp-seg-row" role="group" aria-labelledby="cp-l-retro">
              <button class="cp-seg" type="button" data-retro="off">Off</button>
              <button class="cp-seg" type="button" data-retro="cga">CGA</button>
              <button class="cp-seg" type="button" data-retro="dos">DOS</button>
              <button class="cp-seg" type="button" data-retro="term">Term</button>
            </div>
          </div>
          <div class="cp-group" id="cp-accent-group">
            <div class="cp-label" id="cp-l-accent">Accent</div>
            <div class="cp-sw-row" role="group" aria-labelledby="cp-l-accent">
              <button class="cp-sw" type="button" data-acc="green" aria-label="Green" style="background:oklch(0.55 0.10 162)"></button>
              <button class="cp-sw" type="button" data-acc="pink" aria-label="Pink" style="background:oklch(0.62 0.15 8)"></button>
              <button class="cp-sw" type="button" data-acc="blue" aria-label="Blue" style="background:oklch(0.58 0.13 248)"></button>
              <button class="cp-sw" type="button" data-acc="gold" aria-label="Gold" style="background:oklch(0.70 0.13 75)"></button>
              <button class="cp-sw" type="button" data-acc="rainbow" aria-label="Rainbow" style="background:linear-gradient(135deg,#F79533,#EF4E7B,#A166AB,#1098AD,#6DBA82)"></button>
            </div>
          </div>
          <div class="cp-group">
            <div class="cp-label" id="cp-l-wall">Wallpaper</div>
            <div class="cp-seg-row" role="group" aria-labelledby="cp-l-wall">
              <button class="cp-seg" type="button" data-wall="dots">Dots</button>
              <button class="cp-seg" type="button" data-wall="grid">Grid</button>
              <button class="cp-seg" type="button" data-wall="plain">Plain</button>
            </div>
          </div>
          <p class="cp-foot">Appearance, accent and wallpaper are remembered.
          The retro themes are not — they go back to Off on your next visit.</p>
        </div>
      </div>`;

    document.body.appendChild(scrim);
    scrim.addEventListener("pointerdown", (e) => { if (e.target === scrim) closeCP(); });

    applyTheme(); applyAccent(); applyWall();
    requestAnimationFrame(() => scrim.classList.add("in"));
    scrim.querySelector("[data-cp-close]").focus();
  }

  function closeCP() {
    const scrim = document.querySelector(".cp-scrim");
    if (!scrim) return;
    scrim.classList.remove("in");
    setTimeout(() => scrim.remove(), 240);
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
    if (e.target.closest("[data-control]")) { e.preventDefault(); openCP(); return; }
    if (e.target.closest("[data-cp-close]")) { closeCP(); return; }

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

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeCP();
    closeMenu();
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
