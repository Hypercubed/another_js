export const KEY_UP = 1;
export const KEY_RIGHT = 2;
export const KEY_DOWN = 3;
export const KEY_LEFT = 4;
export const KEY_ACTION = 5;

let gamepadState = new Array(6);
let keyboardState = new Array(6);

function buttonPressed(b: any) {
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
    // if (actions) {
    //   if (buttonPressed(gamepad.buttons[8])) {
    //     password_screen();
    //     return true;
    //   }

    //   if (buttonPressed(gamepad.buttons[16])) {
    //     console.log(vars);
    //     return true;
    //   }

    //   if (buttonPressed(gamepad.buttons[9])) {
    //     onPauseClick();
    //     return true;
    //   }

    //   if (
    //     buttonPressed(gamepad.buttons[4]) ||
    //     buttonPressed(gamepad.buttons[6])
    //   ) {
    //     onRewindClick();
    //     return true;
    //   }
    // }

    gamepadState[KEY_UP] =
      buttonPressed(gamepad.buttons[1]) ||
      buttonPressed(gamepad.buttons[3]) ||
      buttonPressed(gamepad.buttons[12]) ||
      gamepad.axes[1] < -0.5;
    gamepadState[KEY_DOWN] =
      buttonPressed(gamepad.buttons[13]) || gamepad.axes[1] > 0.5;
    gamepadState[KEY_LEFT] =
      buttonPressed(gamepad.buttons[14]) || gamepad.axes[0] < -0.5;
    gamepadState[KEY_RIGHT] =
      buttonPressed(gamepad.buttons[15]) || gamepad.axes[0] > 0.5;
    gamepadState[KEY_ACTION] = buttonPressed(gamepad.buttons[0]);
  }
}

export function is_key_pressed(code: number) {
  return keyboardState[code] || gamepadState[code];
}

function set_key_pressed(e: KeyboardEvent, state: unknown) {
  const { keyCode } = e;

  if (keyCode == 37) {
    e.preventDefault();
    keyboardState[KEY_LEFT] = state;
  } else if (keyCode == 38) {
    e.preventDefault();
    keyboardState[KEY_UP] = state;
  } else if (keyCode == 39) {
    e.preventDefault();
    keyboardState[KEY_RIGHT] = state;
  } else if (keyCode == 40) {
    e.preventDefault();
    keyboardState[KEY_DOWN] = state;
  } else if (keyCode == 32 || keyCode == 13) {
    e.preventDefault();
    keyboardState[KEY_ACTION] = state;
  }
  // else if (keyCode == 67) {
  //   password_screen();
  // }
  // else if (keyCode == 27) {
  //   onPauseClick();
  // }
}

export function bind_events() {
  document.onkeydown = function (e) {
    set_key_pressed(e, 1);
  };
  document.onkeyup = function (e) {
    set_key_pressed(e, 0);
  };
}
