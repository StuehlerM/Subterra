/** Type declarations for the plain-JS PNG -> text-grid converter tool. */

export interface DecodedPng {
  readonly width: number;
  readonly height: number;
  /** Row-major RGBA bytes. */
  readonly pixels: Uint8Array;
}

export interface ConvertOptions {
  /** Split a horizontal strip into this many frames (default 1). */
  frames?: number;
  /** Match pixels against this shared palette instead of deriving one. */
  palette?: Record<string, string>;
  /** Max per-channel drift allowed when matching (default 0 = strict). */
  tolerance?: number;
  /** Snap every pixel to the nearest palette entry. */
  forceNearest?: boolean;
}

export interface ConvertedSprite {
  readonly frames: string[][];
  readonly palette: Record<string, string>;
  /** Emits paste-ready `const NAME_FRAMES` + `const NAME_PALETTE` source. */
  toCode(name: string): string;
}

export function decodePng(buffer: Buffer | Uint8Array): DecodedPng;
export function convertPngToSprite(buffer: Buffer | Uint8Array, options?: ConvertOptions): ConvertedSprite;
