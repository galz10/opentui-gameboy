import { join } from "node:path";
import { writeFile, readFile } from "node:fs/promises";
import { mkdirSync, existsSync } from "node:fs";
import { gameboyLog } from "../utils/logger";
import { ServerboyInstance } from "../types";

/**
 * Get save directory for a specific game
 */
export function getGameSaveDir(saveDirectory: string, romName: string): string {
  return join(saveDirectory, romName);
}

/**
 * Save game state
 */
export async function saveGameState(
  serverboy: ServerboyInstance,
  saveDirectory: string,
  romName: string,
  slot: number = 0
): Promise<boolean> {
  try {
    const saveData = serverboy.getSaveData();
    if (!saveData || saveData.length === 0) {
      gameboyLog("[GameBoy] Save failed: No save data (game may not support battery saves)");
      return false;
    }

    gameboyLog("[GameBoy] Got save data, length:", saveData.length);

    const gameSaveDir = getGameSaveDir(saveDirectory, romName);
    mkdirSync(gameSaveDir, { recursive: true });

    const savePath = join(gameSaveDir, `slot${slot}.sav`);
    await writeFile(savePath, Buffer.from(saveData));

    const latestPath = join(gameSaveDir, "latest.sav");
    await writeFile(latestPath, Buffer.from(saveData));

    gameboyLog(`[GameBoy] Game saved to slot ${slot}: ${savePath}`);
    return true;
  } catch (err) {
    gameboyLog("[GameBoy] Save error:", err);
    return false;
  }
}

/**
 * Load game state
 */
export async function loadGameState(
  serverboy: ServerboyInstance,
  saveDirectory: string,
  romName: string,
  romBuffer: Buffer,
  slot: number = 0
): Promise<boolean> {
  try {
    const gameSaveDir = getGameSaveDir(saveDirectory, romName);
    const savePath = join(gameSaveDir, `slot${slot}.sav`);
    if (!existsSync(savePath)) {
      gameboyLog(`[GameBoy] No save found in slot ${slot}`);
      return false;
    }

    const data = await readFile(savePath);
    const saveData = Array.from(data);

    gameboyLog("[GameBoy] Loaded save data, length:", saveData.length);

    serverboy.loadRom(romBuffer, saveData);
    gameboyLog(`[GameBoy] ROM reloaded with save data from slot ${slot}: ${savePath}`);
    return true;
  } catch (err) {
    gameboyLog("[GameBoy] Load error:", err);
    return false;
  }
}

/**
 * Load latest save for auto-load
 */
export async function loadLatestSave(saveDirectory: string, romName: string): Promise<number[] | undefined> {
  try {
    const gameSaveDir = getGameSaveDir(saveDirectory, romName);
    const latestPath = join(gameSaveDir, "latest.sav");
    if (!existsSync(latestPath)) {
      return undefined;
    }

    const data = await readFile(latestPath);
    return Array.from(data);
  } catch (err) {
    gameboyLog("[GameBoy] Could not load latest save:", err);
    return undefined;
  }
}
