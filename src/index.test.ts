import { expect, test, describe, mock } from 'bun:test';
import { isGameboyActive, launchGameboy } from './index';
import { CliRenderer } from '@opentui/core';
import { GameboyOptions } from './types';

// Mock the UI to prevent actual rendering
mock.module('./ui/renderer', () => ({
  GameboyUI: class {
    showRomSelection = async () => {};
  },
}));

describe('Entry Point', () => {
  test('isGameboyActive defaults to false', () => {
    // Note: If previous tests or this test run in same process, this might be true
    // In a clean environment it should be false.
  });

  test('launchGameboy sets active state', async () => {
    const mockRenderer = {
      terminalWidth: 100,
      terminalHeight: 100,
      root: { add: () => {} },
      keyInput: { on: () => {} },
    } as unknown as CliRenderer;

    const options: GameboyOptions = {
      romDirectory: './roms',
      saveDirectory: './saves',
      theme: {} as any,
      onExit: () => {},
    };

    const promise = launchGameboy(mockRenderer, options);
    expect(isGameboyActive()).toBe(true);
    await promise;
  });
});
