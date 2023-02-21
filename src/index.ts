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

// document.onkeydown = function (e) {
//   set_key_pressed(e, 1);
// };
// document.onkeyup = function (e) {
//   set_key_pressed(e, 0);
// };

// document.addEventListener("keypress", (e) => {
// 	if (e.code.startsWith('Digit')) {
// 		if (e.shiftKey) {
// 			const state = save_state();
// 			console.log('save', state);
// 			save_states.set(e.code, state);
// 		} else {
// 			const state = save_states.get(e.code);
// 			if (state) {
// 				console.log('load', state);
// 				load_state(state);
// 			}
// 		}
// 	}
// });

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

pauseButton.addEventListener("click", () => {
  if (pause()) {
    pauseButton.value = "Play";
  } else {
    pauseButton.value = "Pause";
  }
});

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

game.addEventListener("dblclick", (event) => {
  enterFullscreen();
});

start.addEventListener("click", (e: any) => {
  preload.style.display = "none";
  game.style.display = "block";
  initVm("screen");
});
