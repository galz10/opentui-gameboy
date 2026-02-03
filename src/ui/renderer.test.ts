import { expect, test, describe, mock, spyOn, beforeEach } from "bun:test";
import { GameboyUI } from "./renderer";

describe("GameboyUI", () => {
  let mockRenderer: any;
  let options: any;

  beforeEach(() => {
    mockRenderer = {
      root: {
        add: spyOn({ add: () => {} }, "add"),
        remove: spyOn({ remove: () => {} }, "remove")
      },
      keyInput: {
        on: spyOn({ on: () => {} }, "on"),
        off: spyOn({ off: () => {} }, "off")
      },
      requestRender: spyOn({ requestRender: () => {} }, "requestRender"),
      terminalWidth: 200,
      terminalHeight: 100,
      setFrameCallback: spyOn({ setFrameCallback: () => {} }, "setFrameCallback")
    };

    options = {
      romDirectory: "./roms",
      saveDirectory: "./saves",
      theme: {
        bg: "#000000",
        text: "#ffffff",
        accent: "#00ff00",
        dim: "#888888",
        darkAccent: "#222222",
        surface: "#111111"
      },
      onExit: () => {}
    };
  });

  test("constructor initializes correctly", () => {
    const ui = new GameboyUI(mockRenderer, options);
    expect(ui).toBeDefined();
  });

  test("can be instantiated", () => {
    const ui = new GameboyUI(mockRenderer, options);
    expect(ui instanceof GameboyUI).toBe(true);
  });
});
