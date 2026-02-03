import {
  CliRenderer,
  BoxRenderable,
  RGBA,
  TextRenderable,
  TextAttributes,
  FrameBufferRenderable,
  KeyEvent,
} from '@opentui/core';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import {
  GameboyOptions,
  RomFile,
  DEFAULT_SAVE_KEYBINDING,
  DEFAULT_LOAD_KEYBINDING,
  GB_TERM_WIDTH,
  GB_TERM_HEIGHT,
  GB_MIN_TERM_HEIGHT,
} from '../types';
import { gameboyLog, closeLogger } from '../utils/logger';
import { safeRemove, createBackground, createWarning, formatKeybinding } from './components';
import { GameboyEngine } from '../emulator/engine';
import { loadLatestSave, saveGameState, loadGameState } from '../emulator/persistence';
import { toGameBoyShade } from '../utils/color';

export class GameboyUI {
  private renderer: CliRenderer;
  private options: GameboyOptions;
  private engine?: GameboyEngine;
  private isRunning: boolean = false;
  private gameboyScreen?: FrameBufferRenderable;
  private heldKeys = new Set<number>();
  private keyPressTimestamps = new Map<number, number>();
  private escapeCount = 0;
  private escapeTimeout: ReturnType<typeof setTimeout> | null = null;
  private ctrlCCount = 0;
  private ctrlCTimeout: ReturnType<typeof setTimeout> | null = null;
  private gameLoopCount = 0;
  private lastTerminalWidth = 0;
  private lastTerminalHeight = 0;

  constructor(renderer: CliRenderer, options: GameboyOptions) {
    this.renderer = renderer;
    this.options = options;
  }

  public async showRomSelection(): Promise<void> {
    const { romDirectory, theme, onExit } = this.options;

    this.renderer.root.add(createBackground(this.renderer));

    const container = new BoxRenderable(this.renderer, {
      id: 'gameboy-container',
      width: '100%',
      height: '100%',
      position: 'absolute',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    });
    this.renderer.root.add(container);

    gameboyLog('[GameBoy] Loading ROMs from:', romDirectory);
    let roms: RomFile[] = [];
    try {
      mkdirSync(romDirectory, { recursive: true });
      const files = await readdir(romDirectory);
      roms = files
        .filter((f) => f.endsWith('.gb') || f.endsWith('.gbc'))
        .map((f) => ({ name: f.replace(/\.(gb|gbc)$/, ''), path: join(romDirectory, f) }));
    } catch (e) {
      gameboyLog('[GameBoy] Error loading ROMs:', e);
    }

    if (roms.length === 0) {
      this.showNoRoms(container);
      return;
    }

    let selectedIndex = 0;
    container.add(
      new TextRenderable(this.renderer, {
        id: 'gameboy-title',
        content: 'Select a Game',
        fg: RGBA.fromHex(theme.accent),
        attributes: TextAttributes.BOLD,
        marginBottom: 2,
      }),
    );

    const listContainer = new BoxRenderable(this.renderer, {
      id: 'gameboy-list',
      flexDirection: 'column',
      border: true,
      borderColor: RGBA.fromHex(theme.darkAccent),
      padding: 1,
      minWidth: 40,
    });
    container.add(listContainer);

    const romItemBoxes: BoxRenderable[] = [];
    const romItemTexts: TextRenderable[] = [];

    roms.forEach((rom, i) => {
      const box = new BoxRenderable(this.renderer, {
        id: `gameboy-rom-box-${i}`,
        backgroundColor: i === selectedIndex ? RGBA.fromHex(theme.accent) : undefined,
        paddingLeft: 1,
        paddingRight: 1,
      });
      const text = new TextRenderable(this.renderer, {
        id: `gameboy-rom-${i}`,
        content: rom.name,
        fg: i === selectedIndex ? RGBA.fromHex(theme.bg) : RGBA.fromHex(theme.text),
      });
      box.add(text);
      listContainer.add(box);
      romItemBoxes.push(box);
      romItemTexts.push(text);
    });

    container.add(
      new TextRenderable(this.renderer, {
        id: 'gameboy-select-help',
        content: '↑↓: Navigate | ENTER: Play | ESC: Back',
        fg: RGBA.fromHex(theme.dim),
        marginTop: 2,
      }),
    );

    const selectionHandler = (key: KeyEvent) => {
      if (key.name === 'escape') {
        this.renderer.keyInput.off('keypress', selectionHandler);
        safeRemove(this.renderer, container.id);
        safeRemove(this.renderer, 'gameboy-background');
        onExit();
      } else if (key.name === 'up') {
        selectedIndex = (selectedIndex - 1 + roms.length) % roms.length;
        this.updateRomList(romItemBoxes, romItemTexts, selectedIndex);
      } else if (key.name === 'down') {
        selectedIndex = (selectedIndex + 1) % roms.length;
        this.updateRomList(romItemBoxes, romItemTexts, selectedIndex);
      } else if (key.name === 'return' || key.name === 'enter') {
        this.renderer.keyInput.off('keypress', selectionHandler);
        this.startGame(roms[selectedIndex], container);
      }
    };

    this.renderer.keyInput.on('keypress', selectionHandler);
    this.renderer.requestRender();
  }

  private updateRomList(boxes: BoxRenderable[], texts: TextRenderable[], selectedIndex: number) {
    const { theme } = this.options;
    boxes.forEach((box, i) => {
      const isSelected = i === selectedIndex;
      box.backgroundColor = isSelected ? RGBA.fromHex(theme.accent) : undefined;
      if (texts[i]) {
        texts[i].fg = isSelected ? RGBA.fromHex(theme.bg) : RGBA.fromHex(theme.text);
      }
    });
    this.renderer.requestRender();
  }

  private showNoRoms(container: BoxRenderable) {
    const { theme, onExit, romDirectory } = this.options;
    container.add(
      new TextRenderable(this.renderer, {
        id: 'gameboy-no-roms',
        content: `No ROMs found in ${romDirectory}`,
        fg: RGBA.fromHex(theme.dim),
        attributes: TextAttributes.BOLD,
      }),
    );
    container.add(
      new TextRenderable(this.renderer, {
        id: 'gameboy-exit',
        content: 'Press ESC to go back',
        fg: RGBA.fromHex(theme.accent),
        marginTop: 2,
      }),
    );

    const exitHandler = (key: KeyEvent) => {
      if (key.name === 'escape') {
        this.renderer.keyInput.off('keypress', exitHandler);
        safeRemove(this.renderer, container.id);
        safeRemove(this.renderer, 'gameboy-background');
        onExit();
      }
    };
    this.renderer.keyInput.on('keypress', exitHandler);
    this.renderer.requestRender();
  }

  private async startGame(rom: RomFile, container: BoxRenderable) {
    const { theme, saveDirectory } = this.options;
    const loadingText = new TextRenderable(this.renderer, {
      id: 'gameboy-loading',
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

      // Check terminal size
      if (
        this.renderer.terminalWidth < GB_TERM_WIDTH ||
        this.renderer.terminalHeight < GB_MIN_TERM_HEIGHT
      ) {
        this.handleSmallTerminal(rom, romBuffer);
        return;
      }

      this.setupGame(rom, romBuffer);
    } catch (error) {
      gameboyLog('[GameBoy] Start game error:', error);
    }
  }

  private setupGame(rom: RomFile, romBuffer: Buffer) {
    const { theme } = this.options;
    const left = Math.max(0, Math.floor((this.renderer.terminalWidth - GB_TERM_WIDTH) / 2));
    const top = Math.max(0, Math.floor((this.renderer.terminalHeight - GB_TERM_HEIGHT) / 2));

    this.gameboyScreen = new FrameBufferRenderable(this.renderer, {
      id: 'gameboy-screen',
      width: GB_TERM_WIDTH,
      height: GB_TERM_HEIGHT,
      position: 'absolute',
      left,
      top,
      zIndex: 1000,
    });
    this.renderer.root.add(this.gameboyScreen);

    const startupText = new TextRenderable(this.renderer, {
      id: 'gameboy-startup',
      content: 'GameBoy loaded! Press ENTER to start!',
      fg: RGBA.fromHex(theme.accent),
      position: 'absolute',
      top: 1,
      left: 1,
      zIndex: 1001,
    });
    this.renderer.root.add(startupText);

    const gameHelpContainer = new BoxRenderable(this.renderer, {
      id: 'gameboy-game-help-container',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 1001,
    });

    const helpLine1 = new TextRenderable(this.renderer, {
      id: 'gameboy-game-help-1',
      content: 'ARROWS: D-PAD   Z/X: A/B   ENTER: START',
      fg: theme.dim,
    });

    const saveBinding = this.options.saveKeybinding ?? DEFAULT_SAVE_KEYBINDING;
    const loadBinding = this.options.loadKeybinding ?? DEFAULT_LOAD_KEYBINDING;
    const helpLine2 = new TextRenderable(this.renderer, {
      id: 'gameboy-game-help-2',
      content:
        `${formatKeybinding(saveBinding)}: SAVE   ${formatKeybinding(loadBinding)}: LOAD   ESC X2: QUIT`.toUpperCase(),
      fg: theme.dim,
    });

    gameHelpContainer.add(helpLine1);
    gameHelpContainer.add(helpLine2);
    this.renderer.root.add(gameHelpContainer);

    this.isRunning = true;
    this.engine!.active = true;
    this.gameLoopCount = 0;
    this.lastTerminalWidth = this.renderer.terminalWidth;
    this.lastTerminalHeight = this.renderer.terminalHeight;

    this.setupGameInput(rom, romBuffer);
    this.renderer.setFrameCallback((delta) => this.gameLoop(delta));
  }

  private async gameLoop(_deltaMs: number) {
    if (!this.isRunning) return;

    if (
      this.renderer.terminalWidth !== this.lastTerminalWidth ||
      this.renderer.terminalHeight !== this.lastTerminalHeight
    ) {
      this.handleResize();
    }

    const now = Date.now();
    const AUTO_RELEASE_MS = 150;
    this.heldKeys.forEach((key) => {
      const pressTime = this.keyPressTimestamps.get(key);
      if (pressTime && now - pressTime > AUTO_RELEASE_MS) {
        this.heldKeys.delete(key);
        this.keyPressTimestamps.delete(key);
      }
    });
    this.heldKeys.forEach((key) => this.engine!.pressKey(key));

    this.gameLoopCount++;
    this.engine!.doFrame();

    const pixels = this.engine!.getScreen();
    if (pixels && pixels.length > 0) {
      this.renderFrame(pixels);
    }

    if (this.gameLoopCount === 60) safeRemove(this.renderer, 'gameboy-startup');
    this.renderer.requestRender();
  }

  private handleResize() {
    safeRemove(this.renderer, 'gameboy-background');
    this.renderer.root.add(createBackground(this.renderer));

    const left = Math.max(0, Math.floor((this.renderer.terminalWidth - GB_TERM_WIDTH) / 2));
    const top = Math.max(0, Math.floor((this.renderer.terminalHeight - GB_TERM_HEIGHT) / 2));

    this.renderer.root.remove('gameboy-screen');
    this.gameboyScreen = new FrameBufferRenderable(this.renderer, {
      id: 'gameboy-screen',
      width: GB_TERM_WIDTH,
      height: GB_TERM_HEIGHT,
      position: 'absolute',
      left,
      top,
      zIndex: 1000,
    });
    this.renderer.root.add(this.gameboyScreen);

    this.lastTerminalWidth = this.renderer.terminalWidth;
    this.lastTerminalHeight = this.renderer.terminalHeight;
  }

  private renderFrame(pixels: Uint8Array) {
    const fb = this.gameboyScreen!.frameBuffer;
    for (let y = 0; y < GB_TERM_HEIGHT; y++) {
      const row1Offset = (y << 1) * GB_TERM_WIDTH;
      const row2Offset = row1Offset + GB_TERM_WIDTH;
      for (let x = 0; x < GB_TERM_WIDTH; x++) {
        const idx1 = (row1Offset + x) << 2;
        const idx2 = (row2Offset + x) << 2;

        const gray1 = toGameBoyShade(pixels[idx1], pixels[idx1 + 1], pixels[idx1 + 2]);
        const gray2 = toGameBoyShade(pixels[idx2], pixels[idx2 + 1], pixels[idx2 + 2]);

        fb.setCell(
          x,
          y,
          '▀',
          RGBA.fromInts(gray1, gray1, gray1, 255),
          RGBA.fromInts(gray2, gray2, gray2, 255),
        );
      }
    }
  }

  private cleanupGame() {
    this.isRunning = false;
    if (this.engine) this.engine.active = false;

    this.renderer.keyInput.off('keypress', this.handleGameKey!);
    this.renderer.keyInput.off('keyup', this.handleGameKeyUp!);
    this.renderer.setFrameCallback(null as unknown as (deltaMs: number) => Promise<void>);

    [
      'gameboy-screen',
      'gameboy-game-help',
      'gameboy-startup',
      'gameboy-status',
      'gameboy-background',
      'gameboy-game-help-container',
    ].forEach((id) => safeRemove(this.renderer, id));

    if (this.gameboyScreen && !this.gameboyScreen.isDestroyed) {
      this.gameboyScreen.destroy();
    }
    closeLogger();
  }

  private setupGameInput(rom: RomFile, romBuffer: Buffer) {
    this.handleGameKey = (key: KeyEvent) => {
      if (key.name === 'c' && key.ctrl) {
        this.ctrlCCount++;
        if (this.ctrlCCount >= 2) {
          this.cleanupGame();
          if (this.options.onForceExit) this.options.onForceExit();
          else {
            this.renderer.destroy();
            process.exit(0);
          }
        } else {
          if (this.ctrlCTimeout) clearTimeout(this.ctrlCTimeout);
          this.ctrlCTimeout = setTimeout(() => {
            this.ctrlCCount = 0;
          }, 500);
        }
        return true;
      }

      if (key.name === 'escape') {
        this.escapeCount++;
        if (this.escapeCount === 1) {
          this.engine?.pressKey(GameboyEngine.KEYMAP.SELECT);
          if (this.escapeTimeout) clearTimeout(this.escapeTimeout);
          this.escapeTimeout = setTimeout(() => {
            this.escapeCount = 0;
          }, 500);
          return true;
        }
        if (this.escapeCount >= 2) {
          this.cleanupGame();
          this.options.onExit();
          return true;
        }
      }

      const saveBinding = this.options.saveKeybinding ?? DEFAULT_SAVE_KEYBINDING;
      const loadBinding = this.options.loadKeybinding ?? DEFAULT_LOAD_KEYBINDING;

      if (this.matchBinding(key, saveBinding)) {
        this.handleSave(rom);
        return true;
      }
      if (this.matchBinding(key, loadBinding)) {
        this.handleLoad(rom, romBuffer);
        return true;
      }

      const gbKey = this.getGBKey(key.name);
      if (gbKey !== undefined) {
        this.heldKeys.add(gbKey);
        this.keyPressTimestamps.set(gbKey, Date.now());
        this.engine?.pressKey(gbKey);
        return true;
      }
      return false;
    };

    this.handleGameKeyUp = (key: KeyEvent) => {
      const gbKey = this.getGBKey(key.name);
      if (gbKey !== undefined) {
        this.heldKeys.delete(gbKey);
        this.keyPressTimestamps.delete(gbKey);
      }
    };

    this.renderer.keyInput.on('keypress', this.handleGameKey);
    this.renderer.keyInput.on('keyup', this.handleGameKeyUp);
  }

  private matchBinding(
    key: KeyEvent,
    binding: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean },
  ): boolean {
    return (
      key.name === binding.key &&
      !!key.ctrl === !!binding.ctrl &&
      !!key.shift === !!binding.shift &&
      !!key.option === !!binding.alt
    );
  }

  private getGBKey(name: string): number | undefined {
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
    return keyMap[name];
  }

  private handleGameKey?: (key: KeyEvent) => boolean;
  private handleGameKeyUp?: (key: KeyEvent) => void;

  private handleSave(rom: RomFile) {
    const statusText = new TextRenderable(this.renderer, {
      id: 'gameboy-status',
      content: 'Saving...',
      fg: RGBA.fromHex(this.options.theme.accent),
      position: 'absolute',
      top: 2,
      left: 1,
      zIndex: 1002,
    });
    this.renderer.root.add(statusText);
    saveGameState(this.engine!.serverboy, this.options.saveDirectory, rom.name, 0).then(
      (success) => {
        statusText.content = success ? 'Saved!' : 'Save failed!';
        setTimeout(() => {
          safeRemove(this.renderer, 'gameboy-status');
          this.renderer.requestRender();
        }, 1500);
      },
    );
  }

  private handleLoad(rom: RomFile, romBuffer: Buffer) {
    const statusText = new TextRenderable(this.renderer, {
      id: 'gameboy-status',
      content: 'Loading...',
      fg: RGBA.fromHex(this.options.theme.accent),
      position: 'absolute',
      top: 2,
      left: 1,
      zIndex: 1002,
    });
    this.renderer.root.add(statusText);
    loadGameState(this.engine!.serverboy, this.options.saveDirectory, rom.name, romBuffer, 0).then(
      (success) => {
        statusText.content = success ? 'Loaded!' : 'No save found!';
        setTimeout(() => {
          safeRemove(this.renderer, 'gameboy-status');
          this.renderer.requestRender();
        }, 1500);
      },
    );
  }

  private handleSmallTerminal(rom: RomFile, romBuffer: Buffer) {
    const { theme, onExit } = this.options;
    const warning = createWarning(
      this.renderer,
      theme,
      this.renderer.terminalWidth,
      this.renderer.terminalHeight,
    );
    this.renderer.root.add(warning);

    const checkInterval = setInterval(() => {
      if (
        this.renderer.terminalWidth >= GB_TERM_WIDTH &&
        this.renderer.terminalHeight >= GB_MIN_TERM_HEIGHT
      ) {
        clearInterval(checkInterval);
        this.renderer.keyInput.off('keypress', checkSizeOrExit);
        safeRemove(this.renderer, 'gameboy-warning');
        this.setupGame(rom, romBuffer);
      }
    }, 500);

    const checkSizeOrExit = (key: KeyEvent) => {
      if (key.name === 'escape') {
        clearInterval(checkInterval);
        this.renderer.keyInput.off('keypress', checkSizeOrExit);
        safeRemove(this.renderer, 'gameboy-warning');
        safeRemove(this.renderer, 'gameboy-background');
        onExit();
      }
    };
    this.renderer.keyInput.on('keypress', checkSizeOrExit);
  }
}
