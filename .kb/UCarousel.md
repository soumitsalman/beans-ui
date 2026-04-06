# Nuxt UI Carousel - Compressed KB: Switch & Config Combinations for Visual Effects

## Core Switches (Props)
- `loop`: boolean → infinite scrolling (essential for autoplay, auto-scroll, seamless galleries)
- `orientation`: 'horizontal' | 'vertical' (vertical needs explicit container height)
- `arrows`: boolean + `:prev` / `:next` (Button props) + `prev-icon` / `next-icon`
- `dots`: boolean (number based on visible slides)
- `items`: array → default slot `{ item, index }`
- Multiple visible slides: `:ui="{ item: 'basis-1/2 | basis-1/3 | basis-1/4 ...' }"`
- Global styling: `:ui="{ container, item, prev, next, dots ... }"` (Tailwind classes)

## Embla Core Options (pass via props or options)
- `align`: 'start' | 'center' | 'end'
- `slidesToScroll`: 1 | 'auto'
- `dragFree`: boolean (free scrolling, no snap)
- `containScroll`: 'trimSnaps' | false
- `breakpoints`: object (responsive)

## Plugins & Visual Effects (enable as `:plugin-name="true"` or object)

### 1. Fade Transition Effect
- Switches: `fade` + `loop`
- Visual: Smooth cross-fade between slides instead of slide/scroll
- Best combo: `fade + loop + autoplay + arrows + dots`
- Extra: Use `class-names` for opacity control on non-active slides

### 2. Autoplay (Timed Auto-Advance)
- Switches: `autoplay="{ delay: 2500, stopOnInteraction: true/false }"` + `loop`
- Visual: Hands-free cycling (hero banners, testimonials)
- Strong combos:
  - Autoplay + Fade → elegant fading slideshow
  - Autoplay + Arrows + Dots → standard image gallery
  - Autoplay + Auto-Scroll → continuous flow with pause on hover possible

### 3. Auto-Scroll (Continuous Marquee / Ticker)
- Switches: `auto-scroll="{ speed: 1, stopOnInteraction: true }"` + `loop` + `dragFree: true`
- Visual: Smooth endless horizontal/vertical scrolling (logos, news ticker)
- Best: Auto-Scroll + Loop + no arrows/dots (pure motion)

### 4. Auto-Height (Dynamic Container Height)
- Switches: `auto-height` + `transition-[height]` on container via `ui`
- Visual: Container resizes smoothly to tallest visible slide
- Best combos:
  - Auto-Height + Vertical orientation → variable height vertical feed
  - Auto-Height + Fade → clean fading with height adjustment
  - Auto-Height + Multiple items → mixed content carousels

### 5. Class Names (State-Based Styling)
- Switches: `class-names` + Tailwind on items e.g. `ui.item: 'transition-opacity [&:not(.is-snapped)]:opacity-50'`
- Visual: Highlight active/snapped/in-view slides, fade others, scale effects
- Powerful with: Fade + Class Names, or Auto-Scroll + Class Names

### 6. Wheel Gestures
- Switches: `wheel-gestures`
- Visual: Mouse wheel / trackpad navigation (vertical feel on horizontal carousel)

### 7. Vertical Carousel
- Switches: `orientation="vertical"` + `:ui="{ container: 'h-[400px]' }"`
- Visual: Vertical scrolling feed (mobile stories, timelines)
- Combos: Vertical + Auto-Height + Wheel Gestures + Autoplay

### 8. Thumbnail Navigation
- Use exposed `emblaApi.scrollTo(index)`
- Visual: Main carousel + separate thumbnail strip below
- Combo: Main (arrows + dots + autoplay) + Thumbnails (smaller basis, clickable)

## High-Impact Combinations & Resulting Effects

| Desired Visual Effect              | Recommended Switches / Configs |
|------------------------------------|--------------------------------|
| Elegant fading hero banner        | `fade + loop + autoplay + arrows + dots` |
| Continuous logo marquee           | `auto-scroll + loop + dragFree + ui.item basis-1/5` |
| Variable height content feed      | `auto-height + transition-[height] + vertical` |
| Snappy multi-item gallery         | `arrows + dots + ui.item:basis-1/3 + loop` |
| Subtle opacity highlight          | `class-names + ui.item: '[&:not(.is-snapped)]:opacity-30 transition-all'` |
| Interactive vertical stories      | `vertical + wheel-gestures + auto-height` |
| Seamless infinite gallery         | `loop + autoplay + fade + arrows` |
| Free-dragging ticker              | `auto-scroll + dragFree + loop` |
| Responsive product showcase       | `breakpoints + basis-1/2 sm:basis-1/3 + arrows` |

## Quick Template Pattern
```vue
<UCarousel
  :items="items"
  loop arrows dots
  :autoplay="{ delay: 3000 }"
  :fade="true"
  :ui="{ item: 'basis-1/3 transition-opacity' }"
  wheel-gestures
>
  <template #default="{ item }">
    <img :src="item" class="rounded-xl">
  </template>
</UCarousel>