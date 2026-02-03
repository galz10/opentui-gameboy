import { expect, test, describe, spyOn } from 'bun:test';
import { formatKeybinding, safeRemove } from './components';
import { Keybinding } from '../types';

describe('UI Components', () => {
  describe('formatKeybinding', () => {
    test('formats single keys', () => {
      const binding: Keybinding = { key: 'a' };
      expect(formatKeybinding(binding)).toBe('A');
    });

    test('formats multi-char keys', () => {
      const binding: Keybinding = { key: 'enter' };
      expect(formatKeybinding(binding)).toBe('enter');
    });

    test('formats with Ctrl', () => {
      const binding: Keybinding = { key: 's', ctrl: true };
      expect(formatKeybinding(binding)).toBe('Ctrl+S');
    });

    test('formats with Shift and Alt', () => {
      const binding: Keybinding = { key: 'l', shift: true, alt: true };
      expect(formatKeybinding(binding)).toBe('Alt+Shift+L');
    });
  });

  describe('safeRemove', () => {
    test('calls renderer.root.remove with correct id', () => {
      const mockRemove = spyOn({ remove: () => {} }, 'remove');
      const mockRenderer = {
        root: {
          remove: mockRemove as any,
        },
      } as any;

      safeRemove(mockRenderer, 'test-id');
      expect(mockRemove).toHaveBeenCalledWith('test-id');
    });

    test('does not throw when remove fails', () => {
      const mockRenderer = {
        root: {
          remove: () => {
            throw new Error('Not found');
          },
        },
      } as any;

      expect(() => safeRemove(mockRenderer, 'test-id')).not.toThrow();
    });
  });
});
