import { CliRenderer, BoxRenderable, RGBA, TextRenderable, TextAttributes } from '@opentui/core';
import { GameboyTheme, Keybinding } from '../types';

/**
 * Safely remove a renderable from the root container
 */
export function safeRemove(renderer: CliRenderer, id: string): void {
  try {
    renderer.root.remove(id);
  } catch {
    // Ignore if already removed or doesn't exist
  }
}

/**
 * Format a keybinding for display in help text
 */
export function formatKeybinding(binding: Keybinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push('Ctrl');
  if (binding.alt) parts.push('Alt');
  if (binding.shift) parts.push('Shift');
  parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : binding.key);
  return parts.join('+');
}

/**
 * Create a full-screen black background overlay
 */
export function createBackground(renderer: CliRenderer): BoxRenderable {
  return new BoxRenderable(renderer, {
    id: 'gameboy-background',
    width: renderer.terminalWidth,
    height: renderer.terminalHeight,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 250,
    backgroundColor: RGBA.fromInts(0, 0, 0, 255),
  });
}

/**
 * Create a full-screen terminal-too-small warning overlay
 */
export function createWarning(
  renderer: CliRenderer,
  theme: GameboyTheme,
  currentWidth: number,
  currentHeight: number,
  neededWidth: number,
  neededHeight: number,
): BoxRenderable {
  const warningContainer = new BoxRenderable(renderer, {
    id: 'gameboy-warning',
    width: renderer.terminalWidth,
    height: renderer.terminalHeight,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1002,
    backgroundColor: RGBA.fromHex(theme.bg),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  });

  const warningTitle = new TextRenderable(renderer, {
    id: 'gameboy-warning-title',
    content: 'Terminal Too Small',
    fg: RGBA.fromHex(theme.accent),
    attributes: TextAttributes.BOLD,
    marginBottom: 1,
  });

  const warningText = new TextRenderable(renderer, {
    id: 'gameboy-warning-text',
    content: `Current: ${currentWidth}x${currentHeight} | Needed: ${neededWidth}x${neededHeight}`,
    fg: RGBA.fromHex(theme.text),
    marginBottom: 2,
  });

  const instructionText = new TextRenderable(renderer, {
    id: 'gameboy-warning-instruction',
    content: 'Please zoom OUT your terminal',
    fg: RGBA.fromHex(theme.accent),
    marginBottom: 1,
  });

  const shortcutText = new TextRenderable(renderer, {
    id: 'gameboy-warning-shortcut',
    content: 'Cmd + -  (Mac)   or   Ctrl + -  (Linux/Windows)',
    fg: RGBA.fromHex(theme.dim),
    marginBottom: 2,
  });

  const exitTextWarning = new TextRenderable(renderer, {
    id: 'gameboy-warning-exit',
    content: 'Press ESC to go back',
    fg: RGBA.fromHex(theme.text),
  });

  warningContainer.add(warningTitle);
  warningContainer.add(warningText);
  warningContainer.add(instructionText);
  warningContainer.add(shortcutText);
  warningContainer.add(exitTextWarning);

  return warningContainer;
}
