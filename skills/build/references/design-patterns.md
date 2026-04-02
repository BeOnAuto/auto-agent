# Frontend Design Patterns Reference

Premium UI/UX design guidelines for generating beautiful, non-generic interfaces. Based on [Payoss/UIUX-high-taste-skill](https://github.com/Payoss/UIUX-high-taste-skill) — adapted for Auto's narrative-driven build pipeline.

Apply these patterns when generating any user-facing UI from the model's `client.ui.spec`. The json-render specs provide structure; these patterns provide polish.

---

## 1. Baseline Configuration

* DESIGN_VARIANCE: 8 (1=Symmetric, 10=Artsy Chaos)
* MOTION_INTENSITY: 6 (1=Static, 10=Cinematic)
* VISUAL_DENSITY: 4 (1=Art Gallery, 10=Cockpit)

Adapt dynamically based on the application domain. A dashboard skews toward higher density; a consumer landing page skews toward lower.

## 2. Architecture Constraints

* **Dependency verification:** Before importing any 3rd-party library, check `package.json`. If missing, install it first.
* **Framework:** React. Default to functional components with hooks.
* **Styling:** Tailwind CSS. Check `package.json` for v3 vs v4 — do not mix syntax.
* **Icons:** Use `@phosphor-icons/react` or `@radix-ui/react-icons`. Standardize `strokeWidth` globally. Never use emojis in UI code.
* **Responsiveness:** Contain layouts with `max-w-[1400px] mx-auto`. Use `min-h-[100dvh]` instead of `h-screen`. Use CSS Grid over flex percentage math.

## 3. Typography

* **Headlines:** `text-4xl md:text-6xl tracking-tighter leading-none`. Use `Geist`, `Outfit`, `Cabinet Grotesk`, or `Satoshi` — never `Inter`, `Roboto`, `Arial`, or `Open Sans`.
* **Body:** `text-base text-gray-600 leading-relaxed max-w-[65ch]`.
* **Dashboard rule:** Serif fonts are banned for software UIs. Use `Geist` + `Geist Mono` or `Satoshi` + `JetBrains Mono`.

## 4. Color

* Max 1 accent color. Saturation < 80%.
* No "AI purple/blue" neon gradients. Use neutral bases (Zinc/Slate) with singular high-contrast accents (Emerald, Electric Blue, Deep Rose).
* Stick to one palette for the entire project. No warm/cool gray mixing.
* Never use pure `#000000` — use Off-Black, Zinc-950, or Charcoal.

## 5. Layout

* **Anti-center bias:** Centered hero sections are banned when variance > 4. Use split-screen, left-aligned content, or asymmetric whitespace.
* **Anti-3-column:** Generic "3 equal cards" rows are banned. Use 2-column zig-zag, asymmetric grid, or horizontal scroll.
* **Mobile override:** Any asymmetric layout above `md:` must fall back to single-column (`w-full`, `px-4`, `py-8`) below 768px.

### Layout Archetypes (pick 1 per page)

1. **Asymmetrical Bento:** Masonry-like CSS Grid with varying card sizes. Falls to `grid-cols-1` on mobile.
2. **Z-Axis Cascade:** Overlapping elements with depth and subtle rotation. Remove overlaps on mobile.
3. **Editorial Split:** Massive typography on one half, interactive content on the other. Stacks vertically on mobile.

## 6. Component Architecture

### Double-Bezel (Doppelrand)
Never place a card flat on the background. Use nested enclosures:
- **Outer shell:** `bg-black/5`, `ring-1 ring-black/5`, `p-1.5`, `rounded-[2rem]`
- **Inner core:** Own background, inner highlight (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`), concentric radius (`rounded-[calc(2rem-0.375rem)]`)

### CTA Buttons
Fully rounded pills (`rounded-full`, `px-6 py-3`). Trailing arrow icons get their own circular wrapper nested inside the button.

### Cards & Surfaces
Use cards only when elevation communicates hierarchy. For dashboards with density > 7, prefer `border-t`, `divide-y`, or negative space over card containers. Tint shadows to background hue.

### Glassmorphism
Go beyond `backdrop-blur`. Add `border-white/10` and `shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]` for edge refraction.

## 7. Interactive States

Every component must implement:
* **Loading:** Skeleton loaders matching layout sizes (no generic spinners)
* **Empty states:** Composed empty states showing how to populate data
* **Error states:** Clear inline error reporting
* **Tactile feedback:** On `:active`, use `-translate-y-[1px]` or `scale-[0.98]`

## 8. Motion

* Never use `linear` or `ease-in-out`. Use custom cubic-beziers: `transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]`
* Spring physics for interactive elements: `type: "spring", stiffness: 100, damping: 20`
* Scroll entry: Elements fade-up (`translate-y-16 blur-md opacity-0` to `translate-y-0 blur-0 opacity-100` over 800ms+). Use `IntersectionObserver` or Framer Motion `whileInView`, never `window.addEventListener('scroll')`.
* Staggered reveals for lists and grids using `staggerChildren` or CSS cascade delays.
* Layout transitions via Framer Motion `layout` and `layoutId` props.

### Performance rules
* Animate only `transform` and `opacity` — never `top`, `left`, `width`, `height`.
* Apply `backdrop-blur` only to fixed/sticky elements, never scrolling containers.
* Apply grain/noise to fixed `pointer-events-none` pseudo-elements only.
* Isolate perpetual animations in their own components (`React.memo`).
* Never mix GSAP/ThreeJS with Framer Motion in the same component tree.

## 9. Spatial Rhythm

* **Macro-whitespace:** Double standard padding. Use `py-24` to `py-40` for sections.
* **Eyebrow tags:** Before major headings, use pill-shaped badges: `rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium`.
* **Forms:** Label above input, helper text optional, error text below. Standard `gap-2` for input blocks.

## 10. Content Quality

* No generic names ("John Doe", "Jane Smith"). Use creative, realistic names.
* No generic avatars (SVG egg icons). Use styled photo placeholders or `picsum.photos/seed/{id}/`.
* No fake round numbers. Use organic data (`47.2%`, `+1 (312) 847-1928`).
* No startup slop names ("Acme", "Nexus", "SmartFlow"). Invent contextual brand names.
* No AI copywriting cliches ("Elevate", "Seamless", "Unleash", "Next-Gen"). Use concrete verbs.
* No Unsplash links. Use `https://picsum.photos/seed/{random}/800/600` or SVG placeholders.

## 11. shadcn/ui Customization

You may use `shadcn/ui`, but never in its generic default state. Customize radii, colors, and shadows to match the project aesthetic. When used via json-render's `@json-render/shadcn`, apply the same customization through Tailwind config and CSS variables.

## 12. Vibe Archetypes

When starting a new UI, select one based on domain context:

1. **Ethereal Glass (SaaS/AI/Tech):** OLED black (`#050505`), radial mesh gradients, `backdrop-blur-2xl`, pure white/10 hairlines, wide geometric Grotesk type.
2. **Editorial Luxury (Lifestyle/Agency):** Warm creams (`#FDFBF7`), muted sage/espresso, variable serif headings, subtle CSS noise overlay (`opacity-[0.03]`).
3. **Soft Structuralism (Consumer/Health/Portfolio):** Silver-grey or white backgrounds, massive bold Grotesk type, floating components with ultra-diffused ambient shadows.

## 13. Pre-Output Checklist

Before delivering any UI code:
- [ ] No banned fonts (Inter, Roboto, Arial, Open Sans, Helvetica)
- [ ] No banned patterns (neon glows, pure black, oversaturated accents, gradient text)
- [ ] Double-Bezel used for major cards and containers
- [ ] Section padding at minimum `py-24`
- [ ] Custom cubic-bezier transitions — no `linear` or `ease-in-out`
- [ ] Scroll entry animations present
- [ ] Layout collapses to single-column below 768px
- [ ] All animations use only `transform` and `opacity`
- [ ] `backdrop-blur` only on fixed/sticky elements
- [ ] Loading, empty, and error states implemented
- [ ] Mobile-safe: `min-h-[100dvh]`, no `h-screen`
