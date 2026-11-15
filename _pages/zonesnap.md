---
title: ZoneSnap
type: static
permalink: /zonesnap
header_content: Window snap zones for macOS, in the menu bar.
---

Snap windows into place with a keyboard shortcut or by dragging to a screen edge. Made for people with more than one monitor, including **rotated (vertical) monitors**, where you want one window on top and another below.

## What it does

- **Zones** – halves, thirds, quarters, center and maximize, plus your own.
- **Shortcuts** – `Ctrl + Option` with the arrow keys. Press again to cycle sizes.
- **Drag to snap** – drag a window to an edge or corner and a preview shows where it lands.
- **Neighbors follow** – resize one window and the window next to it fills the gap.
- **Vertical screens** get their own zones: top, middle and bottom.
- **One small menu** in the menu bar. No Dock icon, no account, no network.

Built for macOS 12 (Monterey) and later, and tested on macOS 12. Tried it on a newer macOS? [Let me know](https://github.com/BadhriNadhBade/ZoneSnap/issues). Free and open source (MIT).

## Install

You need the free Command Line Tools, not Xcode.

```bash
xcode-select --install   # skip if you already have them
git clone https://github.com/BadhriNadhBade/ZoneSnap.git
cd ZoneSnap
./scripts/install.sh
```

Then allow **ZoneSnap** under System Settings → Privacy & Security → Accessibility, and try `Ctrl + Option + ←` on any window.

## Links

- [Source on GitHub](https://github.com/BadhriNadhBade/ZoneSnap)

ZoneSnap is an independent project. It is not affiliated with any other window manager.
