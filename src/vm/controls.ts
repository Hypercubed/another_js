export const enum KEY_CODE {
  UP = 1,
  RIGHT = 2,
  DOWN = 3,
  LEFT = 4,
  ACTION = 5,
  FF = 6
}

let gamepadState = new Array(6);
let keyboardState = new Array(6);

export function buttonPressed(b: any) {
  if (typeof b === "object") {
    return b.pressed;
  }
  return b === 1.0;
}

export function pollGamepads(actions = false) {
  const gamepads = navigator.getGamepads();
  if (!gamepads) {
    return;
  }

  const gamepad = gamepads[0];

  if (gamepad) {
    gamepadState[KEY_CODE.UP] =
      buttonPressed(gamepad.buttons[1]) ||
      buttonPressed(gamepad.buttons[12]) ||
      gamepad.axes[1] < -0.5;
    gamepadState[KEY_CODE.DOWN] =
      buttonPressed(gamepad.buttons[13]) || gamepad.axes[1] > 0.5;
    gamepadState[KEY_CODE.LEFT] =
      buttonPressed(gamepad.buttons[14]) || gamepad.axes[0] < -0.5;
    gamepadState[KEY_CODE.RIGHT] =
      buttonPressed(gamepad.buttons[15]) || gamepad.axes[0] > 0.5;
    gamepadState[KEY_CODE.ACTION] = buttonPressed(gamepad.buttons[0]);

    gamepadState[KEY_CODE.FF] = buttonPressed(gamepad.buttons[5]) || buttonPressed(gamepad.buttons[7]);
  }
}

export function is_key_pressed(code: number) {
  return keyboardState[code] || gamepadState[code];
}

function set_key_pressed(e: KeyboardEvent, state: unknown) {
  const { keyCode } = e;

  if (keyCode == 37) {
    e.preventDefault();
    keyboardState[KEY_CODE.LEFT] = state;
  } else if (keyCode == 38) {
    e.preventDefault();
    keyboardState[KEY_CODE.UP] = state;
  } else if (keyCode == 39) {
    e.preventDefault();
    keyboardState[KEY_CODE.RIGHT] = state;
  } else if (keyCode == 40) {
    e.preventDefault();
    keyboardState[KEY_CODE.DOWN] = state;
  } else if (keyCode == 32 || keyCode == 13) {
    e.preventDefault();
    keyboardState[KEY_CODE.ACTION] = state;
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
