import { expect, test, describe } from "bun:test";
import { toGameBoyShade } from "../utils/color";

describe("Color Utilities", () => {
  test("toGameBoyShade converts RGB to 4 shades correctly", () => {
    // White
    expect(toGameBoyShade(255, 255, 255)).toBe(255);
    expect(toGameBoyShade(200, 200, 200)).toBe(255);
    
    // Light gray
    expect(toGameBoyShade(150, 150, 150)).toBe(170);
    expect(toGameBoyShade(130, 130, 130)).toBe(170);
    
    // Dark gray
    expect(toGameBoyShade(80, 80, 80)).toBe(85);
    expect(toGameBoyShade(70, 70, 70)).toBe(85);
    
    // Black
    expect(toGameBoyShade(30, 30, 30)).toBe(0);
    expect(toGameBoyShade(0, 0, 0)).toBe(0);
  });
});
