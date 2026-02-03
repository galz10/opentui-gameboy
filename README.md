# opentui-gameboy

A plug-and-play GameBoy emulator component for [@opentui/core](https://github.com/user/opentui).

## Installation

```bash
bun add opentui-gameboy
# or
npm install opentui-gameboy
```

## Usage

```typescript
import { createCliRenderer } from "@opentui/core";
import { launchGameboy, DEFAULT_THEME } from "opentui-gameboy";
import { join } from "node:path";
import { homedir } from "node:os";

const renderer = await createCliRenderer();

// Launch the GameBoy emulator
launchGameboy(renderer, {
  // Directory containing .gb and .gbc ROM files
  romDirectory: join(homedir(), ".myapp", "roms"),

  // Directory for save files (creates subdirs per game)
  saveDirectory: join(homedir(), ".myapp", "saves"),

  // Optional: log file for debugging
  logFile: join(homedir(), ".myapp", "gameboy.log"),

  // Theme colors for the UI
  theme: DEFAULT_THEME,

  // Enable debug logging
  debug: true,

  // Called when user exits the emulator (ESC x2)
  onExit: () => {
    console.log("GameBoy closed");
  },

  // Optional: called when user force exits (Ctrl+C x2)
  onForceExit: () => {
    renderer.destroy();
    process.exit(0);
  },
});

renderer.start();
```

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | D-Pad |
| Z | A Button |
| X | B Button |
| Enter | Start |
| Shift | Select |
| S | Save Game |
| L | Load Game |
| ESC x2 | Exit to menu |
| Ctrl+C x2 | Exit application |

## Features

- ROM selection UI with keyboard navigation
- Auto-save/load support (battery saves)
- Save to multiple slots
- Terminal size detection and warnings
- Customizable theme colors
- Debug logging

## Architecture

`opentui-gameboy` is built on a decoupled architecture separating emulation logic from terminal rendering.

### Emulation Engine
The core emulation is powered by [serverboy](https://www.npmjs.com/package/serverboy), a lightweight GameBoy core. The `GameboyEngine` class wraps the core to provide ROM loading, state management, and frame stepping.

### High-Density Rendering
To achieve the 160x144 resolution in a terminal, we use a vertical density technique:
- The terminal's foreground and background colors are mapped to two vertical GameBoy pixels using the half-block character (`▀`).
- This effectively doubles the vertical resolution, requiring only 72 terminal rows to display 144 pixels.
- RGB output is converted to a 4-shade grayscale palette using standard luminance weights.

## Theme Customization

```typescript
import { launchGameboy, GameboyTheme } from "opentui-gameboy";

const myTheme: GameboyTheme = {
  bg: "#1a1a2e",
  text: "#eaeaea",
  accent: "#00ff88",
  dim: "#666666",
  darkAccent: "#333355",
  surface: "#252540",
};

launchGameboy(renderer, {
  // ...
  theme: myTheme,
});
```

## Advanced Configuration

### Custom Keybindings

You can customize the save and load keybindings by passing a `Keybinding` object in the options:

```typescript
import { launchGameboy } from "opentui-gameboy";

launchGameboy(renderer, {
  // ...
  saveKeybinding: { key: "s", ctrl: true, shift: true }, // Ctrl+Shift+S
  loadKeybinding: { key: "l", ctrl: true, shift: true }, // Ctrl+Shift+L
});
```

### Debug Logging

Enable verbose logging to a file for troubleshooting:

```typescript
launchGameboy(renderer, {
  // ...
  debug: true,
  logFile: "./gameboy.log",
});
```

## Checking if GameBoy is Active

Use the `isGameboyActive()` function to check if the emulator is currently running:

```typescript
import { isGameboyActive } from "opentui-gameboy";

// In your key handler
if (isGameboyActive()) {
  // GameBoy is running, don't process other inputs
  return;
}
```

## Save File Structure

Saves are organized by game name:

```
~/.myapp/saves/
└── Pokemon Red/
    ├── slot0.sav      # Manual save slot
    └── latest.sav     # Auto-loaded on startup
```

## Troubleshooting

### Terminal Size
The emulator requires a minimum terminal size of **160x76**. If your terminal is too small, a warning will appear with instructions to zoom out.

### Color Support
Ensure your terminal emulator supports **TrueColor (24-bit)** or at least 256 colors. The UI and emulator use hex/RGB colors extensively.

### Input Lag
If you experience input lag, check if your terminal has a high latency or if `debug` mode is enabled, as heavy logging can impact performance.

## Demo

A complete example is available in the `examples/basic` directory. To run it:

1. Clone the repository
2. Install dependencies: `bun install`
3. Place ROMs in `examples/roms/`
4. Run the example: `bun run dev:example`

## Development Commands

- **Type Check:** `bun run check` (runs `tsc --noEmit`)
- **Lint:** `bun run lint` (runs `eslint` and `prettier` checks)
- **Test:** `bun run test` (runs `bun test`)
- **Build:** `bun run build` (builds with Bun and generates type declarations)
- **Preflight:** `bun run preflight` (runs lint, check, test, and build)

## Requirements

- Bun or Node.js
- @opentui/core >= 0.1.75
- ROM files (.gb, .gbc) - not included

## License

MIT
