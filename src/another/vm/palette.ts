export const enum PALETTE_TYPE {
  AMIGA = 0,
  EGA = 1,
  VGA = 2,
}

export const PALETTE_EGA = [
  0x00, 0x00, 0x00, 0x00, 0x00, 0xaa, 0x00, 0xaa, 0x00, 0x00, 0xaa, 0xaa, 0xaa,
  0x00, 0x00, 0xaa, 0x00, 0xaa, 0xaa, 0x55, 0x00, 0xaa, 0xaa, 0xaa, 0x55, 0x55,
  0x55, 0x55, 0x55, 0xff, 0x55, 0xff, 0x55, 0x55, 0xff, 0xff, 0xff, 0x55, 0x55,
  0xff, 0x55, 0xff, 0xff, 0xff, 0x55, 0xff, 0xff, 0xff,
];

export let palette_bmp = new Uint32Array(256 * 3); // 15th edition backgrounds
export let palette32 = new Uint32Array(16 * 3); // Amiga, EGA, VGA
export let palette: Uint8Array;
export let palette_type = PALETTE_TYPE.AMIGA;

export function set_palette_type(num: number) {
  palette_type = num;
}

export function set_palette32(data: Uint32Array) {
  palette32 = data;
}

export function set_palette(data: Uint8Array) {
  palette = data;
}

export function set_palette_ega(offset: number) {
  for (let i = 0; i < 16; ++i) {
    let color = (palette[offset + i * 2] << 8) | palette[offset + i * 2 + 1];
    color = ((color >> 12) & 15) * 3;
    palette32[PALETTE_TYPE.EGA * 16 + i] =
      0xff000000 |
      (PALETTE_EGA[color + 2] << 16) |
      (PALETTE_EGA[color + 1] << 8) |
      PALETTE_EGA[color];
  }
}

export function set_palette_444(offset: number, type: number) {
  for (let i = 0; i < 16; ++i) {
    const color = (palette[offset + i * 2] << 8) | palette[offset + i * 2 + 1];
    let r = (color >> 8) & 15;
    r = (r << 4) | r;
    let g = (color >> 4) & 15;
    g = (g << 4) | g;
    let b = color & 15;
    b = (b << 4) | b;
    palette32[type * 16 + i] = 0xff000000 | (b << 16) | (g << 8) | r;
  }
}

export function set_palette_bmp(data: Uint8Array) {
  let color = 0;
  for (let i = 0; i < 256; ++i) {
    palette_bmp[i] =
      0xff000000 |
      (data[color + 2] << 16) |
      (data[color + 1] << 8) |
      data[color];
    color += 3;
  }
}
