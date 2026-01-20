# STEa Layer Navigation Specification

**Document version:** 1.0  
**Author:** David Loake (Arcturus Digital Consulting)  
**Date:** 2025-10-21  

---

## 🎯 Purpose

To enhance the **STEa Board** with intuitive, multi-layer navigation for cards, features, and epics.  
The goal is to make hierarchy navigation (Card → Feature → Epic → Board) fluid and visual without extra clicks or context switching.

---

## 🧩 Overview

### Hierarchical Structure
1. **Epics (Red border)**  
   - Represent large thematic groupings or initiatives.  
   - Contain one or more Features.

2. **Features (Orange border)**  
   - Represent deliverable units or components of an Epic.  
   - Contain one or more Cards.

3. **Cards (Inner tiles)**  
   - Represent stories or PBIs (Product Backlog Items).  
   - Contain specific titles, owners, and comments.

This visual nesting gives users immediate context of where a card lives.

---

## 🖱️ Interaction Model

### 1. Click Interaction
- **Clicking the border** of a Feature or Epic opens a **drawer modal** with details:
  - Title and reference (e.g., EPIC-001, FEATURE-002A)
  - Linked items and metadata
  - Option to edit or view progress

### 2. Command + Scroll Layer Surfing
- Hold **Cmd (Mac)** or **Ctrl (Windows/Linux)** + **Mouse Scroll** to cycle through layers:
  - Scroll **up** → move outward (Card → Feature → Epic → Board)
  - Scroll **down** → move inward (Board → Epic → Feature → Card)

This enables seamless “depth” navigation without opening extra views.

### 3. Keyboard Shortcuts
- **`[`** → move up one layer  
- **`]`** → move down one layer  

### 4. Touch Interaction
- Long press (600ms) + vertical swipe to move between layers.

---

## 💻 Visual Design

| Layer | Border | Label | Color | Example |
|--------|---------|--------|--------|----------|
| Epic | 4px solid | Top label bar | 🔴 Red (`#ef4444`) | EPIC-001 |
| Feature | 2px solid | Top label bar | 🟠 Orange (`#f97316`) | FEATURE-002 |
| Card | 1px solid | Inline | ⚪ Grey (`#e5e7eb`) | CARD-101-100 |

### Visual cues
- Hovering highlights related Feature/Epic borders.  
- Clicking a border triggers subtle **ring animation** before opening the modal.  
- Distinct **corner rounding per layer**: square (Epic), medium (Feature), round (Card).  

---

## 🧠 Implementation Outline

### React Hooks

#### `useLayerNavigator`
Manages which layer is currently active (`card`, `feature`, `epic`, `board`).  
Stores state in `localStorage` so the board reopens at the same depth.

#### `useMetaWheelLayering`
Intercepts Cmd/Ctrl + scroll to move between layers and highlight the active one.

### Board Integration Example

- Wrap each Epic and Feature section in clickable containers.  
- Assign `data-role` attributes (`epic`, `feature`, `card`) for event delegation.  
- Use Tailwind classes for conditional rings and colours:
  ```jsx
  className={layer === 'feature' ? 'ring-2 ring-orange-400' : ''}
  ```

---

## 🗄️ Firestore Data Model

- **Epics** live in the `stea_epics` collection with display metadata (`label`, `color`, `order`, etc.).  
- **Features** live in `stea_features`, each referencing its parent via `epicId` and optional `boardId`.  
- **Cards** remain in `stea_cards` for backwards compatibility; each card should include `featureId` and `epicId` pointers for hierarchy lookups.  
- **Comments** stay as subcollections beneath any `/cards/{cardId}` document (flat or nested).

### Security Rules Snapshot

The Firestore rules file (`firestore.rules`) now exposes the Epic → Feature → Card hierarchy while keeping the legacy flat collection permitted for reads and writes.

```firestore
match /stea_epics/{epicId} {
  allow read, create, update, delete: if authed();

  match /features/{featureId} {
    allow read, create, update, delete: if authed();

    match /cards/{cardId} {
      allow read, create, update, delete: if authed();

      match /comments/{cid} {
        allow read, create, delete: if authed();
      }
    }
  }
}

match /stea_features/{featureId} {
  allow read, create, update, delete: if authed();
}

match /stea_cards/{cardId} {
  allow read, create, update, delete: if authed();
}
```

---

## ⚙️ Accessibility

- Add `aria-label` and `aria-current` for each layer container.
- Tooltips: “Hold ⌘ (Ctrl) + scroll to change layer.”  
- Ensure keyboard navigation mirrors scroll-based navigation.

---

## 💾 Persistence

- Last-focused layer is stored in `localStorage` key: `stea:lastLayer`.
- Optional Firestore sync for multi-device persistence (future enhancement).

---

## 🧭 Future Enhancements

1. **Breadcrumb Indicator**
   - Floating chips: `Card • Feature • Epic`
   - Clicking a chip jumps to that layer.

2. **Minimap / Outline View**
   - Sidebar tree showing all Epics → Features → Card counts.

3. **Highlight-on-hover links**
   - Hovering a card outlines its Feature/Epic container for context tracing.

---

## ✅ Summary

This enhancement brings **spatial awareness** and **smooth navigation** to the STEa Board.  
Users can “zoom” through layers using intuitive scroll or shortcut interactions, reducing clicks and improving contextual understanding of relationships between Cards, Features, and Epics.

---

**End of Document**
