# Agent Instructions for opentui-gameboy

This file provides guidance for AI agents working in this repository.

## Build Commands

```bash
bun run check          # TypeScript type checking (tsc --noEmit)
bun run lint           # ESLint + Prettier checks
bun run test           # Run all tests with Bun test runner
bun test path/to/file.test.ts   # Run a single test file
bun run build          # Compile to dist/ and generate .d.ts files
bun run preflight      # Run lint → check → test → build (pre-release)
bun run dev:example    # Run example: examples/basic/index.ts
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - never use `any` (enforced by ESLint, except in test files)
- Use `interface` for exported object shapes, `type` for unions/aliases
- JSDoc comments required for all exported functions and types
- Target: ES2022, Module: ESNext, ModuleResolution: bundler

### Formatting (Prettier)

- 2 spaces indentation
- Single quotes
- Semicolons required
- 100 character line width
- Trailing commas: all

### Naming Conventions

- Variables/functions: `camelCase` (`gameboyScreen`, `launchGameboy`)
- Constants: `UPPER_CASE` (`GB_NATIVE_WIDTH`, `DEFAULT_THEME`)
- Types/interfaces: `PascalCase` (`GameboyTheme`, `GameboyOptions`)
- Private/internal: underscore prefix (`_active`, `_isGameboyActive`)
- Classes: `PascalCase` (`GameboyUI`, `GameboyEngine`)

### Imports

- Node.js built-ins use `node:` prefix: `import { join } from "node:path"`
- External packages first, then internal relative imports
- Order: external → internal (parent dirs) → local (same/child dirs)

### Error Handling

- Use try-catch for async operations (file I/O, etc.)
- Log errors via `gameboyLog()` utility
- Return boolean success/failure for operations where appropriate
- For CommonJS imports, use `// @ts-expect-error` comment (see serverboy import)

## Architecture

### Directory Structure

- `src/index.ts` - Public API entry point
- `src/types.ts` - All type definitions, constants, and defaults
- `src/emulator/` - Emulation engine (engine.ts, persistence.ts)
- `src/ui/` - Terminal rendering and UI components (renderer.ts, components.ts)
- `src/utils/` - Shared utilities (color.ts, logger.ts)
- `examples/` - Usage examples and demo ROMs

### Key Patterns

- Rendering uses vertical half-block technique (160x72 terminal cells for 160x144 pixels)
- Serverboy emulator integration uses CommonJS with ts-expect-error
- Save files: `{saveDirectory}/{GameName}/{slot0.sav,latest.sav}`
- Debug logging available via `initLogger()` and `gameboyLog()`

## Testing

- Framework: Bun's native test runner (`bun:test`)
- Naming: `*.test.ts` alongside source files
- Aim for 100% coverage on src/ directory
- Use `mock.module()` for mocking dependencies
- `any` type allowed in test files per eslint config

## Dependencies

- **Peer:** `@opentui/core >= 0.1.75`
- **Runtime:** `serverboy ^0.0.7`
- **Platform:** Bun (uses Bun-specific APIs like `Bun.file()`)

## Before Submitting

Always run preflight before committing:

```bash
bun run preflight
```

This ensures lint, type check, tests, and build all pass.
