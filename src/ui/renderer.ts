import {
  CliRenderer,
  BoxRenderable,
  RGBA,
  TextRenderable,
  TextAttributes,
  FrameBufferRenderable,
  KeyEvent,
} from "@opentui/core";
import { join } from "node:path";
import { readdir } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { 
  GameboyTheme, 
  GameboyOptions, 
  RomFile, 
  GB_NATIVE_WIDTH, 
  GB_NATIVE_HEIGHT,
  DEFAULT_SAVE_KEYBINDING,
  DEFAULT_LOAD_KEYBINDING
} from "../types";
import { gameboyLog, closeLogger } from "../utils/logger";
import { safeRemove, createBackground, createWarning, formatKeybinding } from "./components";
import { GameboyEngine } from "../emulator/engine";
import { 
  loadLatestSave, 
  saveGameState, 
  loadGameState 
} from "../emulator/persistence";
import { toGameBoyShade } from "../utils/color";

export class GameboyUI {
  private renderer: CliRenderer;
  private options: GameboyOptions;
  private engine?: GameboyEngine;
  private isRunning: boolean = false;
  private gameboyScreen?: FrameBufferRenderable;

  constructor(renderer: CliRenderer, options: GameboyOptions) {
    this.renderer = renderer;
    this.options = options;
  }

  public async showRomSelection(): Promise<void> {
    const { romDirectory, theme, onExit } = this.options;
    
    const backgroundOverlay = createBackground(this.renderer);
    this.renderer.root.add(backgroundOverlay);

    const container = new BoxRenderable(this.renderer, {
      id: "gameboy-container",
      width: "100%",
      height: "100%",
      position: "absolute",
      left: 0,
      top: 0,
      zIndex: 1000,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      shouldFill: false,
    });
    this.renderer.root.add(container);

    gameboyLog("[GameBoy] Loading ROMs from:", romDirectory);
    let roms: RomFile[] = [];
    try {
      mkdirSync(romDirectory, { recursive: true });
      const files = await readdir(romDirectory);
      roms = files
        .filter(f => f.endsWith(".gb") || f.endsWith(".gbc"))
        .map(f => ({ name: f.replace(/\.(gb|gbc)$/, ""), path: join(romDirectory, f) }));
    } catch (e) {
      gameboyLog("[GameBoy] Error loading ROMs:", e);
    }

    if (roms.length === 0) {
      this.showNoRoms(container);
      return;
    }

    let selectedIndex = 0;
    const titleText = new TextRenderable(this.renderer, {
      id: "gameboy-title",
      content: "Select a Game",
      fg: RGBA.fromHex(theme.accent),
      attributes: TextAttributes.BOLD,
      marginBottom: 2,
    });
    container.add(titleText);

    const listContainer = new BoxRenderable(this.renderer, {
      id: "gameboy-list",
      flexDirection: "column",
      border: true,
      borderColor: RGBA.fromHex(theme.darkAccent),
      padding: 1,
      minWidth: 40,
    });
    container.add(listContainer);

    const romItemBoxes: BoxRenderable[] = [];
    const romItemTexts: TextRenderable[] = [];
    roms.forEach((rom, i) => {
      const itemBox = new BoxRenderable(this.renderer, {
        id: `gameboy-rom-box-${i}`,
        backgroundColor: i === selectedIndex ? RGBA.fromHex(theme.accent) : undefined,
        paddingLeft: 1,
        paddingRight: 1,
      });
      const itemText = new TextRenderable(this.renderer, {
        id: `gameboy-rom-${i}`,
        content: rom.name,
        fg: i === selectedIndex ? RGBA.fromHex(theme.bg) : RGBA.fromHex(theme.text),
      });
      itemBox.add(itemText);
      romItemBoxes.push(itemBox);
      romItemTexts.push(itemText);
      listContainer.add(itemBox);
    });

    const selectionHelpText = new TextRenderable(this.renderer, {
      id: "gameboy-select-help",
      content: "↑↓: Navigate | ENTER: Play | ESC: Back",
      fg: RGBA.fromHex(theme.dim),
      marginTop: 2,
    });
    container.add(selectionHelpText);

    const updateSelection = () => {
      romItemBoxes.forEach((box, i) => {
        box.backgroundColor = i === selectedIndex ? RGBA.fromHex(theme.accent) : undefined;
        romItemTexts[i].fg = i === selectedIndex ? RGBA.fromHex(theme.bg) : RGBA.fromHex(theme.text);
      });
      this.renderer.requestRender();
    };

    const selectionHandler = (key: KeyEvent) => {
      if (key.name === "escape") {
        this.renderer.keyInput.off("keypress", selectionHandler);
        this.renderer.root.remove(container.id);
        this.renderer.root.remove("gameboy-background");
        onExit();
        return;
      }

      if (key.name === "up") {
        selectedIndex = (selectedIndex - 1 + roms.length) % roms.length;
        updateSelection();
      } else if (key.name === "down") {
        selectedIndex = (selectedIndex + 1) % roms.length;
        updateSelection();
      } else if (key.name === "return" || key.name === "enter") {
        this.renderer.keyInput.off("keypress", selectionHandler);
        this.startGame(roms[selectedIndex], container);
      }
    };

    this.renderer.keyInput.on("keypress", selectionHandler);
    this.renderer.requestRender();
  }

  private showNoRoms(container: BoxRenderable) {
    const { theme, onExit, romDirectory } = this.options;
    const noRomsText = new TextRenderable(this.renderer, {
      id: "gameboy-no-roms",
      content: `No ROMs found in ${romDirectory}`,
      fg: RGBA.fromHex(theme.dim),
      attributes: TextAttributes.BOLD,
    });
    container.add(noRomsText);
    
    const exitText = new TextRenderable(this.renderer, {
      id: "gameboy-exit",
      content: "Press ESC to go back",
      fg: RGBA.fromHex(theme.accent),
      marginTop: 2,
    });
    container.add(exitText);

    const exitHandler = (key: KeyEvent) => {
      if (key.name === "escape") {
        this.renderer.keyInput.off("keypress", exitHandler);
        this.renderer.root.remove(container.id);
        this.renderer.root.remove("gameboy-background");
        onExit();
      }
    };
    this.renderer.keyInput.on("keypress", exitHandler);
    this.renderer.requestRender();
  }

  private async startGame(rom: RomFile, container: BoxRenderable) {
    const { theme, saveDirectory, onExit, onForceExit } = this.options;
    const loadingText = new TextRenderable(this.renderer, {
      id: "gameboy-loading",
      content: `Loading ${rom.name}...`,
      fg: RGBA.fromHex(theme.accent),
    });
    container.add(loadingText);
    this.renderer.requestRender();

    try {
      const romData = await Bun.file(rom.path).arrayBuffer();
      const romBuffer = Buffer.from(romData);
      
      this.engine = new GameboyEngine();
      const initialSaveData = await loadLatestSave(saveDirectory, rom.name);
      this.engine.loadRom(romBuffer, initialSaveData);

      container.remove(loadingText.id);
      container.visible = false;
      this.renderer.root.remove(container.id);

      const GB_SCREEN_WIDTH = 160;
      const GB_SCREEN_HEIGHT = 72;

      // Check terminal size
      if (this.renderer.terminalWidth < GB_SCREEN_WIDTH || this.renderer.terminalHeight < GB_SCREEN_HEIGHT + 4) {
        this.handleSmallTerminal(rom, romBuffer);
        return;
      }

      this.setupGame(rom, romBuffer);
    } catch (error) {
      gameboyLog("[GameBoy] Start game error:", error);
    }
  }

  private setupGame(rom: RomFile, romBuffer: Buffer) {
    const GB_SCREEN_WIDTH = 160;
    const GB_SCREEN_HEIGHT = 72;
    const { theme } = this.options;

    const left = Math.floor((this.renderer.terminalWidth - GB_SCREEN_WIDTH) / 2);
    const top = Math.floor((this.renderer.terminalHeight - GB_SCREEN_HEIGHT) / 2);

    this.gameboyScreen = new FrameBufferRenderable(this.renderer, {
      id: "gameboy-screen",
      width: GB_SCREEN_WIDTH,
      height: GB_SCREEN_HEIGHT,
      position: "absolute",
      left: Math.max(0, left),
      top: Math.max(0, top),
      zIndex: 1000,
    });
    this.renderer.root.add(this.gameboyScreen);

    const startupText = new TextRenderable(this.renderer, {
      id: "gameboy-startup",
      content: "GameBoy loaded! Press ENTER to start!",
      fg: RGBA.fromHex(theme.accent),
      position: "absolute",
      top: 1,
      left: 1,
      zIndex: 1001,
    });
    this.renderer.root.add(startupText);

    const gameHelpContainer = new BoxRenderable(this.renderer, {
      id: "gameboy-game-help-container",
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      flexDirection: "column",
      alignItems: "center",
      zIndex: 1001,
    });

    const helpLine1 = new TextRenderable(this.renderer, {
      id: "gameboy-game-help-1",
      content: "ARROWS: D-PAD   Z/X: A/B   ENTER: START",
      fg: theme.dim,
    });

    const saveBinding = this.options.saveKeybinding ?? DEFAULT_SAVE_KEYBINDING;
    const loadBinding = this.options.loadKeybinding ?? DEFAULT_LOAD_KEYBINDING;

    const helpLine2 = new TextRenderable(this.renderer, {
      id: "gameboy-game-help-2",
      content: `${formatKeybinding(saveBinding)}: SAVE   ${formatKeybinding(loadBinding)}: LOAD   ESC X2: QUIT`.toUpperCase(),
      fg: theme.dim,
    });

    gameHelpContainer.add(helpLine1);
    gameHelpContainer.add(helpLine2);
    this.renderer.root.add(gameHelpContainer);

    this.isRunning = true;
    this.engine!.active = true;

    // Input Mapping
    const keyMap: Record<string, number> = {
      up: GameboyEngine.KEYMAP.UP,
      down: GameboyEngine.KEYMAP.DOWN,
      left: GameboyEngine.KEYMAP.LEFT,
      right: GameboyEngine.KEYMAP.RIGHT,
      z: GameboyEngine.KEYMAP.A,
      x: GameboyEngine.KEYMAP.B,
      return: GameboyEngine.KEYMAP.START,
      enter: GameboyEngine.KEYMAP.START,
      shift: GameboyEngine.KEYMAP.SELECT,
    };

    const heldKeys: Set<number> = new Set();
    let escapeCount = 0;
    let escapeTimeout: any = null;
    let ctrlCCount = 0;
    let ctrlCTimeout: any = null;
    const keyPressTimestamps: Map<number, number> = new Map();
    const AUTO_RELEASE_MS = 150;

    const cleanup = () => {
      this.isRunning = false;
      this.engine!.active = false;
      this.renderer.keyInput.off("keypress", keyHandler);
      this.renderer.keyInput.off("keyup", keyReleaseHandler);
      this.renderer.setFrameCallback(null as any);

      const elementsToRemove = [
        "gameboy-screen", "gameboy-game-help", "gameboy-startup", 
        "gameboy-status", "gameboy-background", "gameboy-game-help-container"
      ];
      elementsToRemove.forEach(id => safeRemove(this.renderer, id));

      if (this.gameboyScreen && !this.gameboyScreen.isDestroyed) {
        this.gameboyScreen.destroy();
      }
      closeLogger();
    };

    const keyHandler = (key: KeyEvent) => {
      if (key.name === "c" && key.ctrl) {
        ctrlCCount++;
        if (ctrlCCount >= 2) {
          cleanup();
          if (this.options.onForceExit) this.options.onForceExit();
          else { this.renderer.destroy(); process.exit(0); }
        } else {
          if (ctrlCTimeout) clearTimeout(ctrlCTimeout);
          ctrlCTimeout = setTimeout(() => { ctrlCCount = 0; }, 500);
        }
        return true;
      }

      if (key.name === "escape") {
        escapeCount++;
        if (escapeCount === 1) {
          this.engine!.pressKey(GameboyEngine.KEYMAP.SELECT);
          if (escapeTimeout) clearTimeout(escapeTimeout);
          escapeTimeout = setTimeout(() => { escapeCount = 0; }, 500);
          return true;
        }
        if (escapeCount >= 2) {
          cleanup();
          this.options.onExit();
          return true;
        }
      }

      // Save/Load
      if (key.name === saveBinding.key && !!key.ctrl === !!saveBinding.ctrl && !!key.shift === !!saveBinding.shift && !!key.option === !!saveBinding.alt) {
        this.handleSave(rom); return true;
      }
      if (key.name === loadBinding.key && !!key.ctrl === !!loadBinding.ctrl && !!key.shift === !!loadBinding.shift && !!key.option === !!loadBinding.alt) {
        this.handleLoad(rom, romBuffer); return true;
      }

      const gbKey = keyMap[key.name];
      if (gbKey !== undefined) {
        heldKeys.add(gbKey);
        keyPressTimestamps.set(gbKey, Date.now());
        this.engine!.pressKey(gbKey);
        return true;
      }
      return false;
    };

    const keyReleaseHandler = (key: KeyEvent) => {
      const gbKey = keyMap[key.name];
      if (gbKey !== undefined) { heldKeys.delete(gbKey); keyPressTimestamps.delete(gbKey); }
    };

    this.renderer.keyInput.on("keypress", keyHandler);
    this.renderer.keyInput.on("keyup", keyReleaseHandler);

    let gameLoopCount = 0;
    let lastTerminalWidth = this.renderer.terminalWidth;
    let lastTerminalHeight = this.renderer.terminalHeight;

    const gameLoop = async (_deltaMs: number) => {
      if (!this.isRunning) return;

      if (this.renderer.terminalWidth !== lastTerminalWidth || this.renderer.terminalHeight !== lastTerminalHeight) {
        safeRemove(this.renderer, "gameboy-background");
        this.renderer.root.add(createBackground(this.renderer));
        const newLeft = Math.max(0, Math.floor((this.renderer.terminalWidth - GB_SCREEN_WIDTH) / 2));
        const newTop = Math.max(0, Math.floor((this.renderer.terminalHeight - GB_SCREEN_HEIGHT) / 2));
        this.renderer.root.remove("gameboy-screen");
        this.gameboyScreen = new FrameBufferRenderable(this.renderer, {
          id: "gameboy-screen", width: GB_SCREEN_WIDTH, height: GB_SCREEN_HEIGHT,
          position: "absolute", left: newLeft, top: newTop, zIndex: 1000,
        });
        this.renderer.root.add(this.gameboyScreen);
        lastTerminalWidth = this.renderer.terminalWidth;
        lastTerminalHeight = this.renderer.terminalHeight;
      }

      const now = Date.now();
      heldKeys.forEach(key => {
        const pressTime = keyPressTimestamps.get(key);
        if (pressTime && now - pressTime > AUTO_RELEASE_MS) { heldKeys.delete(key); keyPressTimestamps.delete(key); }
      });
      heldKeys.forEach(key => this.engine!.pressKey(key));

      gameLoopCount++;
      this.engine!.doFrame();

      const pixels = this.engine!.getScreen();
      if (pixels && pixels.length > 0) {
        const fb = this.gameboyScreen!.frameBuffer;
        for (let y = 0; y < 72; y++) {
          const row1Offset = (y << 1) * 160;
          const row2Offset = (row1Offset + 160);
          for (let x = 0; x < 160; x++) {
            const idx1 = (row1Offset + x) << 2;
            const idx2 = (row2Offset + x) << 2;
            
            const gray1 = toGameBoyShade(pixels[idx1], pixels[idx1+1], pixels[idx1+2]);
            const gray2 = toGameBoyShade(pixels[idx2], pixels[idx2+1], pixels[idx2+2]);
            
            fb.setCell(x, y, "▀", RGBA.fromInts(gray1, gray1, gray1, 255), RGBA.fromInts(gray2, gray2, gray2, 255));
          }
        }
      }

      if (gameLoopCount === 60) safeRemove(this.renderer, "gameboy-startup");
      this.renderer.requestRender();
    };

    this.renderer.setFrameCallback(gameLoop);
  }

  private handleSave(rom: RomFile) {
    const statusText = new TextRenderable(this.renderer, {
      id: "gameboy-status", content: "Saving...", fg: RGBA.fromHex(this.options.theme.accent),
      position: "absolute", top: 2, left: 1, zIndex: 1002,
    });
    this.renderer.root.add(statusText);
    saveGameState(this.engine!.serverboy, this.options.saveDirectory, rom.name, 0).then(success => {
      statusText.content = success ? "Saved!" : "Save failed!";
      setTimeout(() => { safeRemove(this.renderer, "gameboy-status"); this.renderer.requestRender(); }, 1500);
    });
  }

  private handleLoad(rom: RomFile, romBuffer: Buffer) {
    const statusText = new TextRenderable(this.renderer, {
      id: "gameboy-status", content: "Loading...", fg: RGBA.fromHex(this.options.theme.accent),
      position: "absolute", top: 2, left: 1, zIndex: 1002,
    });
    this.renderer.root.add(statusText);
    loadGameState(this.engine!.serverboy, this.options.saveDirectory, rom.name, romBuffer, 0).then(success => {
      statusText.content = success ? "Loaded!" : "No save found!";
      setTimeout(() => { safeRemove(this.renderer, "gameboy-status"); this.renderer.requestRender(); }, 1500);
    });
  }

  private handleSmallTerminal(rom: RomFile, romBuffer: Buffer) {
    const { theme, onExit } = this.options;
    const GB_SCREEN_WIDTH = 160;
    const GB_SCREEN_HEIGHT = 72;
    const warning = createWarning(this.renderer, theme, this.renderer.terminalWidth, this.renderer.terminalHeight, GB_SCREEN_WIDTH, GB_SCREEN_HEIGHT + 4);
    this.renderer.root.add(warning);

    const checkInterval = setInterval(() => {
      if (this.renderer.terminalWidth >= GB_SCREEN_WIDTH && this.renderer.terminalHeight >= GB_SCREEN_HEIGHT + 4) {
        clearInterval(checkInterval);
        this.renderer.keyInput.off("keypress", checkSizeOrExit);
        safeRemove(this.renderer, "gameboy-warning");
        this.setupGame(rom, romBuffer);
      }
    }, 500);

    const checkSizeOrExit = (key: KeyEvent) => {
      if (key.name === "escape") {
        clearInterval(checkInterval);
        this.renderer.keyInput.off("keypress", checkSizeOrExit);
        safeRemove(this.renderer, "gameboy-warning");
        safeRemove(this.renderer, "gameboy-background");
        onExit();
      }
    };
    this.renderer.keyInput.on("keypress", checkSizeOrExit);
  }
}
