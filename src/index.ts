import "gamecontroller.js";

import "./main.css";
import { GAME_PART } from "./resources";
import { vm, engine, screen, palette } from "./vm";

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
  palette.set_palette(e.currentTarget.selectedIndex);
});

partSelect.addEventListener("change", (e: any) => {
  vm.change_part(+e.target.value);
});

resolutionCheckbox.addEventListener("click", (e: any) => {
  screen.set_resolution(e.currentTarget.checked);
});

gameElm.addEventListener("dblclick", screen.fullscreen);
startElm.addEventListener("click", start);

document.addEventListener("keyup", (e) => {
  if (e.key === "Escape") {
    pause();
  } else if (e.key === "c") {
    engine.code();
  } else if (e.key === " " || e.key === "Enter") {
    start();
  } else if (e.key === "r") {
    engine.reset();
  } else if (e.key === "i") {
    vm.change_part(GAME_PART.INTRODUCTION);
  }
});

const restartPos: any = [
  [16000, 0],
  [16001, 0],
  [16002, 10],
  // [16002, 12],
  // [16002, 14],
  [16003, 20],
  [16003, 24],
  // [16003, 26],
  [16004, 30],
  [16004, 31],
  // [16004, 32],
  [16004, 33],
  // [16004, 34],
  [16004, 35],
  // [16004, 36],
  [16004, 37],
  // [16004, 38],
  [16004, 39],
  // [16004, 40],
  [16004, 41],
  // [16004, 42],
  // [16004, 43],
  // [16004, 44],
  // [16004, 45],
  // [16004, 46],
  // [16004, 47],
  // [16004, 48],
  [16004, 49],
  [16005, 50],
  [16006, 64],
  // [16006, 65],
  [16006, 66],
  // [16006, 67],
  // [16006, 68],
  [16006, 60],
  [16007, 0],
  [16008, 0],
];

let restartIndex = 1;

// @ts-ignore
gameControl.on("connect", (gamepad: any) => {
  start();

  gamepad.after("button8", engine.code);
  gamepad.after("button9", pause);
  gamepad.after("button16", engine.reset);
  gamepad.after("button4", engine.rewind);
  gamepad.after("button3", screen.toggle_resolution);

  gamepad.after("button7", engine.save);
  gamepad.after("button6", engine.load);

  gamepad.after("button12", () => {
    let { part } = vm.get_state();
    part = Math.min(part + 1, 16008);
    vm.change_part(part, 0);
  });
  gamepad.after("button13", () => {
    let { part } = vm.get_state();
    part = Math.max(part - 1, 16000);
    vm.change_part(part, 0);
  });

  gamepad.after("button14", () => {
    restartIndex--;
    if (restartIndex < 0) {
      restartIndex = restartPos.length - 1;
    }
    const [part, pos] = restartPos[restartIndex];
    vm.change_part(part, pos);
  });
  gamepad.after("button15", () => {
    restartIndex++;
    if (restartIndex >= restartPos.length) {
      restartIndex = 0;
    }
    const [part, pos] = restartPos[restartIndex];
    vm.change_part(part, pos);
  });
});
