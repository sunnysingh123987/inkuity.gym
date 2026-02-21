# Inkuity Brand Guidelines

## 1. Brand Overview

**Inkuity** is a complete gym management platform built for modern fitness businesses. The brand conveys trust, energy, innovation, and professionalism.

**Brand Personality:** Modern, energetic, trustworthy, professional, approachable

---

## 2. Logo

### Primary Logo
- File: `/public/logo.png`
- Format: PNG with transparent background
- Minimum size: 32px height for digital use

### Logo Placement Rules
- Always maintain clear space equal to the height of the logo icon on all sides
- Do not stretch, rotate, or distort the logo
- Do not place the logo on busy backgrounds without sufficient contrast
- On dark backgrounds, use the logo as-is (designed for both light and dark use)

### Logo + Wordmark
- The wordmark "Inkuity" appears to the right of the logo icon
- Font: Plus Jakarta Sans, Bold (700)
- Spacing between icon and wordmark: 8px (0.5rem)

### Logo Variations
- **Full Logo**: Icon + "Inkuity" wordmark (primary use)
- **Icon Only**: Logo icon without wordmark (favicons, small spaces)
- **Gradient Icon**: `bg-gradient-to-br from-brand-cyan-500 to-brand-purple-500` with white QrCode icon (used in auth pages)

---

## 3. Color Palette

### Primary Colors

| Color | Hex | HSL | Usage |
|-------|-----|-----|-------|
| **Brand Cyan** | `#06b6d4` | `189 94% 43%` | Primary brand color, CTAs, active states, links |
| **Brand Pink** | `#ec4899` | `330 81% 60%` | Accent color, gradients, energy elements |
| **Brand Purple** | `#a855f7` | `271 91% 65%` | Secondary accent, gradients, innovation |
| **Brand Blue** | `#2563eb` | `217 91% 53%` | Professional accents, data visualizations |

### Brand Cyan Scale
| Shade | Hex | Usage |
|-------|-----|-------|
| 50 | `#ecfeff` | Light backgrounds (light mode) |
| 100 | `#cffafe` | Subtle highlights |
| 200 | `#a5f3fc` | Decorative elements |
| 300 | `#67e8f9` | Hover states |
| 400 | `#22d3ee` | Active text on dark backgrounds |
| **500** | **`#06b6d4`** | **Primary brand color** |
| 600 | `#0891b2` | Dark mode buttons, links |
| 700 | `#0e7490` | Deep accents |
| 800 | `#155e75` | Very dark accents |
| 900 | `#164e63` | Darkest shade |

### Brand Pink Scale
| Shade | Hex | Usage |
|-------|-----|-------|
| 400 | `#f472b6` | Decorative |
| **500** | **`#ec4899`** | **Primary accent** |
| 600 | `#db2777` | Gradient endpoints |
| 700 | `#be185d` | Deep accent |

### Brand Purple Scale
| Shade | Hex | Usage |
|-------|-----|-------|
| 400 | `#c084fc` | Gradient midpoints |
| **500** | **`#a855f7`** | **Secondary accent** |
| 600 | `#9333ea` | Gradient endpoints |
| 700 | `#7c3aed` | Deep accent |

### UI Colors (Dark Theme)

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--background` | `#ffffff` | `hsl(222 47% 5%)` | Page background |
| `--foreground` | `hsl(222.2 84% 4.9%)` | `hsl(210 40% 98%)` | Primary text |
| `--card` | `#ffffff` | `hsl(217 33% 10%)` | Card backgrounds |
| `--muted` | `hsl(210 40% 96.1%)` | `hsl(217 33% 15%)` | Muted backgrounds |
| `--muted-foreground` | `hsl(215.4 16.3% 46.9%)` | `hsl(215 20% 65%)` | Secondary text |
| `--border` | `hsl(214.3 31.8% 91.4%)` | `hsl(217 33% 18%)` | Borders |
| `--primary` | `#06b6d4` | `#06b6d4` | Primary interactive |

### Status Colors
| Status | Background | Text |
|--------|-----------|------|
| Active/Success | `bg-green-500/10` | `text-green-400` |
| Error/Destructive | `bg-red-500/10` | `text-red-400` |
| Warning | `bg-amber-500/10` | `text-amber-400` |
| Inactive/Neutral | `bg-muted` | `text-muted-foreground` |

---

## 4. Typography

### Font Family
- **Primary Font:** Plus Jakarta Sans (Google Fonts)
- **Fallback:** system-ui, -apple-system, sans-serif
- **CSS Variable:** `--font-sans`

### Font Weights
| Weight | Name | Usage |
|--------|------|-------|
| 400 | Regular | Body text, descriptions |
| 500 | Medium | Navigation links, labels |
| 600 | Semibold | Section headings, card titles |
| 700 | Bold | Page headings, emphasis |
| 800 | Extrabold | Hero headings, landing page |

### Type Scale
| Element | Size | Weight | Class |
|---------|------|--------|-------|
| Hero Heading | 3.75rem (60px) | Extrabold | `text-6xl font-extrabold` |
| Page Heading (H1) | 1.5rem (24px) | Bold | `text-2xl font-bold` |
| Section Heading (H2) | 1.875rem (30px) | Bold | `text-3xl font-bold` |
| Card Title (H3) | 1.125rem (18px) | Semibold | `text-lg font-semibold` |
| Body | 0.875rem (14px) | Regular | `text-sm` |
| Small / Caption | 0.75rem (12px) | Regular | `text-xs` |

### Text Color Rules
- **Primary text:** `text-foreground` (adapts to light/dark)
- **Secondary text:** `text-muted-foreground`
- **Brand links:** `text-brand-cyan-400` (dark) / `text-brand-cyan-600` (light)
- **Gradient text:** `text-gradient-brand` (cyan -> purple -> pink)

---

## 5. Gradients

### Brand Gradient (Primary)
```css
bg-gradient-to-r from-brand-cyan-500 via-brand-purple-500 to-brand-pink-500
```
Usage: Welcome banners, hero accents, premium elements

### Cyan-Pink Gradient
```css
bg-gradient-to-r from-brand-cyan-600 to-brand-pink-600
```
Usage: CTA buttons, section backgrounds

### Cyan-Blue Gradient
```css
bg-gradient-to-r from-brand-cyan-500 to-brand-blue-600
```
Usage: Professional sections, data elements

### Text Gradient
```css
bg-gradient-to-r from-brand-cyan-400 via-brand-purple-400 to-brand-pink-400 bg-clip-text text-transparent
```
Usage: Hero headings, emphasis text

---

## 6. Spacing & Layout

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Small elements, badges |
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Cards, containers |
| `rounded-xl` | 16px | Feature cards, CTAs |
| `rounded-2xl` | 20px | Landing page cards |
| `rounded-full` | 9999px | Avatars, badges, pills |

### Shadows
| Name | Value | Usage |
|------|-------|-------|
| `shadow-sm` | Default small | Cards at rest |
| `shadow-md` | Default medium | Cards on hover |
| `shadow-glow-cyan` | `0 0 20px rgba(6,182,212,0.35)` | Cyan glow effect |
| `shadow-glow-pink` | `0 0 20px rgba(236,72,153,0.35)` | Pink glow effect |
| `shadow-glow-brand` | Cyan + Pink combined | Premium elements |

---

## 7. Animations & Interactions

### Hover Effects
- **Cards:** `transition-all duration-200 hover:shadow-md`
- **Feature Cards:** `hover:-translate-y-2 hover:shadow-xl`
- **Stat Cards:** `hover:scale-[1.02] hover:shadow-glow-cyan/20`
- **Buttons:** `transition-all duration-200 active:scale-[0.98]`
- **CTA Buttons:** `hover:scale-105 hover:shadow-glow-pink`

### Keyframe Animations
- **pulse-glow:** 3s infinite — cyan to pink box-shadow pulse
- **shimmer:** 3s infinite — background shimmer effect

### Focus States
- **Default:** `focus-visible:ring-2 focus-visible:ring-ring`
- **Cyan glow:** `focus:ring-2 focus:ring-brand-cyan-500/50 focus:shadow-glow-cyan`

---

## 8. Component Patterns

### Cards
- Background: `bg-card` (respects dark mode)
- Border: `border` (uses `--border` token)
- Padding: `p-6` for content, `p-8` for landing page
- Hover: subtle shadow elevation

### Buttons
- **Primary:** Gradient cyan-to-pink with glow
- **Secondary:** `bg-secondary text-secondary-foreground`
- **Outline:** `border border-input bg-background`
- **Ghost:** No background, hover reveals accent
- **Destructive:** Red tones for dangerous actions

### Navigation
- **Active state:** `bg-brand-cyan-500/10 text-brand-cyan-400`
- **Inactive state:** `text-muted-foreground hover:bg-muted`
- **Transition:** `transition-colors`

### Status Badges
- Use semi-transparent backgrounds: `bg-[color]-500/10`
- Light text on dark: `text-[color]-400`
- Ring border: `ring-1 ring-inset ring-[color]-500/20`

---

## 9. Iconography

### Library
- **Lucide React** — 900+ consistent, minimal icons
- Size: `h-4 w-4` (small), `h-5 w-5` (default), `h-6 w-6` (large)
- Color: Inherit from parent text color or use brand colors

### Key Icons
| Feature | Icon |
|---------|------|
| Dashboard | `LayoutDashboard` |
| Gyms | `Building2` |
| QR Codes | `QrCode` |
| Members | `Users` |
| Analytics | `BarChart3` |
| Settings | `Settings` |
| Workouts | `Dumbbell` |
| Nutrition | `Heart` |

---

## 10. Do's and Don'ts

### Do
- Use semantic color tokens (`text-foreground`, `bg-card`, `border-border`)
- Maintain consistent spacing with Tailwind scale
- Use brand gradients for primary CTAs and hero elements
- Apply subtle hover animations for interactivity
- Keep text readable with sufficient contrast ratios

### Don't
- Hardcode gray/white colors — always use theme tokens
- Mix brand colors randomly — follow the gradient patterns
- Use more than 2 brand colors in a single element
- Add excessive animations that distract from content
- Use the logo smaller than 32px height
