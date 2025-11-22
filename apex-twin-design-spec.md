
# ApexTwin / deltaTrack — Design System Specification (v0.1)

A design language for the track-day setup companion app. Inspired by the *Warp / Aphex Twin* aesthetic but original, safe, and motorsport-oriented.

---

## 1. Design Philosophy

ApexTwin’s identity is:
**Technical • Minimal • Geometric • Experimental • Motorsport-Engineered**

The visual tone combines:
- dark engineered surfaces
- neon technical accents
- brutalist typography
- geometric iconography
- subtle digital noise
- racing-influenced structure

It should feel like a **technical manual from the future**, not a “sporty app”.
Clean, confident, and data‑first.

---

## 2. Colour Palette

### 2.1 Core UI Palette (Foundations)

| Token | Hex | Usage |
|-------|------|---------|
| **Carbon Black** | `#0B0B0C` | Main background |
| **Graphite** | `#1A1C1F` | Panels, cards, input blocks |
| **Stealth Grey** | `#2C2E32` | Hairlines, borders, gridlines |
| **Near-White** | `#F2F2F2` | Primary text |
| **Soft Grey** | `#A0A4A8` | Secondary labels |
| **Heat Red** | `#FF3B2F` | Errors, over-temp, warnings |

### 2.2 Accent Palette (Brand Identity)

Choose one as the *primary accent*.

#### Option A — Electro Mint (recommended)
- **Electro Mint** — `#00FF9A`
- **Mint Tint** — `#7DFFD0`

#### Option B — Delta Blue
- **Delta Blue** — `#00C7FF`
- **Blue Tint** — `#7ADFFE`

### 2.3 Usage Guidelines
- Use **ONE main accent colour** across the app.
- Use accents only for:
  - buttons
  - data deltas
  - highlights
  - interactive elements
- Avoid gradients. Keep it flat, minimal.

---

## 3. Typography System

### 3.1 Primary Font (UI)
**Söhne** (preferred)
or **Inter** (free alternative)

Usage:
- All headings
- UI labels
- Buttons
- Track names
- Structural layout text

### 3.2 Secondary Font (Data)
**IBM Plex Mono**

Usage:
- Lap times
- PSI values
- Suspension clicks
- Electronics modes (TC, ABS, MAP)
- Technical readouts

### 3.3 Typography Scale

| Role | Font | Size | Weight | Notes |
|------|-------|-------|---------|-------|
| H1 | Söhne/Inter | 32px | 700 | Page titles |
| H2 | Söhne/Inter | 24px | 600 | Section titles |
| Label | Inter | 11–12px | 600 | Small caps optional |
| Body | Inter | 14–16px | 400 | Main copy |
| Data | Plex Mono | 14–18px | 600 | Tight letterspacing |

### 3.4 Style Recommendations
- Tight line-height (1.1–1.2)
- Data in uppercase mono where possible
- Brutalist all-caps for section headers
- Avoid rounded typography

---

## 4. Iconography Guidelines

### 4.1 Style Rules
- 2px line weight
- Geometric, minimal
- No fills except critical icons
- Angular; avoid soft rounded corners
- Mono-weight strokes
- White / grey only; accent only for interactives

### 4.2 Track & Bike‑specific Icon Concepts

#### Tyre / Pressure
- Circle outline + 3 radial ticks
- PSI in Plex Mono, e.g.: **32.1 PSI**
- Hot/cold ∆ indicator: small triangle glyph

#### Suspension
- Vertical measurement bar with ticks
- Simple dial outline with pointer
- “Click count” as numeric mono block

#### Electronics
- TC: `TC 3` in mono
- Map: `MAP A` block
- ABS: square icon + level indicator

#### Track Layouts
- Abstracted polylines approximating circuit shape
- Geometric-only, no textures
- Thin 2px lines

#### Delta / Change
- Triangle (∆)
- Double chevron
- Up/down arrows for setup changes

### 4.3 What NOT to emulate
- No circular symbols with asymmetric tails
- No reinterpretations of Aphex Twin’s A logo
- No Warp-style grid logo mimicry

---

## 5. Layout, Structure & Interaction

### 5.1 General Layout
- Vertical grid system
- Asymmetric compositions allowed
- Lots of negative space
- Data arranged in **blocks**, not “cards”
- Sharp rectangular panels

### 5.2 Surfaces & Panels
- Use Carbon Black for main background
- Graphite for panels
- Stealth Grey 1px borders to give engineered feel

### 5.3 Motion (Minimal)
- Micro-animations only:
  - hover glow on accent lines
  - subtle fade-in for data rows
- NO bouncing, sliding, easing gimmicks

### 5.4 Example Panel Aesthetic

```
-------------------------------------
 TYRE PRESSURES            [EDIT]
-------------------------------------
 Front (COLD)       32.1 PSI
 Rear  (COLD)       29.0 PSI
 Hot Delta          +3.2 / +2.7
-------------------------------------
```

Monospaced numbers, sharp blocks, minimal text.

---

## 6. Visual Motifs

### 6.1 Technical Grid Background (optional)
- 1px grid
- Opacity 3–6%
- Gives “technical manual” feel

### 6.2 Noise Layer
- Light grain overlay (1–2%)
- Only on dark backgrounds

### 6.3 Accent Glow
- Neon outline on hover
- Minimal glow radius (2–4px)
- Use sparingly

---

## 7. Brand Summary

**ApexTwin =**
Dark engineered surfaces + neon accents + brutalist typography + geometric icons + subtle digital noise.

The overall feeling:
- futuristic
- engineered
- track‑mechanic meets IDM producer

Perfect for a modern track setup companion.

---

## 8. Future Design Extensions

- Logo variants for **deltaTrack** using ∆
- Paddock matrix view with mint/blue highlight
- Data heatmaps for tyre evolution
- Track‑specific themes (subtle, non-gimmicky)

---

*End of Design Document v0.1*
