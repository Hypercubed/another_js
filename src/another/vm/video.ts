import {
  DATA,
  font,
  load,
  strings_en,
  strings_fr,
  STRINGS_LANGUAGE,
} from '../resources';
import { PAGE_SIZE, SCALE, SCREEN_H, SCREEN_W } from './constants';

import * as canvas from './canvas';
import * as palette from './palette';
import { codeSeen } from './events';

export const buffer8 = new Uint8Array(4 * PAGE_SIZE);

let current_page0: number; // current
let current_page1: number; // front
let current_page2: number; // back

let strings_language = STRINGS_LANGUAGE.EN;

export function set_language(num: number) {
  strings_language = num;
}

export function set_page(num: number, page: number) {
  if (num == 0) {
    current_page0 = page;
  } else if (num == 1) {
    current_page1 = page;
  } else if (num == 2) {
    current_page2 = page;
  } else {
    console.assert(num < 4);
  }
}

export function get_page(num: number): number {
  if (num == 0xff) {
    return current_page2;
  } else if (num == 0xfe) {
    return current_page1;
  } else {
    console.assert(num < 4);
    return num;
  }
}

export function fill_page(num: number, color: number) {
  // console.log(`Script::op_fillPage(${num}, ${color})`)
  num = get_page(num);
  buffer8.fill(color, num * PAGE_SIZE, (num + 1) * PAGE_SIZE);
}

export function copy_page(src: number, dst: number, vscroll: number) {
  dst = get_page(dst);
  if (src >= 0xfe) {
    src = get_page(src);
    buffer8.set(
      buffer8.subarray(src * PAGE_SIZE, (src + 1) * PAGE_SIZE),
      dst * PAGE_SIZE
    );
  } else {
    if ((src & 0x80) == 0) {
      vscroll = 0;
    }
    src = get_page(src & 3);
    if (dst == src) {
      return;
    }
    const dst_offset = dst * PAGE_SIZE;
    const src_offset = src * PAGE_SIZE;
    if (vscroll == 0) {
      buffer8.set(
        buffer8.subarray(src_offset, src_offset + PAGE_SIZE),
        dst_offset
      );
    } else {
      //console.log( 'vscroll:' + vscroll );
      vscroll *= SCALE;
      if (vscroll > -SCREEN_W && vscroll < SCREEN_W) {
        const h = vscroll * SCREEN_W;
        if (vscroll < 0) {
          buffer8.set(
            buffer8.subarray(src_offset - h, src_offset + PAGE_SIZE),
            dst_offset
          );
        } else {
          buffer8.set(
            buffer8.subarray(src_offset, src_offset + PAGE_SIZE - h),
            dst_offset + h
          );
        }
      }
    }
  }
}

function draw_point(page: number, color: number, x: number, y: number) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) {
    return;
  }
  const offset = page * PAGE_SIZE + y * SCREEN_W + x;
  if (color == 0x11) {
    console.assert(page != 0);
    buffer8[offset] = buffer8[y * SCREEN_W + x];
  } else if (color == 0x10) {
    buffer8[offset] |= 8;
  } else {
    console.assert(color < 0x10);
    buffer8[offset] = color;
  }
}

function draw_line(
  page: number,
  color: number,
  y: number,
  x1: number,
  x2: number
) {
  if (x1 > x2) {
    const tmp = x1;
    x1 = x2;
    x2 = tmp;
  }
  if (x1 >= SCREEN_W || x2 < 0) {
    return;
  }
  if (x1 < 0) {
    x1 = 0;
  }
  if (x2 >= SCREEN_W) {
    x2 = SCREEN_W - 1;
  }
  const offset = page * PAGE_SIZE + y * SCREEN_W;
  if (color == 0x11) {
    // console.assert(page != 0);
    buffer8.set(
      buffer8.subarray(y * SCREEN_W + x1, y * SCREEN_W + x2 + 1),
      offset + x1
    );
  } else if (color == 0x10) {
    for (let i = x1; i <= x2; ++i) {
      buffer8[offset + i] |= 8;
    }
  } else {
    console.assert(color < 0x10);
    buffer8.fill(color, offset + x1, offset + x2 + 1);
  }
}

function draw_polygon(page: number, color: number, vertices: any) {
  // scanline fill
  let i = 0;
  let j = vertices.length - 1;
  let scanline = Math.min(vertices[i].y, vertices[j].y);
  let f2 = vertices[i++].x << 16;
  let f1 = vertices[j--].x << 16;
  let count = vertices.length;
  for (count -= 2; count != 0; count -= 2) {
    const h1 = vertices[j].y - vertices[j + 1].y;
    const step1 =
      (((vertices[j].x - vertices[j + 1].x) << 16) / (h1 == 0 ? 1 : h1)) >> 0;
    j -= 1;
    const h2 = vertices[i].y - vertices[i - 1].y;
    const step2 =
      (((vertices[i].x - vertices[i - 1].x) << 16) / (h2 == 0 ? 1 : h2)) >> 0;
    i += 1;
    f1 = (f1 & 0xffff0000) | 0x7fff;
    f2 = (f2 & 0xffff0000) | 0x8000;
    if (h2 == 0) {
      f1 += step1;
      f2 += step2;
    } else {
      for (let k = 0; k < h2; ++k) {
        if (scanline >= 0) {
          draw_line(page, color, scanline, f1 >> 16, f2 >> 16);
        }
        f1 += step1;
        f2 += step2;
        scanline += 1;
        if (scanline >= SCREEN_H) {
          return;
        }
      }
    }
  }
}

function fill_polygon(
  data: Uint8Array,
  offset: number,
  color: number,
  zoom: number,
  x: number,
  y: number
) {
  const w = ((data[offset++] * zoom) / 64) >> 0;
  const h = ((data[offset++] * zoom) / 64) >> 0;
  const x1 = (x * SCALE - (w * SCALE) / 2) >> 0;
  const x2 = (x * SCALE + (w * SCALE) / 2) >> 0;
  const y1 = (y * SCALE - (h * SCALE) / 2) >> 0;
  const y2 = (y * SCALE + (h * SCALE) / 2) >> 0;
  if (x1 >= SCREEN_W || x2 < 0 || y1 >= SCREEN_H || y2 < 0) {
    return;
  }
  const count = data[offset++];
  console.assert((count & 1) == 0);
  let vertices = new Array();
  for (let i = 0; i < count; ++i) {
    const vx = x1 + (((data[offset++] * zoom) / 64) >> 0) * SCALE;
    const vy = y1 + (((data[offset++] * zoom) / 64) >> 0) * SCALE;
    vertices.push({ x: vx, y: vy });
  }
  if (count == 4 && w == 0 && h <= 1) {
    draw_point(current_page0, color, x1, y1);
  } else {
    draw_polygon(current_page0, color, vertices);
  }
}

function draw_shape_parts(
  data: Uint8Array,
  offset: number,
  zoom: number,
  x: number,
  y: number
) {
  const x0 = (x - (data[offset++] * zoom) / 64) >> 0;
  const y0 = (y - (data[offset++] * zoom) / 64) >> 0;
  const count = data[offset++];
  for (let i = 0; i <= count; ++i) {
    const addr = (data[offset] << 8) | data[offset + 1];
    offset += 2;
    const x1 = (x0 + (data[offset++] * zoom) / 64) >> 0;
    const y1 = (y0 + (data[offset++] * zoom) / 64) >> 0;
    let color = 0xff;
    if (addr & 0x8000) {
      color = data[offset] & 0x7f;
      offset += 2;
    }
    draw_shape(data, (addr << 1) & 0xfffe, color, zoom, x1, y1);
  }
}

export function draw_shape(
  data: Uint8Array,
  offset: number,
  color: number,
  zoom: number,
  x: number,
  y: number
) {
  const code = data[offset++];
  if (code >= 0xc0) {
    if (color & 0x80) {
      color = code & 0x3f;
    }
    fill_polygon(data, offset, color, zoom, x, y);
  } else {
    if ((code & 0x3f) == 2) {
      draw_shape_parts(data, offset, zoom, x, y);
    }
  }
}

function put_pixel(page: number, x: number, y: number, color: number) {
  let offset = page * PAGE_SIZE + (y * SCREEN_W + x) * SCALE;
  for (let j = 0; j < SCALE; ++j) {
    buffer8.fill(color, offset, offset + SCALE);
    offset += SCREEN_W;
  }
}

function draw_char(
  page: number,
  chr: number,
  color: number,
  x: number,
  y: number
) {
  if (x < 320 / 8 && y < 200 - 8) {
    for (let j = 0; j < 8; ++j) {
      const mask = font[(chr - 32) * 8 + j];
      for (let i = 0; i < 8; ++i) {
        if ((mask & (1 << (7 - i))) != 0) {
          put_pixel(page, x * 8 + i, y + j, color);
        }
      }
    }
  }
}

export function draw_string(num: number, color: number, x: number, y: number) {
  let strings: Record<string, string> = strings_en;
  if (strings_language == STRINGS_LANGUAGE.FR && num in strings_fr) {
    strings = strings_fr;
  }
  if (num in strings) {
    const str = strings[num];
    if (num >= 0x15e && num <= 0x174) {
      codeSeen.dispatch(str);
    }
    draw_text(str, color, x, y);
  }
}

export function draw_text(str: string, color: number, x: number, y: number) {
  const x0 = x;
  for (let i = 0; i < str.length; ++i) {
    const chr = str.charCodeAt(i);
    if (chr == 10) {
      y += 8;
      x = x0;
    } else {
      draw_char(current_page0, chr, color, x, y);
      x += 1;
    }
  }
}

export function draw_bitmap(num: number) {
  const bitmap = DATA.bitmaps[num] as any;
  const size = bitmap[1];
  console.assert(size == 32000);
  const buf = load(bitmap[0], size)!;
  let offset = 0;
  for (let y = 0; y < 200; ++y) {
    for (let x = 0; x < 320; x += 8) {
      for (let b = 0; b < 8; ++b) {
        const mask = 1 << (7 - b);
        let color = 0;
        for (let p = 0; p < 4; ++p) {
          if (buf[offset + p * 8000] & mask) {
            color |= 1 << p;
          }
        }
        put_pixel(0, x + b, y, color);
      }
      offset += 1;
    }
  }
}

export function update_display(num: number) {
  if (num != 0xfe) {
    if (num == 0xff) {
      const tmp = current_page1;
      current_page1 = current_page2;
      current_page2 = tmp;
    } else {
      current_page1 = get_page(num);
    }
  }

  if (palette.next_palette != -1) {
    const offset = palette.next_palette * 32;
    palette.set_palette_444(offset, palette.PALETTE_TYPE.AMIGA);
    palette.set_palette_ega(offset + 1024);
    palette.set_palette_444(offset + 1024, palette.PALETTE_TYPE.VGA);
    palette.set_next_palette(-1);
  }

  canvas.update(
    buffer8,
    current_page1 * PAGE_SIZE // offset
  );
}
