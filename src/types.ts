import { RGBA } from "@opentui/core";

export const GB_NATIVE_WIDTH = 160;
export const GB_NATIVE_HEIGHT = 144;

/**
 * Theme configuration for the GameBoy emulator UI
 */
export interface GameboyTheme {
  /** Background color (hex) */
  bg: string;
  /** Text color (hex) */
  text: string;
  /** Accent color for highlights (hex) */
  accent: string;
  /** Dim text color (hex) */
  dim: string;
  /** Dark accent for borders (hex) */
  darkAccent: string;
  /** Surface color for containers (hex) */
  surface: string;
}

/**
 * Keybinding configuration for save/load actions
 */
export interface Keybinding {
  /** Key name (e.g., 's', 'l', 'return', 'escape') */
  key: string;
  /** Whether Ctrl modifier is required */
  ctrl?: boolean;
  /** Whether Shift modifier is required */
  shift?: boolean;
  /** Whether Alt modifier is required */
  alt?: boolean;
}

/**
 * Configuration options for the GameBoy emulator
 */
export interface GameboyOptions {
  /** Directory containing ROM files (.gb, .gbc) */
  romDirectory: string;
  /** Directory for save files (will create subdirectories per game) */
  saveDirectory: string;
  /** Optional log file path (if not provided, logs go to console only) */
  logFile?: string;
  /** Theme colors for the UI */
  theme: GameboyTheme;
  /** Callback when exiting the emulator */
  onExit: () => void;
  /** Optional callback for Ctrl+C x2 to exit entire application */
  onForceExit?: () => void;
  /** Enable debug logging */
  debug?: boolean;
  /** Keybinding for saving game state (default: Ctrl+S) */
  saveKeybinding?: Keybinding;
  /** Keybinding for loading game state (default: Ctrl+L) */
  loadKeybinding?: Keybinding;
}

export interface RomFile {
  name: string;
  path: string;
}

/**
 * Interface for the serverboy emulator instance
 */
export interface ServerboyInstance {
  loadRom(rom: Buffer, saveData?: number[]): void;
  doFrame(): void;
  getScreen(): Uint8Array;
  pressKey(key: number): void;
  getSaveData(): number[];
}

/**
 * Default save keybinding (Ctrl+S)
 */
export const DEFAULT_SAVE_KEYBINDING: Keybinding = { key: "s", ctrl: true };

/**
 * Default load keybinding (Ctrl+L)
 */
export const DEFAULT_LOAD_KEYBINDING: Keybinding = { key: "l", ctrl: true };

/**
 * Default theme matching a dark terminal aesthetic
 */
export const DEFAULT_THEME: GameboyTheme = {
  bg: "#0d1117",
  text: "#c9d1d9",
  accent: "#58a6ff",
  dim: "#6e7681",
  darkAccent: "#30363d",
  surface: "#161b22",
};
