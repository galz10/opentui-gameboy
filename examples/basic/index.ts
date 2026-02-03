import { createCliRenderer } from "@opentui/core";
import { launchGameboy, DEFAULT_THEME } from "../../src/index";
import { join } from "node:path";

async function main() {
  const renderer = await createCliRenderer();

  await launchGameboy(renderer, {
    romDirectory: join(import.meta.dir, "..", "roms"),
    saveDirectory: join(import.meta.dir, "..", "saves"),
    theme: DEFAULT_THEME,
    onExit: () => {
      renderer.destroy();
      process.exit(0);
    },
    onForceExit: () => {
      renderer.destroy();
      process.exit(0);
    },
    debug: true
  });

  renderer.start();
}

main().catch(console.error);
