# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**opentui-gameboy** is a TypeScript library that provides a plug-and-play GameBoy emulator component for the `@opentui/core` terminal UI framework. It uses the `serverboy` package for emulation and renders to the terminal using OpenTUI's rendering system.

## Commands

```bash
bun run check          # TypeScript type checking (tsc --noEmit)
bun run lint           # ESLint + Prettier checks
bun run test           # Run Bun test suite
bun run build          # Compile to dist/ and generate .d.ts files
bun run preflight      # Run lint → check → test → build (pre-release)
bun run dev:example    # Run example in examples/basic/index.ts
bun test path/to/file.test.ts  # Run a single test file
```

## Architecture

### Module Structure

- **`src/index.ts`** - Public API entry point exporting `launchGameboy()` and `isGameboyActive()`
- **`src/types.ts`** - All type definitions, constants (`GB_NATIVE_WIDTH`, `GB_TERM_HEIGHT`), and defaults
- **`src/emulator/engine.ts`** - `GameboyEngine` class wrapping serverboy emulator
- **`src/emulator/persistence.ts`** - Save/load logic for .sav files
- **`src/ui/renderer.ts`** - `GameboyUI` class managing rendering, input, and game loop
- **`src/ui/components.ts`** - UI helper components
- **`src/utils/color.ts`** - RGB to 4-shade grayscale conversion
- **`src/utils/logger.ts`** - Debug logging with file support

### Rendering Technique

The emulator uses a vertical half-block rendering technique:
- GameBoy native resolution: **160x144 pixels**
- Terminal resolution: **160x72 cells** (using `▀` half-block character)
- Each terminal cell displays 2 vertical pixels (foreground + background color)
- RGB output converted to 4-shade grayscale using luminance formula
- Minimum terminal size: **160x76** (72 for screen + 4 for UI)

### Serverboy Integration

```typescript
// @ts-expect-error - serverboy uses CommonJS export
import Serverboy from "serverboy";
```
The serverboy package is CommonJS and requires the ts-expect-error directive.

## Code Conventions

### Naming
- Variables/functions: `camelCase` (`gameboyScreen`, `launchGameboy`)
- Constants: `UPPER_CASE` (`GB_NATIVE_WIDTH`, `DEFAULT_THEME`)
- Types/interfaces: `PascalCase` (`GameboyTheme`, `GameboyUI`)
- Private/internal: underscore prefix (`_active`, `_isGameboyActive`)

### Imports
- Node.js built-ins use `node:` prefix: `import { join } from "node:path"`
- External packages first, then internal

### TypeScript
- Strict mode enabled
- Avoid `any` (enforced by ESLint, except in tests)
- Use `interface` for exported object shapes
- JSDoc comments for all exported members

### Style
- 2 spaces indentation
- Single quotes
- Semicolons required
- 100 character line width
- Trailing commas

## Dependencies

- **Peer:** `@opentui/core >= 0.1.75`
- **Runtime:** `serverboy ^0.0.7`
- Uses Bun-specific APIs (e.g., `Bun.file()`)

## Save File Structure

```
saveDirectory/
└── <GameName>/
    ├── slot0.sav       # Primary save slot
    └── latest.sav      # Auto-loaded on startup
```
