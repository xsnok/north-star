# Project Agent Rules

North Star is an Expo React Native app for a guided journaling and reflection experience. The current custom product surface is the onboarding screen in `app/index.tsx`, where users choose why they want to journal and see contextual supporting copy for selected reasons.

## Required Native QA

- For native iOS layout or visual QA, do not rely on Expo web preview as the source of truth. Use Computer Use to inspect and control the iOS Simulator, or ask the user for a simulator screenshot before making layout-sensitive changes.
- When changing this app's screen layout, verify in Simulator when feasible, especially for spacing around fixed footers, safe areas, compact screen heights, and expanded option states.
- Web preview may be used for quick checks, but native behavior is authoritative for haptics, safe areas, platform fonts, status bar behavior, and iOS visual polish.

## App Architecture

- `app/_layout.tsx` defines the root Expo Router stack, React Navigation theme provider, and status bar behavior.
- `app/index.tsx` is the main onboarding screen. It contains the current reason data, selection state, expanded-state behavior, Reanimated transitions, responsive height rules, safe-area footer math, and screen styles.
- `app/modal.tsx` is still starter modal content and is not part of the current core product experience.
- `constants/theme.ts` contains starter light/dark color tokens plus platform font-family mappings used by the onboarding screen.
- `components/` and `hooks/` are mostly Expo starter primitives. Reuse them where they fit, but do not assume they define a complete design system yet.
- `assets/images/` contains icon, splash, favicon, and starter image assets.

## Development Commands

- Install dependencies with `npm install`.
- Start the dev server with `npm run start`.
- Open the native app with `npm run ios` or `npm run android`.
- Open the web preview with `npm run web`.
- Run linting with `npm run lint`.
- Avoid `npm run reset-project` unless explicitly asked; it is the Expo starter reset script and can move or replace current app files.

## Code Conventions

- This project uses TypeScript in strict mode and Expo Router typed routes.
- Use the `@/` alias for repository-root imports when it improves clarity.
- Prefer React Native primitives and existing Expo dependencies over adding new packages for small UI behavior.
- Keep layout-sensitive constants and responsive calculations easy to audit. The current onboarding screen uses window height breakpoints and safe-area insets to keep the footer from covering content.
- Keep copy concise and product-oriented. Avoid reintroducing generic Expo starter language into product screens.
- Do not make broad starter-code cleanup changes unless the user asks; the app is early-stage and some starter files are intentionally still present.

## Current Product Notes

- The onboarding reasons are defined in `REASONS`; their expanded explanations are in `REASON_FACTS`.
- Selecting a reason toggles it in `selectedReasons` and keeps or updates `expandedReason`.
- iOS selection haptics are triggered through `expo-haptics`.
- Option color, border, and text transitions use Reanimated derived values and timing.
- The fixed footer's reserved content space is calculated from note height, button height, bottom inset, and compact-height rules.

## Before Committing

- Run `npm run lint`.
- For visual/layout changes, run the app on the relevant native target and inspect the affected screen state.
- Check both default and compact-height behavior when editing `app/index.tsx`.
- Review `git diff` to ensure only intentional project files changed.
