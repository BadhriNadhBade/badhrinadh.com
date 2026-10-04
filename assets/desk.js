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

  const isMobile = () => window.matchMedia("(max-width: 759px)").matches;
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
    // every in-flow window except the backdrop listing behind an article
    document.querySelectorAll(".deskwrap .window:not(.win-listing-bg)").forEach((win) => {
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
      win.addEventListener("pointerdown", () => {
        focusWindow(win);
        if (win.classList.contains("floatwin")) win.style.zIndex = ++zTop + 70;
      });
    });
  }

  /* ---------- a generic draggable, for the floating windows ---------- */
  function makeDraggable(win) {
    const bar = win.querySelector(".titlebar");
    if (!bar) return;
    let sx, sy, ox, oy, dragging = false;

    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".tb-box")) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = parseFloat(win.style.left) || win.offsetLeft;
      oy = parseFloat(win.style.top) || win.offsetTop;
      bar.setPointerCapture(e.pointerId);
    });

    bar.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      // keep a grabbable sliver on screen at all times
      let nx = ox + (e.clientX - sx);
      let ny = oy + (e.clientY - sy);
      nx = Math.max(-win.offsetWidth + 90, Math.min(nx, window.innerWidth - 90));
      ny = Math.max(32, Math.min(ny, window.innerHeight - 34));
      win.style.left = nx + "px";
      win.style.top = ny + "px";
    });

    const stop = () => (dragging = false);
    bar.addEventListener("pointerup", stop);
    bar.addEventListener("pointercancel", stop);
  }

  /* ---------- snake.exe ---------- */
  function openSnake() {
    const existing = document.getElementById("snake-window");
    if (existing) { existing.style.zIndex = ++zTop + 70; return; }

    const win = document.createElement("div");
    win.className = "window floatwin snake-window";
    win.id = "snake-window";
    win.innerHTML = `
      <div class="titlebar">
        <span class="ttl">snake.exe</span>
        <button class="tb-box tb-x" data-floatclose type="button" aria-label="Close snake">${X_SVG}</button>
      </div>
      <div class="snake-body">
        <canvas id="snake-canvas" width="224" height="168" aria-label="Snake game"></canvas>
        <div class="snake-dpad" role="group" aria-label="Direction pad">
          <button type="button" class="dpad-btn dpad-up" data-dir="up" aria-label="Up">&#9650;</button>
          <button type="button" class="dpad-btn dpad-left" data-dir="left" aria-label="Left">&#9664;</button>
          <button type="button" class="dpad-btn dpad-right" data-dir="right" aria-label="Right">&#9654;</button>
          <button type="button" class="dpad-btn dpad-down" data-dir="down" aria-label="Down">&#9660;</button>
        </div>
        <p class="snake-legend"><b>arrows / swipe</b> &middot; score <span id="snake-score">0</span></p>
      </div>`;

    const w = Math.min(256, window.innerWidth - 24);
    win.style.width = w + "px";
    win.style.left = Math.max(12, Math.round((window.innerWidth - w) / 2)) + "px";
    win.style.top = isMobile() ? "66px" : "88px";
    win.style.zIndex = ++zTop + 70;

    document.body.appendChild(win);
    makeDraggable(win);
    focusWindow(win);
    runSnake(win);
  }

  function runSnake(win) {
    const canvas = win.querySelector("#snake-canvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = win.querySelector("#snake-score");
    const CELL = 14;
    const COLS = canvas.width / CELL;
    const ROWS = canvas.height / CELL;

    // read the palette so the game follows the active theme
    const paint = () => {
      const s = getComputedStyle(root);
      return {
        bg: s.getPropertyValue("--paper-2").trim() || "#fff",
        px: s.getPropertyValue("--ink").trim() || "#000",
        food: s.getPropertyValue("--accent").trim() || "#000",
      };
    };

    let snake, dir, nextDir, food, score, dead, started, loop;

    function placeFood() {
      do {
        food = { x: (Math.random() * COLS) | 0, y: (Math.random() * ROWS) | 0 };
      } while (snake.some((s) => s.x === food.x && s.y === food.y));
    }

    function reset() {
      snake = [{ x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }];
      dir = { x: 1, y: 0 };
      nextDir = dir;
      score = 0;
      dead = false;
      started = false;
      scoreEl.textContent = "0";
      placeFood();
      draw();
    }

    function overlay(text, c) {
      ctx.fillStyle = c.px;
      ctx.fillRect(0, canvas.height / 2 - 15, canvas.width, 30);
      ctx.fillStyle = c.bg;
      ctx.font = "600 13px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    function draw() {
      const c = paint();
      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = c.food;
      ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);
      ctx.fillStyle = c.px;
      snake.forEach((s) => ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2));
      if (dead) overlay("GAME OVER · TAP", c);
      else if (!started) overlay("PRESS ARROW", c);
    }

    function step() {
      if (!started || dead) return;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
          snake.some((s) => s.x === head.x && s.y === head.y)) {
        dead = true;
        draw();
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        placeFood();
      } else {
        snake.pop();
      }
      draw();
    }

    function setDir(x, y) {
      if (dead) { reset(); return; }
      if (snake.length > 1 && x === -dir.x && y === -dir.y) return; // no reversing
      nextDir = { x, y };
      started = true;
    }

    const onKey = (e) => {
      if (!document.body.contains(canvas)) { document.removeEventListener("keydown", onKey); return; }
      const k = e.key;
      let handled = true;
      if (k === "ArrowUp" || k === "w") setDir(0, -1);
      else if (k === "ArrowDown" || k === "s") setDir(0, 1);
      else if (k === "ArrowLeft" || k === "a") setDir(-1, 0);
      else if (k === "ArrowRight" || k === "d") setDir(1, 0);
      else if (k === " " && dead) reset();
      else handled = false;
      if (handled) e.preventDefault();
    };
    document.addEventListener("keydown", onKey);

    let tsx = null, tsy = null;
    canvas.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      tsx = t.clientX; tsy = t.clientY;
    }, { passive: true });
    canvas.addEventListener("touchend", (e) => {
      if (tsx == null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - tsx, dy = t.clientY - tsy;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
        else setDir(0, dy > 0 ? 1 : -1);
      }
      tsx = tsy = null;
    }, { passive: true });
    canvas.addEventListener("click", () => { if (dead) reset(); });

    const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    win.querySelectorAll(".dpad-btn").forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const d = DIRS[btn.dataset.dir];
        if (d) setDir(d[0], d[1]);
      });
    });

    reset();
    loop = setInterval(() => {
      if (!document.body.contains(canvas)) {
        clearInterval(loop);
        document.removeEventListener("keydown", onKey);
        return;
      }
      step();
    }, 150);
  }

  /* ---------- clicks ---------- */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-snake]")) { e.preventDefault(); openSnake(); return; }
    if (e.target.closest("[data-floatclose]")) { e.target.closest(".floatwin")?.remove(); return; }
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
    const first = document.querySelector(".deskwrap .window:not(.win-listing-bg)");
    if (first) focusWindow(first);
    tick();
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
