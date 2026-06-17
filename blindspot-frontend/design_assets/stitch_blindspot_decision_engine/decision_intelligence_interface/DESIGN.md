---
name: Decision Intelligence Interface
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf2'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5efff'
  surface-container-high: '#dbe9ff'
  surface-container-highest: '#d4e4fa'
  on-surface: '#0d1c2d'
  on-surface-variant: '#3e4947'
  inverse-surface: '#233143'
  inverse-on-surface: '#e9f1ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#a6002f'
  on-tertiary: '#ffffff'
  tertiary-container: '#d2093f'
  on-tertiary-container: '#ffe4e4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b6'
  on-tertiary-fixed: '#40000c'
  on-tertiary-fixed-variant: '#920028'
  background: '#f8f9ff'
  on-background: '#0d1c2d'
  surface-variant: '#d4e4fa'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  metadata:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  metric-label:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system establishes a high-trust, high-clarity environment for "BlindSpot," a decision intelligence application. The aesthetic prioritizes **Modern Corporate** precision with a **Minimalist** ethos, ensuring that complex data remains the focal point without unnecessary visual noise.

The UI evokes an "Empirical Growth" sentiment—combining the warmth of a welcoming educational tool with the cold, hard rigor of an economic auditing engine. It rejects speculation in favor of quantified projections. Every pixel is dedicated to reducing cognitive load, using generous white space and a structured hierarchy to guide students and professionals through data-backed stress-testing.

## Colors

The palette is anchored in stability and clarity.
- **Surface Strategy:** The application utilizes a layered white-on-off-white approach (#F8FAFC base with #FFFFFF cards) to create depth without relying on shadows.
- **Action & Growth:** Vibrant Teal Green (#0F766E) is reserved for primary actions, success states, and positive market projections.
- **Information Hierarchy:** Deep Charcoal Ink (#1E293B) provides maximum legibility for headings, while Soft Cool Gray (#94A3B8) handles secondary data and metadata.
- **Risk Indicators:** Clean Coral Red (#E11D48) is used exclusively for deficits, gaps, and stress-test failures, ensuring critical warnings are immediate but professional.

## Typography

The typography system balances authoritative headers with highly readable body text. 
- **Headings:** Plus Jakarta Sans provides a modern, geometric foundation for all structural labels and massive metrics. Use Bold (700) for displays and Semi-Bold (600) for section titles.
- **Body & Inputs:** Inter (serving as the available alternative for Satoshi) is used for all conversational UI and data inputs. It is set at a comfortable 16px with a 150% line height to ensure clarity during long-form analysis.
- **Metadata:** Smaller annotations use Inter Medium at 12px to maintain legibility in dense data tables or micro-notes.

## Layout & Spacing

The layout utilizes a **Fixed Grid** on desktop (12 columns) and a **Fluid Grid** on mobile (4 columns). 
- **Alignment:** Content is centered with a 1280px max-width container. 
- **Rhythm:** An 8px base grid dictates all internal spacing. 
- **Responsiveness:** Margins expand from 16px on mobile to 32px on desktop to allow the "Professional" aesthetic to breathe. Use "stack-lg" (32px) to separate distinct logic blocks and "stack-sm" (8px) for related input-label pairs.

## Elevation & Depth

To avoid visual noise, this system minimizes the use of heavy shadows. 
- **Tonal Layering:** Depth is primarily achieved through color. The #F8FAFC background acts as the canvas, while #FFFFFF cards sit "above" it.
- **Outlines:** All containers and interactive inputs must use a 1px solid border in Light Slate Gray (#E2E8F0). 
- **Active State Elevation:** Only primary buttons and active modal overlays may use a very soft, diffused ambient shadow (0px 4px 20px rgba(30, 41, 59, 0.05)) to indicate focus.

## Shapes

The design system employs a **Rounded** (0.5rem) corner strategy. 
- **Standard UI:** Buttons, input fields, and small cards use the 0.5rem (8px) base radius.
- **Large Containers:** Dashboard widgets and main content areas scale to `rounded-lg` (16px) to appear more welcoming and "soft-professional."
- **Growth Indicators:** Progress bars and status chips use the `rounded-xl` (24px) setting for a pill-shaped appearance, differentiating them from structural containers.

## Components

- **Primary Buttons:** Solid Vibrant Teal Green (#0F766E) with white text. No gradients.
- **Input Fields:** Pure white background, #E2E8F0 border. On focus, the border shifts to Teal Green.
- **Data Cards:** White background, 1px #E2E8F0 border, 16px padding. Titles are Deep Charcoal Ink (#1E293B).
- **Status Chips:** Use a light tint of the status color (e.g., light red for risk) with high-contrast bold text inside.
- **Decision Matrices:** Use structured tables with Soft Cool Gray (#94A3B8) dividers and bold headers. Use "Growth Indicators" (Teal) and "Deficit Indicators" (Coral) for cell backgrounds to highlight quantified projections.
- **Projections/Metrics:** Large numerical displays should be Plus Jakarta Sans Bold, using #1E293B for neutral totals and #0F766E for positive gains.