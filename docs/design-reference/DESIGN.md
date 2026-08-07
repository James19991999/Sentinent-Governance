---
name: Synthetic Integrity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#25005a'
  on-tertiary-container: '#9863ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built for the high-stakes world of enterprise AI, where trust is as critical as innovation. The brand personality is **authoritative, visionary, and protective**. It bridges the gap between traditional corporate stability and the frontier of machine learning.

The design style is **Corporate / Modern** with a **Futuristic** edge. It utilizes "Technical Minimalism"—a philosophy that prioritizes high-density data clarity while using atmospheric touches like subtle gradients and frosted glass to signify the "intelligence" layer of the software. The emotional response should be one of "calm capability"; users should feel that the AI is powerful but fully under their control.

## Colors

The palette is anchored in **Deep Slate (Primary)** to establish a foundation of security and institutional depth. **Teal (Secondary)** is used for primary actions and "human-in-the-loop" touchpoints, representing ethical innovation. **Violet (Tertiary)** is reserved for AI-generated insights, automated workflows, and "intelligent" states.

- **Surface Layers:** Use a range of cool grays (Slate 50 to 200) for background differentiation to avoid a purely flat appearance.
- **Gradients:** Use subtle linear gradients (Primary to Secondary at 135°) only for high-level data summaries or "Processing" states to evoke a sense of continuous motion and computing power.

## Typography

The typography strategy prioritizes precision. **Hanken Grotesk** provides a sharp, contemporary professional look for headers. **Inter** is the workhorse for body copy, chosen for its exceptional legibility in dense UI environments. **Geist** is introduced for labels and data points to provide a technical, "developer-friendly" aesthetic that reinforces the tool's AI-driven nature.

- **Scale:** Maintain a strict hierarchical scale. Use `label-sm` for metadata and category tags to keep the UI from feeling cluttered.
- **Contrast:** High-level headers should use the Primary color (#0F172A), while secondary body text should drop to Slate 600 to maintain a clear information architecture.

## Layout & Spacing

This design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The layout philosophy is "Information Density with Breathing Room." 

- **Grid:** Use a 24px gutter to ensure complex data tables and multi-column forms remain legible.
- **Rhythm:** All spacing must be a multiple of the 4px base unit. 
- **Adaptive Reflow:** On tablet, the sidebar collapses into a rail to prioritize the workspace. On mobile, all cards stack vertically, and horizontal scrolling is permitted only for data tables with a persistent "Key" column.

## Elevation & Depth

The design system uses **Tonal Layers** combined with **Ambient Shadows** to create a sense of organized complexity. Depth is used to separate the "Environment" from the "Workspace."

- **Level 0 (Background):** Neutral Slate 50. Flat.
- **Level 1 (Cards/Sidebar):** White surface. 1px stroke in Slate 200. No shadow.
- **Level 2 (Modals/Dropdowns):** White surface. Soft, extra-diffused shadow (Y: 8px, Blur: 24px, Opacity: 4%, Color: Primary).
- **AI Layers:** Elements driven by AI insights (e.g., suggested actions) use a 10% opacity Violet glow instead of a standard shadow to indicate their distinct nature.

## Shapes

The shape language is **Soft**. It avoids the playfulness of fully rounded corners in favor of a "precision-engineered" look.

- **Small Elements:** Buttons and inputs use a 4px (`0.25rem`) radius to maintain a crisp, professional edge.
- **Containers:** Large cards and dashboard sections use an 8px (`0.5rem`) radius.
- **Status Indicators:** Use 0px (sharp) or 100% (pill) only—no middle ground. Pills are for temporary states (chips), while sharp corners are for structural dividers.

## Components

- **Buttons:** Primary buttons use the Teal (#0D9488) fill with white text. Secondary buttons use a Slate 200 border. AI-action buttons use a subtle Violet gradient border.
- **Inputs:** Use a "Focus-Thick" state. When active, the border transitions from Slate 300 to Teal 600 with a 2px stroke.
- **Chips:** For status, use low-saturation backgrounds with high-saturation text (e.g., Success: Light Green bg, Dark Green text).
- **Cards:** Dashboard cards must include a "Header" area with a 1px bottom border. Content padding should be a consistent 24px.
- **Data Visualizations:** Use the Primary/Secondary/Tertiary palette. Avoid "Red/Green" for anything other than actual error/success states to prevent confusion with financial or performance data.
- **AI Tooltips:** Distinctive tooltip style with a Violet-tinted background and Geist Mono font for explaining "Why the AI made this decision."