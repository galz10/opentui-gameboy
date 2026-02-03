import { expect, test, describe, mock } from "bun:test";
import { getGameSaveDir, saveGameState, loadGameState, loadLatestSave } from "./persistence";
import { join } from "node:path";

// Simplify mocks for this file
mock.module("node:fs", () => ({
  mkdirSync: () => {},
  existsSync: (path: string) => path.includes("exists")
}));

mock.module("node:fs/promises", () => ({
  writeFile: async () => {},
  readFile: async (path: string) => {
    if (path.includes("exists")) return Buffer.from([1, 2, 3]);
    throw new Error("File not found");
  }
}));

describe("Persistence", () => {
  const saveDir = "/tmp/saves";
  const romName = "Pokemon Red";

  test("getGameSaveDir joins paths correctly", () => {
    expect(getGameSaveDir(saveDir, romName)).toBe(join(saveDir, romName));
  });

  describe("saveGameState", () => {
    test("returns true on success", async () => {
      const mockServerboy = {
        getSaveData: () => new Uint8Array([1, 2, 3])
      } as any;

      const result = await saveGameState(mockServerboy, saveDir, romName);
      expect(result).toBe(true);
    });

    test("returns false when no save data", async () => {
      const mockServerboy = {
        getSaveData: () => new Uint8Array([])
      } as any;

      const result = await saveGameState(mockServerboy, saveDir, romName);
      expect(result).toBe(false);
    });
  });

  describe("loadGameState", () => {
    test("returns true when file exists", async () => {
      const mockServerboy = {
        loadRom: () => {}
      } as any;

      const result = await loadGameState(mockServerboy, saveDir, "exists-rom", Buffer.from([]));
      expect(result).toBe(true);
    });

    test("returns false when file does not exist", async () => {
      const mockServerboy = {
        loadRom: () => {}
      } as any;

      const result = await loadGameState(mockServerboy, saveDir, "missing-rom", Buffer.from([]));
      expect(result).toBe(false);
    });
  });

  describe("loadLatestSave", () => {
    test("returns data when file exists", async () => {
      const result = await loadLatestSave(saveDir, "exists-rom");
      expect(result).toEqual([1, 2, 3]);
    });

    test("returns undefined when file missing", async () => {
      const result = await loadLatestSave(saveDir, "missing-rom");
      expect(result).toBeUndefined();
    });
  });
});
