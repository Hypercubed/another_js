import "gamecontroller.js";

import "./main.css";
import { vm, engine, screen } from "./vm";

let started = false;

const gameElm = document.getElementById("game");
const startElm = document.getElementById("start");
const preloadElm = document.getElementById("preload");
const controlElm = document.getElementById("controls");
const audioElm = document.getElementById("audio") as HTMLAudioElement;

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

const canvasElm = document.getElementById("screen") as HTMLCanvasElement;

controlElm.style.display = "none";

function pause() {
  if (engine.pause()) {
    pauseButton.value = "Play";
  } else {
    pauseButton.value = "Pause";
  }
}

async function start() {
  if (started) return;
  started = true;

  audioElm.pause();

  preloadElm.style.display = "none";
  gameElm.style.display = "block";

  await vm.init(canvasElm);
  engine.start();
}

pauseButton.addEventListener("click", pause);
resetButton.addEventListener("click", engine.reset);
rewindButton.addEventListener("click", engine.rewind);
passwordButton.addEventListener("click", engine.code);

languageSelect.addEventListener("change", (e: any) => {
  vm.set_language(e.currentTarget.selectedIndex);
});

paletteSelect.addEventListener("change", (e: any) => {
  vm.set_pallet(e.currentTarget.selectedIndex);
});

partSelect.addEventListener("change", (e: any) => {
  vm.change_part(+e.target.value);
});

resolutionCheckbox.addEventListener("click", (e: any) => {
  vm.set_resolution(e.currentTarget.checked);
});

gameElm.addEventListener("dblclick", screen.fullscreen);
startElm.addEventListener("click", start);

document.addEventListener("keyup", (e) => {
  if (e.key  === 'Escape') {
    pause();
  } else if (e.key === 'c') {
    engine.code();
  } else if (e.key === ' ' || e.key === 'Enter') {
    start();
  } else if (e.key === 'r') {
    engine.reset();
  } else if (e.key === 'i') {
    vm.change_part(1);
  }
});

// @ts-ignore
gameControl.on('connect', (gamepad: any) => {
  start();

  gamepad.after('button8', engine.code);
  gamepad.after('button9', pause);
  gamepad.after('button16', engine.reset);
  gamepad.after('button4', engine.rewind);
  gamepad.after('button3', vm.toggle_resolution);

  gamepad.after('button7', engine.save);
  gamepad.after('button6', engine.load);
});
