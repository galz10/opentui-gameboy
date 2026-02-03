# GEMINI.md - opentui-gameboy

## Project Overview
`opentui-gameboy` is a plug-and-play GameBoy emulator component designed for use with the `@opentui/core` terminal framework. It provides a full-featured emulation experience directly within the terminal, including a ROM selection UI, battery save support, and customizable themes.

### Key Technologies
- **Runtime & Build:** [Bun](https://bun.sh/)
- **Terminal Framework:** [@opentui/core](https://github.com/user/opentui)
- **Emulation Engine:** [serverboy](https://www.npmjs.com/package/serverboy)
- **Language:** TypeScript

### Architecture
- **Entry Point:** `src/index.ts` exports `launchGameboy` and `isGameboyActive`.
- **Rendering:** Uses `FrameBufferRenderable` from `@opentui/core` to render GameBoy frames (160x144 pixels) mapped to terminal cells using half-block characters (`▀`).
- **Input:** Maps terminal keypresses (arrows, Z, X, Enter, Shift) to GameBoy buttons.
- **Persistence:** Manages `.sav` files in a structured directory format (`saves/<GameName>/slot0.sav`).

## Building and Running

### Development Commands
- **Type Check:** `bun run check` (runs `tsc --noEmit`)
- **Build:** `bun run build` (builds with Bun and generates type declarations)
- **Lint:** No explicit linting script found; follow existing TypeScript conventions.

### Usage in Projects
```typescript
import { createCliRenderer } from "@opentui/core";
import { launchGameboy, DEFAULT_THEME } from "opentui-gameboy";

const renderer = await createCliRenderer();
launchGameboy(renderer, {
  romDirectory: "./roms",
  saveDirectory: "./saves",
  theme: DEFAULT_THEME,
  onExit: () => process.exit(0)
});
renderer.start();
```

## Development Conventions

### Coding Style
- **Strict Typing:** Avoid `any` where possible (though `serverboy` types are currently suppressed with `@ts-ignore` due to CJS/ESM compatibility).
- **Asynchronous IO:** Uses `node:fs/promises` for file operations.
- **Component Design:** The emulator is encapsulated within the `launchGameboy` function, which manages its own UI lifecycle on the provided `renderer`.

### Rendering Details
- **Resolution:** Native GameBoy resolution is 160x144. In the terminal, this is compressed vertically using half-blocks, requiring a minimum terminal size of 160x72.
- **Grayscale:** RGB output from `serverboy` is converted to a 4-shade grayscale palette for terminal display.

### Error Handling
- Proactively checks terminal size and displays a "Terminal Too Small" warning if requirements are not met.
- Includes a `debug` mode and log file support for troubleshooting emulator state and file IO.

## Key Files
- `src/index.ts`: The entire implementation of the emulator component.
- `package.json`: Project configuration and dependencies.
- `tsconfig.json`: TypeScript compiler settings.
- `README.md`: End-user documentation and keybindings.
