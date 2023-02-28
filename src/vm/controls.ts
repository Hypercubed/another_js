import * as memory from "./memory";

import { VAR } from "./memory";

export const enum KEY_CODE {
  UP = 1,
  RIGHT = 2,
  DOWN = 3,
  LEFT = 4,
  ACTION = 5,
  JUMP = 6,
  FF = 7,
}

let gamepadState = new Array(6);
let keyboardState = new Array(6);

export function buttonPressed(b: any) {
  if (typeof b === "object") {
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
  }
}

export function is_key_pressed(code: number) {
  return keyboardState[code] || gamepadState[code];
}

const controls = {
  " ": KEY_CODE.ACTION,
  Enter: KEY_CODE.ACTION,
  Shift: KEY_CODE.JUMP,
  ArrowUp: KEY_CODE.UP,
  ArrowDown: KEY_CODE.DOWN,
  ArrowLeft: KEY_CODE.LEFT,
  ArrowRight: KEY_CODE.RIGHT,
  f: KEY_CODE.FF,
};

function set_key_pressed(e: KeyboardEvent, state: unknown) {
  console.log(e.key);

  if (e.key in controls) {
    e.preventDefault();
    const code: KEY_CODE = controls[e.key as keyof typeof controls];
    keyboardState[code] = state;
  }
}

export function bind_events() {
  document.onkeydown = function (e) {
    set_key_pressed(e, 1);
  };
  document.onkeyup = function (e) {
    set_key_pressed(e, 0);
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
  } else if (is_key_pressed(KEY_CODE.LEFT)) {
    memory.vmVars[VAR.HERO_POS_LEFT_RIGHT] = -1;
    mask |= 2;
  }

  if (is_key_pressed(KEY_CODE.DOWN)) {
    memory.vmVars[VAR.HERO_POS_UP_DOWN] = 1;
    mask |= 4;
  } else if (is_key_pressed(KEY_CODE.UP)) {
    memory.vmVars[VAR.HERO_POS_UP_DOWN] = -1;
    mask |= 8;
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
