# VYNK — Unified Design System & UX Standards

**Version:** 2.0 (Phase D Launch-Ready)  
**Status:** COMPLETE & VERIFIED  

---

## 1. Design Philosophy

VYNK is designed for university student engineers, designers, researchers, and campus builders. The visual language balances high-tech precision with warm, tactile feedback.

### Key Principles
1. **Crisp Hierarchy Over Neon Overload:** Heavy neon glows and blurry glassmorphism have been replaced with sharp 1px borders, purposeful elevation levels, and high-contrast readability.
2. **True Dual-Theme Parity:** Both Dark mode and Light mode are first-class experiences with semantic tokens ensuring zero white-on-white or low-contrast text.
3. **Tactile Interaction:** Micro-interactions (toggles, tabs, hover lifts, badges) provide immediate visual feedback.
4. **Performance by Default:** Monolithic bundles are eliminated via route-level code splitting (`React.lazy` and `Suspense`), ensuring fast initial page loads even on mobile campus Wi-Fi.

---

## 2. Typography Hierarchy

| Role | Font Family | Weights | Application |
|---|---|---|---|
| **Headings & Display** | `Syne` | 600 (SemiBold), 700 (Bold), 800 (ExtraBold) | Page titles, hero banners, voyage titles, section headers |
| **Body & Interface** | `Plus Jakarta Sans` | 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold) | Paragraphs, navigation items, card content, form controls, buttons |
| **Code & Numbers** | `JetBrains Mono` | 400 (Regular), 500 (Medium), 600 (SemiBold) | XP counts, timestamps, badges, telemetry, code snippets, hashes |

---

## 3. Color Palette & Semantic Design Tokens

### Dark Canvas (Primary Student Mode)
- **Canvas / Background:** `#0A0A0F` — Deep cosmic charcoal base.
- **Surface / Cards:** `#131318` — First layer elevation.
- **Elevated / Panels:** `#181822` — Modals, popovers, active controls.
- **Floating / Hover:** `#20202C` — Dropdowns and hover highlights.
- **Borders / Separators:** `#232330` (Subtle 1px boundary).
- **Text Primary:** `#F4F4F6` (High contrast, zero glare).
- **Text Muted:** `#8B8B9E` (Accessible secondary information).

### Light Canvas (Daylight / Campus Library Mode)
- **Canvas / Background:** `#F8F9FC` — Soft architectural cool-grey.
- **Surface / Cards:** `#FFFFFF` — Pure white card surfaces.
- **Elevated / Panels:** `#F1F3F9` — Input backgrounds, modal containers.
- **Borders / Separators:** `#E2E5EE` — Crisp, clean delineation.
- **Text Primary:** `#0F111A` — High-contrast deep slate text.
- **Text Muted:** `#656B82` — Crisp accessible secondary text.

### Brand Accents
- **Primary (Violet):** `#7C5CFF` — Action buttons, active navigation, identity badges.
- **Secondary (Cyber Mint):** `#10E599` — Success states, connected badges, accepted invitations.
- **Highlight (Coral Rose):** `#FF5376` — Streak markers, high priority voyages, alerts.
- **Accent (Amber Gold):** `#F59E0B` — XP points, gamification trophies, ranking badges.

---

## 4. Reusable Component Primitives

The design system standardizes all UI controls under `apps/web/src/components/`:

1. **`VynkButton` / `Button`:** Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) and sizes (`xs`, `sm`, `md`, `lg`) with built-in loading spinners and icon slots.
2. **`Input` / `SearchInput`:** Theme-aware form inputs with custom placeholder styling, focus rings, and high contrast.
3. **`Tabs` (`components/ui/Tabs.tsx`):** Segmented pill and underline tab navigators with active indicator and badge count support.
4. **`Switch` (`components/ui/Switch.tsx`):** Smooth accessible toggles for settings and preferences.
5. **`Toast` (`components/ui/Toast.tsx`):** Non-blocking bottom-right notification toasts (`success`, `error`, `info`).
6. **`Avatar` / `AvatarGroup`:** Circular student avatars with online status indicator, fallback initials, and size variants.
7. **`Pill` / `SkillBadge` / `Badge`:** Chip components with proficiency indicators (Beginner, Intermediate, Advanced, Expert).
8. **`VynkCard` / `Card`:** Standardized card container with subtle borders and hover lifts.
9. **`Modal` / `AvatarUploadModal`:** Centered backdrop modals with Esc-key handling and focus trap.
10. **`Skeleton`:** Animated pulse placeholders for loading feeds and network graphs.
11. **`EmptyState`:** Friendly zero-data screens with custom iconography and primary action buttons.
12. **`ErrorState` / `VynkErrorBoundary`:** Graceful error recovery with retry trigger.

---

## 5. Resilient Profile Navigation (`getProfileUrl`)

To prevent runtime 404 or blank-screen errors when students navigate between discovery cards, feed authors, and chat headers:
- All navigation URLs are created via the canonical `getProfileUrl(user)` helper.
- The backend `userRepository.findByUsername` now supports:
  1. Exact username match (`asmitha`).
  2. Case-insensitive username match (`Ash` -> `ash`).
  3. User ID lookup (`usr-...`).
- Blank profile routes fallback seamlessly to the authenticated caller's own profile.

---

## 6. Route-Level Code Splitting & Performance

Page bundles are split into lazy chunks using `React.lazy()` and `Suspense`:

| Chunk Asset | Gzipped Size | Description |
|---|---|---|
| `HomePage-*.js` | 6.37 kB | Campus social feed |
| `NetworkPage-*.js` | 10.46 kB | 3D People Sphere & Student Discovery |
| `VoyagesPage-*.js` | 10.92 kB | Project voyage catalog |
| `VoyageDetailsPage-*.js` | 6.37 kB | Project workspace & task board |
| `MessagesPage-*.js` | 4.29 kB | Direct authenticated messaging |
| `PulsePage-*.js` | 8.79 kB | Admin telemetry and database explorer |
| `ProfilePage-*.js` | 7.33 kB | Student portfolio and bio |
| `AuthPage-*.js` | 6.30 kB | Login & registration wizard |
| `index-*.js` (Shared Runtime) | 173.64 kB | React, React Router, Lucide, Zustand |
