import * as memory from './memory';

import { VAR } from './memory';

export enum KEY_CODE {
  UP,
  RIGHT,
  DOWN,
  LEFT,
  ACTION,
  JUMP,
  FF,
  RESET,
  PAUSE,
  CODE_SCREEN,
  REWIND,
  RESOLUTION,
  SAVE,
  LOAD,
  NEXT_PART,
  PREV_PART,
  EXIT,
}

const keyboardState: boolean[] = new Array(16).fill(false);

export function is_key_pressed(code: number) {
  return keyboardState[code];
}

export function set_key_pressed(code: KEY_CODE, state: boolean) {
  keyboardState[code] = state;
}

export function update_input() {
  let mask = 0;

  memory.vmVars[VAR.HERO_POS_LEFT_RIGHT] = 0;
  memory.vmVars[VAR.HERO_POS_JUMP_DOWN] = 0;
  memory.vmVars[VAR.HERO_POS_UP_DOWN] = 0;
  memory.vmVars[VAR.HERO_ACTION] = 0;

  if (is_key_pressed(KEY_CODE.RIGHT)) {
    memory.vmVars[VAR.HERO_POS_LEFT_RIGHT] = 1;
    mask |= 1;
  } else if (is_key_pressed(KEY_CODE.LEFT)) {
    memory.vmVars[VAR.HERO_POS_LEFT_RIGHT] = -1;
    mask |= 2;
  }

  if (is_key_pressed(KEY_CODE.DOWN)) {
    memory.vmVars[VAR.HERO_POS_JUMP_DOWN] = 1;
    memory.vmVars[VAR.HERO_POS_UP_DOWN] = 1;
    mask |= 4;
  } else if (is_key_pressed(KEY_CODE.UP)) {
    memory.vmVars[VAR.HERO_POS_JUMP_DOWN] = -1;
    memory.vmVars[VAR.HERO_POS_UP_DOWN] = -1;
    mask |= 8;
  }

  if (is_key_pressed(KEY_CODE.JUMP)) {
    memory.vmVars[VAR.HERO_POS_JUMP_DOWN] = -1;
    memory.vmVars[VAR.HERO_POS_UP_DOWN] = 0;
    mask |= 8;
  }

  memory.vmVars[VAR.HERO_POS_MASK] = mask;

  if (is_key_pressed(KEY_CODE.ACTION)) {
    memory.vmVars[VAR.HERO_ACTION] = 1;
    mask |= 0x80;
  }

  memory.vmVars[VAR.HERO_ACTION_POS_MASK] = mask;
}

export function getInputs() {
  return keyboardState.slice();
}
