// @ts-ignore - serverboy uses CommonJS export
import Serverboy from "serverboy";
import { GB_NATIVE_WIDTH, GB_NATIVE_HEIGHT, ServerboyInstance } from "../types";
import { gameboyLog } from "../utils/logger";

export class GameboyEngine {
  public serverboy: ServerboyInstance;
  private _active: boolean = false;

  constructor() {
    try {
      this.serverboy = new Serverboy();
      gameboyLog("[GameBoy] Serverboy instance created");
    } catch (err) {
      gameboyLog("[GameBoy] ERROR creating serverboy instance:", err);
      throw err;
    }
  }

  public get isActive(): boolean {
    return this._active;
  }

  public set active(value: boolean) {
    this._active = value;
  }

  public loadRom(romBuffer: Buffer, saveData?: number[]) {
    if (saveData) {
      this.serverboy.loadRom(romBuffer, saveData);
    } else {
      this.serverboy.loadRom(romBuffer);
    }
  }

  public doFrame() {
    this.serverboy.doFrame();
  }

  public getScreen() {
    return this.serverboy.getScreen();
  }

  public pressKey(key: number) {
    this.serverboy.pressKey(key);
  }

  public static get KEYMAP() {
    return Serverboy.KEYMAP;
  }
}
