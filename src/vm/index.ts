import { decompressSync } from "fflate";

import * as DATA from "../data";
import { SfxPlayer } from "../audio-modules/sound";
import { init_canvas, update_screen } from "./canvas";
import {
  PALETTE_EGA,
  PALETTE_TYPE_AMIGA,
  PALETTE_TYPE_EGA,
  PALETTE_TYPE_VGA,
} from "./palette";
import { _freqTable } from "./sound";
import {
  bind_events,
  is_key_pressed,
  KEY_ACTION,
  KEY_DOWN,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_UP,
  pollGamepads,
} from "./controls";

const STRINGS_LANGUAGE_EN = 0;
const STRINGS_LANGUAGE_FR = 1;

let strings_language = STRINGS_LANGUAGE_EN;

const REWIND_SIZE = 10;
const REWIND_INTERVAL = 1000;

// let save_states = new Map();
let rewind_buffer = new Array();
let rewind_timestamp: number;

const INTERVAL = 50;

let timer: number;

const SCALE = 2;
const SCREEN_W = 320 * SCALE;
const SCREEN_H = 200 * SCALE;
const PAGE_SIZE = SCREEN_W * SCREEN_H;

let is_1991: boolean; // 320x200
let palette_type = PALETTE_TYPE_AMIGA;

let palette32 = new Uint32Array(16 * 3); // Amiga, EGA, VGA
let palette: Uint8Array;
let buffer8 = new Uint8Array(4 * PAGE_SIZE);
let current_page0: number; // current
let current_page1: number; // front
let current_page2: number; // back
let next_palette = -1;

const VAR_HERO_POS_UP_DOWN = 0xe5;
const VAR_SCROLL_Y = 0xf9;
const VAR_HERO_ACTION = 0xfa;
const VAR_HERO_POS_JUMP_DOWN = 0xfb;
const VAR_HERO_POS_LEFT_RIGHT = 0xfc;
const VAR_HERO_POS_MASK = 0xfd;
const VAR_HERO_ACTION_POS_MASK = 0xfe;
const VAR_PAUSE_SLICES = 0xff;
// const VAR_MUSIC_SYNC           = 0xf4;

let vars = new Array(256);
let tasks = new Array(64);

let bytecode: Uint8Array;
let polygons1: Uint8Array;
let polygons2: Uint8Array;
let bytecode_offset: number;
let task_num: number;
let task_paused: boolean;

let next_part: number;
let current_part = 0;

let delay = 0;
let timestamp: number;

function read_byte(): number {
  const value = bytecode[bytecode_offset];
  bytecode_offset += 1;
  return value;
}

function read_be_uint16(buf: any, offset: number) {
  return (buf[offset] << 8) | buf[offset + 1];
}

function read_word() {
  // const value = ( bytecode[ bytecode_offset ] << 8) | bytecode[ bytecode_offset + 1 ];
  const value = read_be_uint16(bytecode, bytecode_offset);
  bytecode_offset += 2;
  return value;
}

function to_signed(value: number, bits: number) {
  const mask = 1 << (bits - 1);
  return value - ((value & mask) << 1);
}

const opcodes = {
  0x00: function () {
    const num = read_byte();
    const imm = to_signed(read_word(), 16);
    // console.log(`Script::op_movConst(0x%${num.toString(16)}, ${imm})`)
    vars[num] = imm;
  },
  0x01: function () {
    const dst = read_byte();
    const src = read_byte();
    vars[dst] = vars[src];
  },
  0x02: function () {
    const dst = read_byte();
    const src = read_byte();
    vars[dst] += vars[src];
  },
  0x03: function () {
    const num = read_byte();
    const imm = to_signed(read_word(), 16);
    vars[num] += imm;
    // gun sound workaround to do
    if (current_part === 16006) {
      // debugger
      // snd_playSound(0x5B, 1, 64, 1);
    }
  },
  0x04: function () {
    // call
    const addr = read_word();
    // console.log(`Script::op_call(0x${addr.toString(16)})`);
    tasks[task_num].stack.push(bytecode_offset);
    bytecode_offset = addr;
  },
  0x05: function () {
    // ret
    // console.log(`Script::op_ret()`)
    bytecode_offset = tasks[task_num].stack.pop();
  },
  0x06: function () {
    // yield
    // console.log(`Script::op_yieldTask()`)
    task_paused = true;
  },
  0x07: function () {
    // jmp
    bytecode_offset = read_word();
  },
  0x08: function () {
    // install_task
    const num = read_byte();
    const addr = read_word();
    // console.log(`Script::op_installTask(0x${num.toString(16)}, 0x${addr.toString(16)})`)
    tasks[num].next_offset = addr;
  },
  0x09: function () {
    // jmp_nz
    const num = read_byte();
    vars[num] -= 1;
    const addr = read_word();
    if (vars[num] != 0) {
      bytecode_offset = addr;
    }
  },
  0x0a: function () {
    // jmp_cond
    const op = read_byte();
    const b = vars[read_byte()];
    let a;
    if (op & 0x80) {
      a = vars[read_byte()];
    } else if (op & 0x40) {
      a = to_signed(read_word(), 16);
    } else {
      a = read_byte();
    }
    const addr = read_word();
    switch (op & 7) {
      case 0:
        if (b == a) {
          bytecode_offset = addr;
        }
        break;
      case 1:
        if (b != a) {
          bytecode_offset = addr;
        }
        break;
      case 2:
        if (b > a) {
          bytecode_offset = addr;
        }
        break;
      case 3:
        if (b >= a) {
          bytecode_offset = addr;
        }
        break;
      case 4:
        if (b < a) {
          bytecode_offset = addr;
        }
        break;
      case 5:
        if (b <= a) {
          bytecode_offset = addr;
        }
        break;
    }
  },
  0x0b: function () {
    // set_palette
    next_palette = read_word() >> 8;
  },
  0x0c: function () {
    // change_tasks_state
    const start = read_byte();
    const end = read_byte();
    const state = read_byte();
    if (state == 2) {
      for (let i = start; i <= end; ++i) {
        tasks[i].next_offset = -2;
      }
    } else {
      console.assert(state == 0 || state == 1);
      for (let i = start; i <= end; ++i) {
        tasks[i].next_state = state;
      }
    }
  },
  0x0d: function () {
    // select_page
    select_page(read_byte());
  },
  0x0e: function () {
    // fill_page
    const num = read_byte();
    const color = read_byte();
    fill_page(num, color);
  },
  0x0f: function () {
    // copy_page
    const src = read_byte();
    const dst = read_byte();
    copy_page(src, dst, vars[VAR_SCROLL_Y]);
  },
  0x10: function () {
    // update_display
    const num = read_byte();
    delay += (vars[VAR_PAUSE_SLICES] * 1000) / 50;
    //console.log( 'delay:' + delay );
    vars[0xf7] = 0;
    update_display(num);
  },
  0x11: function () {
    // remove_task
    bytecode_offset = -1;
    task_paused = true;
  },
  0x12: function () {
    // draw_string
    const num = read_word();
    const x = read_byte();
    const y = read_byte();
    const color = read_byte();
    draw_string(num, color, x, y);
  },
  0x13: function () {
    // sub
    const dst = read_byte();
    const src = read_byte();
    vars[dst] -= vars[src];
  },
  0x14: function () {
    // and
    const num = read_byte();
    const imm = read_word();
    vars[num] = to_signed(vars[num] & imm & 0xffff, 16);
  },
  0x15: function () {
    // or
    const num = read_byte();
    const imm = read_word();
    vars[num] = to_signed((vars[num] | imm) & 0xffff, 16);
  },
  0x16: function () {
    // shl
    const num = read_byte();
    const imm = read_word() & 15;
    vars[num] = to_signed((vars[num] << imm) & 0xffff, 16);
  },
  0x17: function () {
    // shr
    const num = read_byte();
    const imm = read_word() & 15;
    vars[num] = to_signed((vars[num] & 0xffff) >> imm, 16);
  },
  0x18: function () {
    // play_sound
    const num = read_word();
    const freq = read_byte();
    const volume = read_byte();
    const channel = read_byte();
    play_sound(num, freq, volume, channel);
  },
  0x19: function () {
    // load_resource
    const num = read_word();
    if (num > 16000) {
      next_part = num;
    } else if (num in DATA.bitmaps) {
      if (num >= 3000) {
        // should also load t3%d.bmp files for transparency (color 0x10)
        const bitmap = DATA.bitmaps[num] as any;
        set_palette_bmp(load(bitmap[0], 256 * 3));
        buffer8.set(load(bitmap[1], SCREEN_W * SCREEN_H));
      } else {
        draw_bitmap(num);
      }
    }
  },
  0x1a: function () {
    // play_music
    const num = read_word();
    const period = read_word();
    const position = read_byte();
    // console.log(`Script::op_playMusic(0x${num.toString(16)}, ${period}, ${position})`)
    play_music(num, period, position);
  },
};

function execute_task() {
  while (!task_paused) {
    const opcode = read_byte();
    if (opcode & 0x80) {
      const offset = (((opcode << 8) | read_byte()) << 1) & 0xfffe;
      let x = read_byte();
      let y = read_byte();
      let h = y - 199;
      if (h > 0) {
        y = 199;
        x += h;
      }
      draw_shape(polygons1, offset, 0xff, 64, x, y);
    } else if (opcode & 0x40) {
      const offset = (read_word() << 1) & 0xfffe;
      let x = read_byte();
      if ((opcode & 0x20) == 0) {
        if ((opcode & 0x10) == 0) {
          x = (x << 8) | read_byte();
        } else {
          x = vars[x];
        }
      } else {
        if (opcode & 0x10) {
          x += 256;
        }
      }
      let y = read_byte();
      if ((opcode & 8) == 0) {
        if ((opcode & 4) == 0) {
          y = (y << 8) | read_byte();
        } else {
          y = vars[y];
        }
      }
      let polygons = polygons1;
      let zoom = 64;
      if ((opcode & 2) == 0) {
        if (opcode & 1) {
          zoom = vars[read_byte()];
        }
      } else {
        if (opcode & 1) {
          polygons = polygons2;
        } else {
          zoom = read_byte();
        }
      }
      draw_shape(polygons, offset, 0xff, zoom, x, y);
    } else {
      //console.log( 'task_num:' + task_num + ' bytecode_offset:' + bytecode_offset + ' opcode:' + opcode );
      console.assert(opcode <= 0x1a);
      (opcodes as any)[opcode]();
    }
  }
}

function update_input() {
  pollGamepads();

  let mask = 0;
  if (is_key_pressed(KEY_RIGHT)) {
    vars[VAR_HERO_POS_LEFT_RIGHT] = 1;
    mask |= 1;
  } else if (is_key_pressed(KEY_LEFT)) {
    vars[VAR_HERO_POS_LEFT_RIGHT] = -1;
    mask |= 2;
  } else {
    vars[VAR_HERO_POS_LEFT_RIGHT] = 0;
  }
  if (is_key_pressed(KEY_DOWN)) {
    vars[VAR_HERO_POS_JUMP_DOWN] = 1;
    vars[VAR_HERO_POS_UP_DOWN] = 1;
    mask |= 4;
  } else if (is_key_pressed(KEY_UP)) {
    vars[VAR_HERO_POS_JUMP_DOWN] = -1;
    vars[VAR_HERO_POS_UP_DOWN] = -1;
    mask |= 8;
  } else {
    vars[VAR_HERO_POS_JUMP_DOWN] = 0;
    vars[VAR_HERO_POS_UP_DOWN] = 0;
  }
  vars[VAR_HERO_POS_MASK] = mask;
  if (is_key_pressed(KEY_ACTION)) {
    vars[VAR_HERO_ACTION] = 1;
    mask |= 0x80;
  } else {
    vars[VAR_HERO_ACTION] = 0;
  }
  vars[VAR_HERO_ACTION_POS_MASK] = mask;
}

function run_tasks() {
  if (next_part != 0) {
    restart(next_part);
    current_part = next_part;
    next_part = 0;
  }
  for (let i = 0; i < tasks.length; ++i) {
    tasks[i].state = tasks[i].next_state;
    const offset = tasks[i].next_offset;
    if (offset != -1) {
      tasks[i].offset = offset == -2 ? -1 : offset;
      tasks[i].next_offset = -1;
    }
  }

  update_input();

  for (let i = 0; i < tasks.length; ++i) {
    if (tasks[i].state == 0) {
      const offset = tasks[i].offset;
      if (offset != -1) {
        bytecode_offset = offset;
        tasks[i].stack.length = 0;
        task_num = i;
        task_paused = false;
        execute_task();
        tasks[i].offset = bytecode_offset;
      }
    }
  }
}

function load(data: string, size: number) {
  if (!data) return null;

  data = atob(data);
  if (data.length != size) {
    let len = data.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = data.charCodeAt(i);
    }
    let buf = decompressSync(bytes);
    console.assert(buf.length == size);
    return buf;
  }

  let buf = new Uint8Array(size);
  for (let i = 0; i < data.length; ++i) {
    buf[i] = data.charCodeAt(i) & 0xff;
  }
  return buf;
}

function restart(part: number) {
  const ResPart = DATA.PARTS[part];
  if (!ResPart) {
    throw "Part not found: " + part;
  }

  palette = load(ResPart[0], ResPart[1]);
  bytecode = load(ResPart[2], ResPart[3]);
  polygons1 = load(ResPart[4], ResPart[5]);
  polygons2 = load(ResPart[6], ResPart[7]);

  for (let i = 0; i < tasks.length; ++i) {
    tasks[i] = { state: 0, next_state: 0, offset: -1, next_offset: -1 };
    tasks[i].stack = new Array();
  }
  tasks[0].offset = 0;
}

function get_page(num: number): number {
  if (num == 0xff) {
    return current_page2;
  } else if (num == 0xfe) {
    return current_page1;
  } else {
    console.assert(num < 4);
    return num;
  }
}

function select_page(num: number) {
  // console.log(`Script::op_selectPage(${num})`)
  current_page0 = get_page(num);
}

function fill_page(num: number, color: number) {
  // console.log(`Script::op_fillPage(${num}, ${color})`)
  num = get_page(num);
  buffer8.fill(color, num * PAGE_SIZE, (num + 1) * PAGE_SIZE);
}

function copy_page(src: number, dst: number, vscroll: number) {
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
    console.assert(page != 0);
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

function draw_shape(
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
      const mask = DATA.font[(chr - 32) * 8 + j];
      for (let i = 0; i < 8; ++i) {
        if ((mask & (1 << (7 - i))) != 0) {
          put_pixel(page, x * 8 + i, y + j, color);
        }
      }
    }
  }
}

function draw_string(num: number, color: number, x: number, y: number) {
  let strings: Record<string, string> = DATA.strings_en;
  if (strings_language == STRINGS_LANGUAGE_FR && num in DATA.strings_fr) {
    strings = DATA.strings_fr;
  }
  if (num in strings) {
    const x0 = x;
    const str = strings[num];
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
}

function draw_bitmap(num: number) {
  const bitmap = DATA.bitmaps[num] as any;
  const size = bitmap[1];
  console.assert(size == 32000);
  const buf = load(bitmap[0], size);
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

function update_display(num: number) {
  // console.log(`Script::op_updateDisplay(${num})`)
  if (num != 0xfe) {
    if (num == 0xff) {
      const tmp = current_page1;
      current_page1 = current_page2;
      current_page2 = tmp;
    } else {
      current_page1 = get_page(num);
    }
  }
  if (next_palette != -1) {
    const offset = next_palette * 32;
    set_palette_444(offset, PALETTE_TYPE_AMIGA);
    set_palette_ega(offset + 1024);
    set_palette_444(offset + 1024, PALETTE_TYPE_VGA);
    next_palette = -1;
  }

  update_screen(
    buffer8,
    palette32,
    palette_type,
    palette_bmp,
    current_page1 * PAGE_SIZE, // offset
    is_1991
  );
}

function save_state() {
  return {
    vars: vars.slice(),
    tasks: JSON.parse(JSON.stringify(tasks)),
    buffer8: buffer8.slice(),
    palette32: palette32.slice(),
  };
}

function load_state(state: any) {
  vars = state.vars;
  tasks = state.tasks;
  buffer8 = state.buffer8;
  palette32 = state.palette32;
}

export function reset() {
  current_page2 = 1;
  current_page1 = 2;
  current_page0 = get_page(0xfe);
  buffer8.fill(0);
  next_palette = -1;
  vars.fill(0);
  vars[0xbc] = 0x10;
  vars[0xc6] = 0x80;
  vars[0xf2] = 6000; // 4000 for Amiga bytecode
  vars[0xdc] = 33;
  vars[0xe4] = 20;
  next_part = DATA.isDemo ? 16001 : 16000;
  timestamp = rewind_timestamp = Date.now();
  rewind_buffer.length = 0;
  player.stopMusic();
}

function tick() {
  const current = Date.now();
  delay -= current - timestamp;
  while (delay <= 0) {
    run_tasks();
  }
  timestamp = current;

  if (rewind_timestamp + REWIND_INTERVAL < current) {
    if (rewind_buffer.length == REWIND_SIZE) {
      rewind_buffer.shift();
    }
    rewind_buffer.push(save_state());
    rewind_timestamp = current;
  }

  pollGamepads(true);
}

function load_modules() {
  Object.entries(DATA.modules).forEach(([, module]: any[]) => {
    const [data, size] = module;
    module.push(load(data, size));
  });
}

function load_sounds() {
  Object.entries(DATA.sounds).forEach(([, sound]: any[]) => {
    const [data, size] = sound;
    sound.push(load(data, size));
  });
}

// METHODS
export function pause() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    player.pause();
    return true;
  }
  // reset timestamp otherwise engine
  // would skip <pause duration> time
  timestamp = Date.now();
  timer = setInterval(tick, INTERVAL) as unknown as number;
  player.resume();
  return false;
}

export function rewind() {
  if (rewind_buffer.length != 0) {
    // console.log( 'rewind pos:' + rewind_buffer.length );
    let state = rewind_buffer.pop();
    load_state(state);
  }
}

export function change_palette(num: number) {
  palette_type = num;
}

export function change_part(num: number) {
  next_part = 16000 + num;
  restart(next_part);
  current_part = next_part;
  next_part = 0;
}

export function password_screen() {
  change_part(8);
}

export function change_language(num: number) {
  strings_language = num;
}

export function set_1991_resolution(low: boolean) {
  is_1991 = low;
}

export async function initVm(name: string) {
  init_canvas(name, SCREEN_W, SCREEN_H, SCALE);

  await init_sounds();
  bind_events();
  load_modules();

  reset();
  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(tick, INTERVAL) as unknown as number;
}

// PALETTE
let palette_bmp = new Uint32Array(256 * 3); // 15th edition backgrounds

function set_palette_ega(offset: number) {
  for (let i = 0; i < 16; ++i) {
    let color = (palette[offset + i * 2] << 8) | palette[offset + i * 2 + 1];
    color = ((color >> 12) & 15) * 3;
    palette32[PALETTE_TYPE_EGA * 16 + i] =
      0xff000000 |
      (PALETTE_EGA[color + 2] << 16) |
      (PALETTE_EGA[color + 1] << 8) |
      PALETTE_EGA[color];
  }
}

function set_palette_444(offset: number, type: number) {
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

function set_palette_bmp(data: Uint8Array) {
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

// SOUNDS
let player: SfxPlayer;

async function init_sounds() {
  player = new SfxPlayer((variable: number, value: number) => {
    vars[variable] = value;
  });
  await player.init();
  load_sounds();
}

function play_music(resNum: number, delay: number, pos: number) {
  if (resNum !== 0) {
    // _ply->loadSfxModule(resNum, delay, pos);
    player.loadSfxModule(resNum, delay, pos, DATA);
    player.startMusic();
    player.playMusic();
  } else if (delay !== 0) {
    player.setEventsDelay(delay, true);
  } else {
    player.stopMusic();
  }
}

function play_sound(
  resNum: number,
  freq: number,
  vol: number,
  channel: number
) {
  if (vol === 0) {
    player.stopSoundChannel(channel);
    return;
  }
  if (vol > 63) {
    vol = 63;
  }
  try {
    if (DATA.sounds[resNum]) {
      const [, , me] = DATA.sounds[resNum] as any;
      if (me) {
        // assert(freq < 40);
        if (freq >= 40) {
          console.error(`Assertion failed: $({freq} < 40`);
        }
        player.playSoundRaw(channel & 3, me, _freqTable[freq], vol);
      }
    }
  } catch (e) {
    console.error(`Could not play raw sound ${resNum}`);
    debugger;
  }
}
