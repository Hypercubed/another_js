import "./main.css";
import {
  changeLang,
  setPallet,
  initVm,
  loadVm,
  passwordScreen,
  pauseVm,
  resetVm,
  rewindVm,
  saveVm,
  setResolution,
  toggleResolution,
} from "./vm";
import { enterFullscreen } from "./vm/canvas";

import "gamecontroller.js";

const game = document.getElementById("game");
const start = document.getElementById("start");
const preload = document.getElementById("preload");
const controls = document.getElementById("controls");
const audio = document.getElementById("audio") as HTMLAudioElement;

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
const canvas = document.getElementById("screen") as HTMLCanvasElement;

controls.style.display = "none";

function onPause() {
  if (pauseVm()) {
    pauseButton.value = "Play";
  } else {
    pauseButton.value = "Pause";
  }
}

let started = false;

function onStart() {
  if (started) return;

  audio.pause();

  preload.style.display = "none";
  game.style.display = "block";

  initVm(canvas);
  started = true;
}

pauseButton.addEventListener("click", onPause);
resetButton.addEventListener("click", resetVm);
rewindButton.addEventListener("click", rewindVm);
passwordButton.addEventListener("click", passwordScreen);

languageSelect.addEventListener("change", (e: any) => {
  changeLang(e.currentTarget.selectedIndex);
});

paletteSelect.addEventListener("change", (e: any) => {
  setPallet(e.currentTarget.selectedIndex);
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
    if (e.key  === 'Escape') {
      onPause();
    } else if (e.key === 'c') {
      passwordScreen();
    } else if (e.key === ' ' || e.key === 'Enter') {
      onStart();
    } else if (e.key === 'r') {
      resetVm();
    } else if (e.key === 'i') {
      changePart(1);
    }
  });
}

bind_events();

// @ts-ignore
gameControl.on('connect', (gamepad: any) => {
  onStart();

  gamepad.after('button8', passwordScreen);
  gamepad.after('button9', onPause);
  gamepad.after('button16', resetVm);
  gamepad.after('button4', rewindVm);
  gamepad.after('button3', toggleResolution);

  gamepad.after('button7', saveVm);
  gamepad.after('button6', loadVm);
});
