import Stats from "stats.js";

import * as sound from "./sound";
import * as vm from "./vm";

import type { State } from "./vm";
import { GAME_PART } from "../resources";

let stats: Stats;

let timer: number = null;

let saved_state: State;

const rewind_buffer: State[] = new Array();
let rewind_timestamp: number;

const REWIND_SIZE = 50;
const REWIND_INTERVAL = 1000;

let prevPart: number = null;

function tick() {
  const current = Date.now();

  stats.begin();
  vm.run_tasks();
  stats.end();

  if (rewind_timestamp + REWIND_INTERVAL < current) {
    if (rewind_buffer.length == REWIND_SIZE) {
      rewind_buffer.shift();
    }
    rewind_buffer.push(vm.get_state());
    rewind_timestamp = Date.now();
  }

  timer = requestAnimationFrame(tick);
}

export function start() {
  stats = new Stats();
  stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  rewind_timestamp = Date.now();
  rewind_buffer.length = 0;

  tick();

  // setInterval(() => {
  //   vm.draw_text("Another World JS", 20, 20, 0x0f);
  // }, 1000);
}

export function pause() {
  if (timer) {
    cancelAnimationFrame(timer);
    timer = null;
    sound.player.pause();
    return true;
  }

  sound.player.resume();
  tick();
  return false;
}

export function rewind() {
  if (rewind_buffer.length != 0) {
    let state = rewind_buffer.pop();
    vm.restore_state(state);
  }
}

export function code() {
  if (prevPart) {
    vm.change_part(prevPart);
    prevPart = null;
  } else {
    const { part } = vm.get_state();
    prevPart = part;
    vm.change_part(GAME_PART.CODE);
  }
}

export function save() {
  saved_state = vm.get_state();
}

export function load() {
  if (saved_state) {
    vm.restore_state(saved_state);
  }
}

export function reset() {
  vm.reset();
  rewind_timestamp = Date.now();
  rewind_buffer.length = 0;
}
