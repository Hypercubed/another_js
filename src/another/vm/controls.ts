import { isDemo } from '../resources';
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
  PREV_PART
}

const gamepadState: boolean[] = new Array(16).fill(false);
const keyboardState: boolean[] = new Array(16).fill(false);

export function buttonPressed(b: any) {
  if (typeof b === 'object') {
    return b.pressed;
  }
  return b === 1.0;
}

export function pollGamepads() {
  const gamepads = navigator.getGamepads();
  if (!gamepads) {
    return;
  }

  const gamepad = gamepads[0];

  if (gamepad) {
    gamepadState[KEY_CODE.UP] = gamepad.axes[1] < -0.5;
    gamepadState[KEY_CODE.DOWN] = gamepad.axes[1] > 0.5;
    gamepadState[KEY_CODE.LEFT] = gamepad.axes[0] < -0.5;
    gamepadState[KEY_CODE.RIGHT] = gamepad.axes[0] > 0.5;

    gamepadState[KEY_CODE.JUMP] = buttonPressed(gamepad.buttons[1]);
    gamepadState[KEY_CODE.ACTION] = buttonPressed(gamepad.buttons[0]);

    gamepadState[KEY_CODE.FF] =
      buttonPressed(gamepad.buttons[5]) || buttonPressed(gamepad.buttons[7]);

    gamepadState[KEY_CODE.REWIND] = buttonPressed(gamepad.buttons[4]);
    gamepadState[KEY_CODE.PAUSE] = buttonPressed(gamepad.buttons[9]);
    gamepadState[KEY_CODE.CODE_SCREEN] = buttonPressed(gamepad.buttons[8]);
    gamepadState[KEY_CODE.RESOLUTION] = buttonPressed(gamepad.buttons[3]);

    gamepadState[KEY_CODE.LOAD] = buttonPressed(gamepad.buttons[6]);
    gamepadState[KEY_CODE.SAVE] = buttonPressed(gamepad.buttons[7]);

    gamepadState[KEY_CODE.NEXT_PART] = buttonPressed(gamepad.buttons[12]);
    gamepadState[KEY_CODE.PREV_PART] = buttonPressed(gamepad.buttons[13]);
  }
}

export function is_key_pressed(code: number) {
  return keyboardState[code] || gamepadState[code];
}

const controls = {
  ' ': KEY_CODE.ACTION,
  'Enter': KEY_CODE.ACTION,
  'Shift': KEY_CODE.JUMP,
  'ArrowUp': KEY_CODE.UP,
  'ArrowDown': KEY_CODE.DOWN,
  'ArrowLeft': KEY_CODE.LEFT,
  'ArrowRight': KEY_CODE.RIGHT,
  'f': KEY_CODE.FF,
  'r': KEY_CODE.RESET,
  'p': KEY_CODE.PAUSE,
  'c': KEY_CODE.CODE_SCREEN
};

function set_key_pressed(e: KeyboardEvent, state: boolean) {
  if (e.key in controls) {
    e.preventDefault();
    const code: KEY_CODE = controls[e.key as keyof typeof controls];
    keyboardState[code] = state;
  }
}

export function bind_events() {
  document.onkeydown = function (e) {
    set_key_pressed(e, true);
  };
  document.onkeyup = function (e) {
    set_key_pressed(e, false);
  };
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
  }

  if (is_key_pressed(KEY_CODE.LEFT)) {
    memory.vmVars[VAR.HERO_POS_LEFT_RIGHT] = -1;
    mask |= 2;
  }

  if (isDemo) {
    if ( is_key_pressed( KEY_CODE.DOWN ) ) {
      memory.vmVars[ VAR.HERO_POS_JUMP_DOWN ] = 1;
      memory.vmVars[ VAR.HERO_POS_UP_DOWN ] = 1;
      mask |= 4;
    }

    if ( is_key_pressed(KEY_CODE.UP ) ) {
      memory.vmVars[ VAR.HERO_POS_JUMP_DOWN ] = -1;
      memory.vmVars[ VAR.HERO_POS_UP_DOWN ] = -1;
      mask |= 8;
    }
  } else {
    if (is_key_pressed(KEY_CODE.DOWN)) {
      memory.vmVars[VAR.HERO_POS_UP_DOWN] = 1;
      mask |= 4;
    }
    if (is_key_pressed(KEY_CODE.UP)) {
      memory.vmVars[VAR.HERO_POS_UP_DOWN] = -1;
      mask |= 8;
    }
  }

  if (is_key_pressed(KEY_CODE.JUMP)) {
    memory.vmVars[VAR.HERO_POS_JUMP_DOWN] = -1;
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
  return keyboardState.map((v, i) => {
    return v || gamepadState[i];
  });
}
