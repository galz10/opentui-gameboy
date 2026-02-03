# AGENTS.md - Agentic Coding Guidelines

## Project Overview

This is **opentui-gameboy**, a TypeScript library that provides a plug-and-play GameBoy emulator component for @opentui/core. It uses the `serverboy` package for emulation and renders to the terminal using OpenTUI's rendering system.

## Build/Lint/Test Commands

All commands use Bun (this is a Bun-native project):

```bash
# Type check without emitting
bun run check

# Build the project (compiles to dist/)
bun run build

# Run a single test file (when tests exist)
bun test path/to/test.ts

# Run all tests
bun test

# Install dependencies
bun install
```

**Note:** There are currently no test files in this project. When adding tests, use Bun's built-in test runner with the pattern `*.test.ts` or `*.spec.ts`.

## Code Style Guidelines

### TypeScript Configuration

- **Target:** ES2022 with ESNext modules
- **Strict mode:** Enabled (all strict checks on)
- **Module resolution:** Bundler
- **Declaration files:** Emitted to `./dist`

### Formatting

- **Indentation:** 2 spaces (no tabs)
- **Quotes:** Double quotes for strings
- **Semicolons:** Required at end of statements
- **Trailing commas:** Use in multi-line objects/arrays
- **Line endings:** LF

### Naming Conventions

- **Variables/functions:** camelCase (`gameboyScreen`, `launchGameboy`)
- **Constants:** UPPER_CASE with underscores (`GB_NATIVE_WIDTH`, `DEFAULT_THEME`)
- **Types/interfaces:** PascalCase (`GameboyTheme`, `Keybinding`)
- **Private/internal:** Prefix with underscore (`_isGameboyActive`)

### Imports

- Use ES modules (`import/export`)
- Node.js built-ins: Use `node:` prefix (e.g., `import { join } from "node:path"`)
- External packages: Standard import
- Order: External imports first, then internal

Example:
```typescript
import { CliRenderer, FrameBufferRenderable } from "@opentui/core";
import { join } from "node:path";
import { readdir } from "node:fs/promises";
// @ts-ignore - serverboy uses CommonJS export
import Serverboy from "serverboy";
```

### Types & Interfaces

- Use `interface` for object shapes that will be exported
- Use `type` for unions/complex types
- Explicit return types on exported functions
- Use JSDoc comments for all exported members

Example:
```typescript
/**
 * Theme configuration for the GameBoy emulator UI
 */
export interface GameboyTheme {
  /** Background color (hex) */
  bg: string;
  /** Text color (hex) */
  text: string;
}
```

### Error Handling

- Use try/catch for async operations
- Log errors via the internal `gameboyLog` function when available
- Return boolean success/failure for operations that can fail
- Use optional chaining and nullish coalescing where appropriate

Example:
```typescript
try {
  const data = await readFile(savePath);
  return Array.from(data);
} catch (err) {
  gameboyLog("[GameBoy] Load error:", err);
  return undefined;
}
```

### Comments

- JSDoc for all exported types, interfaces, functions, and constants
- Inline comments for complex logic
- Use `// @ts-ignore` with explanation when needed

### File Organization

- Source files in `src/`
- Compiled output in `dist/` (do not edit manually)
- Single entry point: `src/index.ts`
- No tests currently exist - add to `src/` or `tests/` directory

### Dependencies

- **Peer dependency:** @opentui/core >= 0.1.75
- **Runtime dependency:** serverboy ^0.0.7
- **Dev dependencies:** TypeScript 5.x, @types/bun

### Export Pattern

All public APIs are exported from `src/index.ts`:

```typescript
export { launchGameboy, isGameboyActive, DEFAULT_THEME, DEFAULT_SAVE_KEYBINDING, DEFAULT_LOAD_KEYBINDING };
export type { GameboyOptions, GameboyTheme, Keybinding };
```

## Important Notes

- This is a library package, not an application
- Uses Bun-specific APIs (e.g., `Bun.file()`)
- Must maintain compatibility with @opentui/core peer dependency
- ROM files (.gb, .gbc) are not included - users provide their own
