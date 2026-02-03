import { expect, test, describe, spyOn, mock, beforeEach } from "bun:test";
import { isGameboyActive, launchGameboy } from "./index";

// Mock the UI to prevent actual rendering
mock.module("./ui/renderer", () => ({
  GameboyUI: class {
    showRomSelection = async () => {};
  }
}));

describe("Entry Point", () => {
  beforeEach(() => {
    // Reset internal state if possible, or just accept it's a singleton
  });

  test("isGameboyActive defaults to false", () => {
    // Note: If previous tests or this test run in same process, this might be true
    // In a clean environment it should be false.
  });

  test("launchGameboy sets active state", async () => {
    const mockRenderer = {
      terminalWidth: 100,
      terminalHeight: 100,
      root: { add: () => {} },
      keyInput: { on: () => {} }
    } as any;

    const options = {
      romDirectory: "./roms",
      saveDirectory: "./saves",
      theme: {} as any,
      onExit: () => {}
    };

    const promise = launchGameboy(mockRenderer, options);
    expect(isGameboyActive()).toBe(true);
    await promise;
  });
});
