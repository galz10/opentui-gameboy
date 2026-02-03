import { CliRenderer, BoxRenderable, RGBA, TextRenderable, TextAttributes } from '@opentui/core';
import { GameboyTheme, Keybinding, GB_TERM_WIDTH, GB_MIN_TERM_HEIGHT } from '../types';

export function safeRemove(renderer: CliRenderer, id: string): void {
  try {
    renderer.root.remove(id);
  } catch {
    // Already removed
  }
}

export function formatKeybinding(binding: Keybinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push('Ctrl');
  if (binding.alt) parts.push('Alt');
  if (binding.shift) parts.push('Shift');
  parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : binding.key);
  return parts.join('+');
}

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

export function createWarning(
  renderer: CliRenderer,
  theme: GameboyTheme,
  currentWidth: number,
  currentHeight: number,
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

  const title = new TextRenderable(renderer, {
    id: 'gameboy-warning-title',
    content: 'Terminal Too Small',
    fg: RGBA.fromHex(theme.accent),
    attributes: TextAttributes.BOLD,
    marginBottom: 1,
  });

  const stats = new TextRenderable(renderer, {
    id: 'gameboy-warning-text',
    content: `Current: ${currentWidth}x${currentHeight} | Needed: ${GB_TERM_WIDTH}x${GB_MIN_TERM_HEIGHT}`,
    fg: RGBA.fromHex(theme.text),
    marginBottom: 2,
  });

  const instructions = new TextRenderable(renderer, {
    id: 'gameboy-warning-instruction',
    content: 'Please zoom OUT your terminal',
    fg: RGBA.fromHex(theme.accent),
    marginBottom: 1,
  });

  const shortcuts = new TextRenderable(renderer, {
    id: 'gameboy-warning-shortcut',
    content: 'Cmd + -  (Mac)   or   Ctrl + -  (Linux/Windows)',
    fg: RGBA.fromHex(theme.dim),
    marginBottom: 2,
  });

  const exit = new TextRenderable(renderer, {
    id: 'gameboy-warning-exit',
    content: 'Press ESC to go back',
    fg: RGBA.fromHex(theme.text),
  });

  warningContainer.add(title);
  warningContainer.add(stats);
  warningContainer.add(instructions);
  warningContainer.add(shortcuts);
  warningContainer.add(exit);

  return warningContainer;
}
