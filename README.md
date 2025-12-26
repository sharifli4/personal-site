# RETROVISION

> A nostalgic CRT television-inspired portfolio website

```
    ╱╲   ╱╲
   ╱  ╲ ╱  ╲
  ╱    ▼    ╲
 ┌───────────────────────┐
 │  ┌─────────────────┐  │
 │  │                 │  │
 │  │   CHANNEL 01    │  │
 │  │                 │  │
 │  │   ▶ visacus.com │  │
 │  │                 │  │
 │  └─────────────────┘  │
 │   RETROVISION    ◉ ◉  │
 │              [+][-]●  │
 └───────────────────────┘
      ╱╱          ╲╲
```

## Overview

A unique portfolio experience that transforms your projects into TV channels. Navigate through channels using physical-style knobs, buttons, keyboard, touch gestures, or mouse scroll. Complete with authentic CRT effects including scanlines, screen curvature, static noise, and warm-up animations.

## Features

- **Authentic CRT Aesthetics** — Scanlines, vignette, screen glow, and curved glass effect
- **Interactive Controls** — Rotatable knobs, clickable buttons, and power switch with LED indicator
- **TV Static Effect** — Real-time canvas-based noise during channel transitions
- **Antenna Animation** — Antennas wiggle when "receiving" a new channel
- **Audio Feedback** — Power on/off sounds, click effects, and static noise
- **Multiple Input Methods** — Knob, buttons, keyboard, touch swipe, and mouse scroll
- **Responsive Design** — Scales beautifully across devices
- **Zero Dependencies** — Pure HTML, CSS, and vanilla JavaScript

## Controls

| Input | Action |
|-------|--------|
| **Knob** | Drag to rotate through channels |
| **+/- Buttons** | Next/previous channel |
| **Power Button** | Toggle TV on/off |
| **Screen Click** | Open project link |
| **Arrow Up/Down** | Next/previous channel |
| **W/S Keys** | Next/previous channel |
| **Space** | Toggle power |
| **Enter** | Open current project |
| **Mouse Scroll** | Scroll up/down on screen to change channels |
| **Touch Swipe** | Swipe on screen to change channels |

## Tech Stack

```
HTML5        Structure & semantics
CSS3         Animations, effects, responsive layout
JavaScript   State management, interactions, audio
Canvas API   Real-time static noise generation
```

## Project Structure

```
personal-site/
├── index.html              # Main HTML structure
├── css/
│   ├── main.css            # Base styles & variables
│   ├── tv-frame.css        # TV body, controls, knobs
│   ├── tv-screen.css       # Screen, CRT effects
│   └── animations.css      # Keyframe animations
└── js/
    ├── app.js              # App initialization
    ├── audio-manager.js    # Sound effects
    ├── knob-control.js     # Rotatable knob component
    ├── projects.js         # Channel/project data
    ├── static-effect.js    # Canvas static noise
    └── tv-controller.js    # Main TV state machine
```

## Customization

Edit `js/projects.js` to add your own channels:

```javascript
const PROJECTS = [
  {
    id: 1,
    title: "My Project",
    description: "A brief description of the project.",
    url: "https://example.com",
    thumbnail: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    icon: "🚀",
    color: "#667eea"
  },
  // Add more channels...
];
```

### Thumbnail Options

```javascript
// Gradient background
thumbnail: "linear-gradient(135deg, #f0f0f0 0%, #808080 100%)"

// Solid color
thumbnail: "#1a1a2e"

// Image URL
thumbnail: "path/to/image.jpg"
```

## Quick Start

```bash
# Clone the repository
git clone https://github.com/sharifli4/personal-site.git

# Open in browser
open index.html

# Or serve locally
npx serve .
```

## Browser Support

Works in all modern browsers with ES6+ support.

| Chrome | Firefox | Safari | Edge |
|--------|---------|--------|------|
| 60+    | 55+     | 12+    | 79+  |

## License

MIT

---

<p align="center">
  <sub>Built with nostalgia by <a href="https://visacus.com">Kanan Sharifli</a></sub>
</p>
