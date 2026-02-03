export function toGameBoyShade(r: number, g: number, b: number): number {
  const luminance = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
  if (luminance > 192) return 255;
  if (luminance > 128) return 170;
  if (luminance > 64) return 85;
  return 0;
}
