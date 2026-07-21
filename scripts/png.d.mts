/** Type declarations for the plain-JS PNG encoder tool. */
export function encodePng(width: number, height: number, rgba: Buffer): Buffer;
export function chunk(type: string, data: Buffer): Buffer;
export function hexToRgb(hex: string): [number, number, number];
