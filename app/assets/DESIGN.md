# Seoul Roast Design System

### 1. Overview & Creative North Star
**Creative North Star: The Geometric Curator**
Seoul Roast is a high-end editorial design system inspired by Korean minimalist aesthetics and the precision of specialty coffee culture. It eschews "standard" app templates in favor of a look that feels like a premium print magazine. 

The system relies on **Intentional Asymmetry** and **Massive Typography Scale**. By pairing ultra-bold, condensed headings with hyper-technical, wide-tracked micro-labels, the system creates a sense of professional authority and curated taste.

### 2. Colors
The palette is grounded in the "Earth & Industry" spectrum—rich obsidian backgrounds paired with coffee-extracted ochre and warm neutrals.

- **The "No-Line" Rule:** Sectioning is achieved through color-blocking and negative space. Avoid 1px solid borders for layout separation. Instead, use transitions between `surface` and `surface_container_low`.
- **Surface Hierarchy:** Use `surface_container` for primary card backgrounds and `surface_container_highest` for interactive states. 
- **The Glass & Gradient Rule:** Navigation and Floating Action Buttons must utilize `backdrop-blur` (min 12px) and 80-95% opacity to maintain connection with the content beneath.
- **Signature Accent:** The Primary Color (`#a77d52`) should be used sparingly as a "highlighter" for active states, tags, and calls-to-action.

### 3. Typography
The system uses **Manrope** exclusively, relying on weight and letter-spacing variations to differentiate roles.

- **Display (2.25rem / 36px):** Ultra-bold, uppercase, with -0.02em tracking. Used for branding and primary headers.
- **Headline (1.25rem / 20px):** Bold, tight leading. For article titles.
- **Editorial Labels (9px - 11px):** High-tracking (0.15em), bold, and uppercase. These "Geometric" labels provide a technical, luxury-goods feel to metadata.
- **Body Text (0.875rem / 14px):** Medium weight for readability, avoiding the "gray" look of regular weights on dark backgrounds.

### 4. Elevation & Depth
Depth is created through "Tonal Stacking" rather than literal light sources.

- **The Layering Principle:** Content sits on `surface_container_low`. Overlays and "Quick View" cards sit on `surface_container_high`.
- **Ambient Shadows:** The system utilizes `shadow-lg` (a soft, wide-dispersion shadow) for large featured elements to make them appear to "hover" rather than "pop." 
- **Shadow Values:**
  - **Large Components:** `0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.1)`
  - **Global Container:** `0 25px 50px -12px rgba(0, 0, 0, 0.7)`
- **Glassmorphism:** Navigation bars use an 80% opacity fill of the background color combined with a blur effect to create a "frosted glass" depth.

### 5. Components
- **Editorial Cards:** Features 85% width for horizontal scrolls, creating a "peek" effect that encourages exploration. Corners use a `0.75rem` (xl) radius.
- **Category Tabs:** Defined by a thick 2px bottom border in `primary` for the active state; inactive states are transparent.
- **Action Buttons:** Use "Ghost" styles by default with a `primary` text label. Primary actions use a solid fill with white text.
- **Input Fields:** Minimalist under-line style or subtle `surface_container` fills; no heavy bordering.

### 6. Do's and Don'ts
- **Do:** Use horizontal scrolling for "top-tier" content to break the vertical fatigue.
- **Do:** Use extreme tracking (letter spacing) for micro-labels to elevate them to "design elements."
- **Don't:** Use standard material shadows; they are too sharp for this editorial aesthetic. Use the "Ambient Shadow" guidelines.
- **Don't:** Add borders to cards. Let the image and background color change define the boundary.
- **Do:** Ensure all text on `surface` backgrounds uses `on_surface` (light cream) for optimal contrast in the dark mode environment.