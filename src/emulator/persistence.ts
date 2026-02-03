import { join } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';
import { mkdirSync, existsSync } from 'node:fs';
import { gameboyLog } from '../utils/logger';
import { ServerboyInstance } from '../types';

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
  slot: number = 0,
): Promise<boolean> {
  try {
    const saveData = serverboy.getSaveData();
    if (!saveData?.length) {
      gameboyLog('[GameBoy] Save failed: No save data');
      return false;
    }

    const gameSaveDir = getGameSaveDir(saveDirectory, romName);
    mkdirSync(gameSaveDir, { recursive: true });

    const buffer = Buffer.from(saveData);
    await writeFile(join(gameSaveDir, `slot${slot}.sav`), buffer);
    await writeFile(join(gameSaveDir, 'latest.sav'), buffer);

    gameboyLog(`[GameBoy] Game saved to slot ${slot}`);
    return true;
  } catch (err) {
    gameboyLog('[GameBoy] Save error:', err);
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
  slot: number = 0,
): Promise<boolean> {
  try {
    const savePath = join(getGameSaveDir(saveDirectory, romName), `slot${slot}.sav`);
    if (!existsSync(savePath)) return false;

    const data = await readFile(savePath);
    serverboy.loadRom(romBuffer, Array.from(data));
    gameboyLog(`[GameBoy] Game loaded from slot ${slot}`);
    return true;
  } catch (err) {
    gameboyLog('[GameBoy] Load error:', err);
    return false;
  }
}

/**
 * Load latest save for auto-load
 */
export async function loadLatestSave(
  saveDirectory: string,
  romName: string,
): Promise<number[] | undefined> {
  try {
    const latestPath = join(getGameSaveDir(saveDirectory, romName), 'latest.sav');
    return existsSync(latestPath) ? Array.from(await readFile(latestPath)) : undefined;
  } catch (err) {
    gameboyLog('[GameBoy] Could not load latest save:', err);
    return undefined;
  }
}
