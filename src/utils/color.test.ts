import { expect, test, describe } from "bun:test";
import { toGameBoyShade } from "./color";

describe("toGameBoyShade", () => {
  test("converts white to 255", () => {
    expect(toGameBoyShade(255, 255, 255)).toBe(255);
  });

  test("converts black to 0", () => {
    expect(toGameBoyShade(0, 0, 0)).toBe(0);
  });

  test("converts mid-gray correctly", () => {
    // Luminance = 0.299*128 + 0.587*128 + 0.114*128 = 128
    // 128 is not > 128, so it should return 85
    expect(toGameBoyShade(128, 128, 128)).toBe(85);
  });

  test("converts light-gray correctly", () => {
    // Luminance = 200
    expect(toGameBoyShade(200, 200, 200)).toBe(255);
  });
});
