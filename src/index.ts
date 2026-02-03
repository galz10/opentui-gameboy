import { CliRenderer } from '@opentui/core';
import { GameboyOptions } from './types';
import { initLogger, gameboyLog } from './utils/logger';
import { GameboyUI } from './ui/renderer';

// Re-export types and defaults for public API
export * from './types';

let _active = false;

/**
 * Check if the GameBoy emulator is currently active
 */
export function isGameboyActive(): boolean {
  return _active;
}

/**
 * Launch the GameBoy emulator with ROM selection
 *
 * @param renderer - The OpenTUI CliRenderer instance
 * @param options - Configuration options for the emulator
 */
export async function launchGameboy(renderer: CliRenderer, options: GameboyOptions): Promise<void> {
  initLogger(options.debug ?? false, options.logFile);
  gameboyLog('[GameBoy] launchGameboy called');

  const originalOnExit = options.onExit;
  const wrappedOptions: GameboyOptions = {
    ...options,
    onExit: () => {
      _active = false;
      originalOnExit();
    },
  };

  _active = true;
  const ui = new GameboyUI(renderer, wrappedOptions);
  await ui.showRomSelection();
}
