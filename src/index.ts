import "./main.css";
import {
  change_language,
  change_palette,
  change_part,
  initVm,
  password_screen,
  pause,
  reset,
  rewind,
  set_1991_resolution,
} from "./vm";
import { enterFullscreen } from "./vm/canvas";
import { buttonPressed } from "./vm/controls";

const game = document.getElementById("game");
const start = document.getElementById("start");
const preload = document.getElementById("preload");

const pauseButton = document.getElementById("pauseButton") as HTMLButtonElement;
const resetButton = document.getElementById("resetButton") as HTMLButtonElement;
const rewindButton = document.getElementById(
  "rewindButton"
) as HTMLButtonElement;
const passwordButton = document.getElementById(
  "passwordButton"
) as HTMLButtonElement;
const languageSelect = document.getElementById("languageSelect");
const paletteSelect = document.getElementById("paletteSelect");
const partSelect = document.getElementById("partSelect");
const resolutionCheckbox = document.getElementById("resolutionCheckbox");

function onPause() {
  if (pause()) {
    pauseButton.value = "Play";
  } else {
    pauseButton.value = "Pause";
  }
}

let started = false;

function onStart() {
  if (started) {
    return;
  }

  preload.style.display = "none";
  game.style.display = "block";
  initVm("screen");
  started = true;
}

pauseButton.addEventListener("click", onPause);
resetButton.addEventListener("click", reset);
rewindButton.addEventListener("click", rewind);
passwordButton.addEventListener("click", password_screen);

languageSelect.addEventListener("change", (e: any) => {
  change_language(e.currentTarget.selectedIndex);
});

paletteSelect.addEventListener("change", (e: any) => {
  change_palette(e.currentTarget.selectedIndex);
});

partSelect.addEventListener("change", (e: any) => {
  change_part(+e.target.value);
});

resolutionCheckbox.addEventListener("click", (e: any) => {
  set_1991_resolution(e.currentTarget.checked);
});

game.addEventListener("dblclick", enterFullscreen);
start.addEventListener("click", onStart);

function bind_events() {
  document.addEventListener("keyup", (e) => {
    // console.log(e.key);

    if (e.key  === 'Escape') {
      onPause();
    } else if (e.key === 'c') {
      password_screen();
    } else if (e.key === ' ' || e.key === 'Enter') {
      onStart();
    } else if (e.key === 'r') {
      reset();
    // }
    // else if (e.key === 's') {
    //   reset();
    } else if (e.key === 'i') {
      change_part(1);
    }
  });

  window.addEventListener("gamepadconnected", connectGamepad, false);
  window.addEventListener("gamepaddisconnected", disconnectGamepad);
}

bind_events();

let raf: number;

function disconnectGamepad() {
  cancelAnimationFrame(raf);
}

function connectGamepad() {
  onStart();
  raf = requestAnimationFrame(gameLoop);
}

let pausePressed = false;
let rewindPressed = false;
let resolutionPressed = false;
let is_1991 = false;

function gameLoop() {
  const gamepads = navigator.getGamepads();
  if (!gamepads) {
    return;
  }

  const gamepad = gamepads[0];

  if (gamepad) {
      if (buttonPressed(gamepad.buttons[8])) {
        password_screen();
      }

      if (buttonPressed(gamepad.buttons[16])) {
        reset();
      }

      if (
        buttonPressed(gamepad.buttons[3])
      ) {
        resolutionPressed = true;
      } else if (resolutionPressed) {
        resolutionPressed = false;
        is_1991 = !is_1991;
        set_1991_resolution(is_1991);
      }

      if (buttonPressed(gamepad.buttons[9])) {
        pausePressed = true;
      } else if (pausePressed) {
        pausePressed = false;
        onPause();
      }

      if (
        buttonPressed(gamepad.buttons[4]) ||
        buttonPressed(gamepad.buttons[6])
      ) {
        rewindPressed = true;
      } else if (rewindPressed){
        rewindPressed = false;
        rewind();
      }
  }

  raf = requestAnimationFrame(gameLoop);
}


