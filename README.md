# North Star

North Star is an Expo React Native app for a guided journaling and self-reflection experience. The current product surface is an onboarding screen that asks why someone is interested in journaling, lets them choose one or more motivations, and expands the selected option with a short supporting note.

The app is early-stage, so the repository is still close to an Expo starter project. The main custom work lives in the home screen layout and interaction details.

## Current Experience

- Motivation-based onboarding for journaling goals such as mood, stress, sleep, and productivity.
- Multi-select reason buttons with animated selected states.
- Expanded contextual copy for the active selected reason.
- iOS haptic feedback on option selection.
- A fixed bottom note and continue button that account for safe-area insets and compact screen heights.

## Tech Stack

- Expo SDK 54
- React 19 and React Native 0.81
- Expo Router for file-based navigation
- React Native Reanimated for option transitions
- React Native Safe Area Context for native layout spacing
- TypeScript with strict mode enabled
- Expo ESLint configuration

## Project Structure

```text
app/
  _layout.tsx       Root Expo Router stack and navigation theme provider
  index.tsx         Main onboarding screen and interaction logic
  modal.tsx         Starter modal route kept for now

components/
  themed-*.tsx      Starter theme-aware text and view primitives
  ui/               Starter reusable UI helpers
  *.tsx             Additional starter Expo components

constants/
  theme.ts          Light/dark color tokens and platform font families

hooks/
  use-*.ts          Starter color scheme and themed color hooks

assets/images/      App icon, splash, favicon, and starter image assets
scripts/            Utility scripts, including the Expo reset helper
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm run start
```

Open on a platform:

```bash
npm run ios
npm run android
npm run web
```

The iOS simulator is the preferred source of truth for native layout work. The web preview is useful for quick iteration, but it should not be treated as final visual QA for iOS safe areas, fixed footers, compact heights, or native font behavior.

## Development

Run linting before committing:

```bash
npm run lint
```

Important implementation notes:

- Routes are defined by files in `app/`; `app/index.tsx` is the current main screen.
- Imports can use the `@/` alias for repository-root paths.
- The onboarding screen currently keeps its reason data, animation constants, state, and styles colocated in `app/index.tsx`.
- Native interactions include `expo-haptics`, `react-native-reanimated`, and `react-native-safe-area-context`; test those on the native target when changing them.
- `npm run reset-project` is the default Expo starter reset script. Do not run it unless you intentionally want to archive the current app screen and return to a blank starter layout.

## Product Direction

North Star should feel calm, focused, and useful rather than like a generic Expo demo. When adding product surfaces, keep the experience oriented around helping people reflect, clarify what matters, and build a sustainable journaling habit.

Design priorities:

- Respect small mobile screens and safe areas.
- Keep primary actions obvious and reachable.
- Prefer concise, supportive copy over instructional text.
- Preserve smooth, low-friction interactions.
- Verify layout-sensitive changes on iOS when feasible.
