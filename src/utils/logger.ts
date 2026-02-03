import { mkdirSync } from "node:fs";
import { join } from "node:path";

let logFileHandle: { write: (s: string) => void; flush: () => void; end: () => void } | null = null;
let debugEnabled = false;
let logFilePath: string | undefined;

/**
 * Initialize the internal logger
 */
export function initLogger(debug: boolean, logFile?: string) {
  debugEnabled = debug;
  logFilePath = logFile;
}

/**
 * Internal logger function
 */
export function gameboyLog(...args: unknown[]) {
  if (!debugEnabled) return;

  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${args.map(a => {
    if (a instanceof Error) {
      return `Error: ${a.message}${a.stack ? '\n' + a.stack : ''}`;
    }
    return typeof a === "object" ? JSON.stringify(a) : String(a);
  }).join(" ")}`;

  console.log(...args);

  if (logFilePath) {
    try {
      if (!logFileHandle) {
        const dir = join(logFilePath, "..");
        mkdirSync(dir, { recursive: true });
        // @ts-ignore - Bun global
        const file = Bun.file(logFilePath);
        logFileHandle = file.writer();
      }
      logFileHandle!.write(message + "\n");
      logFileHandle!.flush();
    } catch (e) {
      // Ignore file write errors
    }
  }
}

/**
 * Close the log file handle
 */
export function closeLogger() {
  if (logFileHandle) {
    try {
      logFileHandle.end();
      logFileHandle = null;
    } catch (e) {
      // Ignore errors
    }
  }
}
