import {
  DATA,
  isDemo,
  load,
  GAME_PART,
  partsList,
} from '../resources';

import { OP_CODE, DRAW_POLY_BACKGROUND, DRAW_POLY_SPRITE } from './opcodes';
import { BYPASS_PROTECTION, DEBUG, FPS, SCREEN_H, SCREEN_W } from './constants';

import * as palette from './palette';
import * as controls from './controls';
import * as sound from './sound';
import * as memory from './memory';
import * as video from './video';

import { VAR } from './memory';
import { KEY_CODE } from './controls';

import type { TaskState } from './memory';

export interface State {
  part: number;
  vars: number[];
  tasks: TaskState[];
  buffer8: Uint8Array;
  palette32: Uint32Array;
}

let bytecode: Uint8Array;
let polygons1: Uint8Array;
let polygons2: Uint8Array;
let bytecode_offset: number;

let task_num: number;
let task_paused: boolean;

let next_part: number;
let current_part = 0;

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
  const value = read_be_uint16(bytecode, bytecode_offset);
  bytecode_offset += 2;
  return value;
}

function to_signed(value: number, bits: number) {
  const mask = 1 << (bits - 1);
  return value - ((value & mask) << 1);
}

function execute_task() {
  while (!task_paused) {
    const opcode = read_byte();
    if (opcode & DRAW_POLY_BACKGROUND) {
      // DRAW_POLY_BACKGROUND
      const offset = (((opcode << 8) | read_byte()) << 1) & 0xfffe;
      let x = read_byte();
      let y = read_byte();
      let h = y - 199;
      if (h > 0) {
        y = 199;
        x += h;
      }
      video.draw_shape(polygons1, offset, 0xff, 64, x, y);
    } else if (opcode & DRAW_POLY_SPRITE) {
      // DRAW_POLY_SPRITE
      const offset = (read_word() << 1) & 0xfffe;
      let x = read_byte();
      if ((opcode & 0x20) == 0) {
        if ((opcode & 0x10) == 0) {
          x = (x << 8) | read_byte();
        } else {
          x = memory.vmVars[x];
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
          y = memory.vmVars[y];
        }
      }
      let polygons = polygons1;
      let zoom = 64;
      if ((opcode & 2) == 0) {
        if (opcode & 1) {
          zoom = memory.vmVars[read_byte()];
        }
      } else {
        if (opcode & 1) {
          polygons = polygons2;
        } else {
          zoom = read_byte();
        }
      }
      video.draw_shape(polygons, offset, 0xff, zoom, x, y);
    } else {
      // console.assert(opcode <= 0x1a);
      if (!vm[opcode as OP_CODE]) {
        console.log(`opcode ${opcode} not implemented`);
        bytecode_offset = -1;
        task_paused = true;
      } else {
        vm[opcode as OP_CODE]();
      }
    }
  }
}

export function run_tasks() {
  if (next_part != 0) {
    restart(next_part);
    current_part = next_part;
    next_part = 0;
  }

  for (let i = 0; i < memory.vmTasks.length; ++i) {
    memory.vmTasks[i].state = memory.vmTasks[i].next_state;
    const offset = memory.vmTasks[i].next_offset;
    if (offset != -1) {
      memory.vmTasks[i].offset = offset == -2 ? -1 : offset;
      memory.vmTasks[i].next_offset = -1;
    }
  }

  controls.pollGamepads();
  controls.update_input();
  // draw_text("Another World JS", 20, 20, 0x0f);

  for (let i = 0; i < memory.vmTasks.length; ++i) {
    if (memory.vmTasks[i].state == 0) {
      const offset = memory.vmTasks[i].offset;
      if (offset != -1) {
        bytecode_offset = offset;
        memory.vmTasks[i].stack.length = 0;
        task_num = i;
        task_paused = false;
        execute_task();
        memory.vmTasks[i].offset = bytecode_offset;
      }
    }
  }
}

function restart(part: GAME_PART, pos?: number) {
  const ResPart = partsList[part];
  if (!ResPart) {
    throw 'Part not found: ' + part;
  }

  palette.set_palette(load(ResPart[0], ResPart[1])!);
  bytecode = load(ResPart[2], ResPart[3])!;
  polygons1 = load(ResPart[4], ResPart[5])!;
  polygons2 = load(ResPart[6], ResPart[7])!;

  for (let i = 0; i < memory.vmTasks.length; ++i) {
    memory.vmTasks[i] = {
      state: 0,
      next_state: 0,
      offset: -1,
      next_offset: -1,
      stack: [],
    };
  }

  memory.vmTasks[0].offset = 0;

  if (pos !== undefined) {
    memory.vmVars[0] = pos;
  }
}

const vm = {
  [OP_CODE.movConst]() {
    const num = read_byte();
    const imm = to_signed(read_word(), 16);
    DEBUG && console.info("VirtualMachine::op_movConst(%i, %i)", num, imm);
    memory.vmVars[num] = imm;
  },
  [OP_CODE.mov]() {
    const dst = read_byte();
    const src = read_byte();
    DEBUG && console.info("VirtualMachine::op_mov(%i, %i)", dst, src);
    memory.vmVars[dst] = memory.vmVars[src];
  },
  [OP_CODE.add]() {
    const dst = read_byte();
    const src = read_byte();
    DEBUG && console.info("VirtualMachine::op_add(%i, %i)", dst, src);
    memory.vmVars[dst] += memory.vmVars[src];
  },
  [OP_CODE.addConst]() {
    // gun sound workaround
    // if (current_part === GAME_PART.BATHS) {
    //   sound.play_sound(0x5B, 1, 64, 1);
    // }

    const num = read_byte();
    const imm = to_signed(read_word(), 16);
    DEBUG && console.info("VirtualMachine::op_addConst(%i, %i)", num, imm);
    memory.vmVars[num] += imm;
  },
  [OP_CODE.call]() {
    const addr = read_word();
    memory.vmTasks[task_num].stack.push(bytecode_offset);
    DEBUG && console.info("VirtualMachine::op_call(%i)", addr);
    bytecode_offset = addr;
  },
  [OP_CODE.ret]() {
    DEBUG && console.info("VirtualMachine::op_ret()");
    bytecode_offset = memory.vmTasks[task_num].stack.pop()!;
  },
  [OP_CODE.pauseThread]() {
    DEBUG && console.info("VirtualMachine::op_pauseThread()");
    task_paused = true;
  },
  [OP_CODE.jmp]() {
    const addr = read_word();
    DEBUG && console.info("VirtualMachine::op_jmp(%i)", addr);
    bytecode_offset = addr;
  },
  [OP_CODE.setSetVect]() {
    const num = read_byte();
    const addr = read_word();
    DEBUG && console.info("VirtualMachine::op_setSetVect(%i, %i)", num, addr);
    memory.vmTasks[num].next_offset = addr;
  },
  [OP_CODE.jnz]() {
    const num = read_byte();
    memory.vmVars[num] -= 1;
    const addr = read_word();
    DEBUG && console.info("VirtualMachine::op_jnz(%i, %i)", num, addr);
    if (memory.vmVars[num] != 0) {
      bytecode_offset = addr;
    }
  },
  [OP_CODE.condJmp]() {
    const op = read_byte();
    const b = memory.vmVars[read_byte()];
    let a;
    if (op & 0x80) {
      a = memory.vmVars[read_byte()];
    } else if (op & 0x40) {
      a = to_signed(read_word(), 16);
    } else {
      a = read_byte();
    }
    const addr = read_word();
    DEBUG && console.info("VirtualMachine::op_condJmp(%i, %i, %i, %i)", op, b, a, addr);

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
  [OP_CODE.setPalette]() {
    const num = read_word();
    DEBUG && console.info("VirtualMachine::op_setPalette(%i)", num);
    palette.set_next_palette(num >> 8);
  },
  [OP_CODE.resetThread]() {
    const start = read_byte();
    const end = read_byte();
    const state = read_byte();
    DEBUG && console.info("VirtualMachine::op_resetThread(%i, %i, %i)", start, end, state);
    if (state == 2) {
      for (let i = start; i <= end; ++i) {
        memory.vmTasks[i].next_offset = -2;
      }
    } else {
      console.assert(state == 0 || state == 1);
      for (let i = start; i <= end; ++i) {
        memory.vmTasks[i].next_state = state;
      }
    }
  },
  [OP_CODE.selectVideoPage]() {
    const num = read_byte();
    DEBUG && console.info("VirtualMachine::op_selectVideoPage(%i)", num);
    video.set_page(0, video.get_page(num))
  },
  [OP_CODE.fillVideoPage]() {
    const num = read_byte();
    const color = read_byte();
    DEBUG && console.info("VirtualMachine::op_fillVideoPage(%i, %i)", num, color);
    video.fill_page(num, color);
  },
  [OP_CODE.copyVideoPage]() {
    const src = read_byte();
    const dst = read_byte();
    DEBUG && console.info("VirtualMachine::op_copyVideoPage(%i, %i)", src, dst);
    video.copy_page(src, dst, memory.vmVars[VAR.SCROLL_Y]);
  },
  [OP_CODE.blitFramebuffer]() {
    sleep();

    const pageId = read_byte();
    DEBUG && console.info("VirtualMachine::op_blitFramebuffer(%i)", pageId);
    memory.vmVars[VAR.WTF] = 0;
    video.update_display(pageId);
  },
  [OP_CODE.killThread]() {
    DEBUG && console.info("VirtualMachine::op_killThread()");
    bytecode_offset = -1;
    task_paused = true;
  },
  [OP_CODE.drawString]() {
    const num = read_word();
    const x = read_byte();
    const y = read_byte();
    const color = read_byte();
    DEBUG && console.info("VirtualMachine::op_drawString(%i, %i, %i, %i)", num, x, y, color);
    video.draw_string(num, color, x, y);
  },
  [OP_CODE.sub]() {
    const dst = read_byte();
    const src = read_byte();
    DEBUG && console.info("VirtualMachine::op_sub(%i, %i)", dst, src);
    memory.vmVars[dst] -= memory.vmVars[src];
  },
  [OP_CODE.and]() {
    const num = read_byte();
    const imm = read_word();
    DEBUG && console.info("VirtualMachine::op_and(%i, %i)", num, imm);
    memory.vmVars[num] = to_signed(memory.vmVars[num] & imm & 0xffff, 16);
  },
  [OP_CODE.or]() {
    const num = read_byte();
    const imm = read_word();
    DEBUG && console.info("VirtualMachine::op_or(%i, %i)", num, imm);
    memory.vmVars[num] = to_signed((memory.vmVars[num] | imm) & 0xffff, 16);
  },
  [OP_CODE.shl]() {
    const num = read_byte();
    const imm = read_word() & 15;
    DEBUG && console.info("VirtualMachine::op_shl(%i, %i)", num, imm);
    memory.vmVars[num] = to_signed((memory.vmVars[num] << imm) & 0xffff, 16);
  },
  [OP_CODE.shr]() {
    const num = read_byte();
    const imm = read_word() & 15;
    DEBUG && console.info("VirtualMachine::op_shr(%i, %i)", num, imm);
    memory.vmVars[num] = to_signed((memory.vmVars[num] & 0xffff) >> imm, 16);
  },
  [OP_CODE.playSound]() {
    const num = read_word();
    const freq = read_byte();
    const volume = read_byte();
    const channel = read_byte();
    DEBUG && console.info("VirtualMachine::op_playSound(%i, %i, %i, %i)", num, freq, volume, channel);
    sound.play_sound(num, freq, volume, channel);
  },
  [OP_CODE.updateMemList]() {
    const num = read_word();
    DEBUG && console.info("VirtualMachine::op_updateMemList(%i)", num);
    if (num > GAME_PART.PROTECTION) {
      next_part = num;
    } else if (num in DATA!.bitmaps) {
      if (num >= 3000) {
        // should also load t3%d.bmp files for transparency (color 0x10)
        const bitmap = DATA.bitmaps[num] as string[];
        palette.set_palette_bmp(load(bitmap[0], 256 * 3)!);
        video.buffer8.set(load(bitmap[1], SCREEN_W * SCREEN_H)!);
      } else {
        video.draw_bitmap(num);
      }
    }
  },
  [OP_CODE.playMusic]() {
    const num = read_word();
    const period = read_word();
    const position = read_byte();
    DEBUG && console.info("VirtualMachine::op_playMusic(%i, %i, %i)", num, period, position);
    sound.play_music(num, period, position);
  },
};

function sleep() {
  const fastMode = controls.is_key_pressed(KEY_CODE.FF);

  if (!fastMode && memory.vmVars[VAR.PAUSE_SLICES] !== 0) {
    const delay = Date.now() - timestamp;

    // The bytecode will set vmVariables[VM_VARIABLE_PAUSE_SLICES] from 1 to 5
    // The virtual machine hence indicate how long the image should be displayed.
    const timeToSleep =
      (memory.vmVars[VAR.PAUSE_SLICES] * 1000) / FPS - delay;

    if (timeToSleep > 0) {
      const t = timestamp + timeToSleep;
      while (timestamp < t) {
        timestamp = Date.now();
      }
    }
  }

  timestamp = Date.now();
}

// PUBLIC API
export function get_state(): State {
  return {
    part: current_part,
    vars: memory.vmVars.slice(),
    tasks: JSON.parse(JSON.stringify(memory.vmTasks)),
    buffer8: video.buffer8.slice(),
    palette32: palette.palette32.slice(),
  };
}

export function restore_state(state: State) {
  memory.vmVars.splice(0, memory.vmVars.length, ...state.vars);
  memory.vmTasks.splice(0, memory.vmTasks.length, ...state.tasks);
  video.buffer8.set(state.buffer8);
  palette.set_palette32(state.palette32);
}

export function reset() {
  video.set_page(2, 1);
  video.set_page(1, 2);
  video.set_page(0, video.get_page(0xfe));

  video.buffer8.fill(0);
  palette.set_next_palette(-1);
  memory.vmVars.fill(0);

  memory.vmVars[VAR.RANDOM_SEED] = Date.now();
  // memory.vmVars[VAR.HACK_VAR_54] = 0x0081;

  if (BYPASS_PROTECTION) {
    memory.vmVars[VAR.HACK_VAR_BC] = 0x10;
    memory.vmVars[VAR.HACK_VAR_C6] = 0x80;
    memory.vmVars[VAR.HACK_VAR_F2] = 4000; // 4000 for Amiga bytecode
    memory.vmVars[VAR.HACK_VAR_DC] = 33;
  }
  memory.vmVars[VAR.HACK_VAR_E4] = 20;

  next_part =
    (isDemo || BYPASS_PROTECTION) ? GAME_PART.INTRODUCTION : GAME_PART.PROTECTION;
  sound.player?.stopMusic();
}

export function change_part(num: number, pos = 0) {
  next_part = num;
  restart(next_part, pos);
  current_part = next_part;
  next_part = 0;
}
