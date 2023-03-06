import Stats from 'stats.js';

import * as sound from './sound';
import * as vm from './vm';
import * as controls from './controls';
import * as canvas from './canvas';

import type { State } from './vm';
import { GAME_PART, isDemo, init } from '../resources';
import { cheatChanged } from './events';


let stats: Stats;
export let cheats_enabled = false;

let timer: number | null = null;

let saved_state: State;

const rewind_buffer: State[] = new Array();
let rewind_timestamp: number;

const REWIND_SIZE = 50;
const REWIND_INTERVAL = 1000;

let prevPart: number | null = null;
let paused = false;

function tick() {
  if (!paused) {
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
  }

  timer = requestAnimationFrame(tick);

  processSpecialInputs();
}

export async function start(canvasElm: HTMLCanvasElement) {
  stats = new Stats();
  stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  rewind_timestamp = Date.now();
  rewind_buffer.length = 0;

  await init();

  canvas.init(canvasElm);
  await sound.init();
  vm.reset();

  tick();

  // setInterval(() => {
  //   vm.draw_text("Another World JS", 20, 20, 0x0f);
  // }, 1000);
}

export function stop() {
  if (timer) {
    cancelAnimationFrame(timer);
  }

  stats.dom.remove();
  timer = null;
  sound.player?.pause();
  return true;
}

function pause() {
  if (!paused) {
    paused = true;
    sound.player?.pause();
    return true;
  }

  paused = false;
  return false;
}

function rewind() {
  if (rewind_buffer.length != 0) {
    let state = rewind_buffer.pop()!;
    vm.restore_state(state);
  }
}

function code() {
  if (prevPart) {
    vm.change_part(prevPart);
    prevPart = null;
  } else {
    sound.player?.pause();
    const { part } = vm.get_state();
    prevPart = part;
    vm.change_part(GAME_PART.CODE);
  }
}

function save() {
  saved_state = vm.get_state();
}

function load() {
  if (saved_state) {
    vm.restore_state(saved_state);
  }
}

function reset() {
  vm.reset();
  rewind_timestamp = Date.now();
  rewind_buffer.length = 0;
}

function next_part() {
  let { part } = vm.get_state();
  part = Math.min(part + 1, isDemo ? GAME_PART.WATER : GAME_PART.CODE);
  vm.change_part(part, 0);
};

function prev_part() {
  let { part } = vm.get_state();
  part = Math.max(part - 1, isDemo ? GAME_PART.INTRODUCTION : GAME_PART.PROTECTION);
  vm.change_part(part, 0);
};

export function set_cheats(value: boolean) {
  if (value) console.log('Cheats enabled!');
  cheats_enabled = value;
  cheatChanged.dispatch(cheats_enabled);
}

let prevInputs: boolean[] = new Array(16).fill(false);

function processSpecialInputs() {
  controls.pollGamepads();
  const inputs = controls.getInputs();

  const inputUp = inputs.map((v, i) => !v && prevInputs[i]);
  prevInputs = inputs;

  // TODO: if demo and in part 16002, move to part 16003 on action

  if (inputUp[controls.KEY_CODE.PAUSE]) {
    pause();
  }

  if (inputUp[controls.KEY_CODE.CODE_SCREEN] && !isDemo) {
    code();
  }

  if (inputUp[controls.KEY_CODE.SAVE] && cheats_enabled) {
    save();
  }

  if (inputUp[controls.KEY_CODE.LOAD] && cheats_enabled) {
    load();
  }

  if (inputUp[controls.KEY_CODE.RESET]) {
    reset();
  }

  if (inputUp[controls.KEY_CODE.REWIND] && cheats_enabled) {
    rewind();
  }

  if (inputUp[controls.KEY_CODE.NEXT_PART] && cheats_enabled) {
    next_part();
  }

  if (inputUp[controls.KEY_CODE.PREV_PART] && cheats_enabled) {
    prev_part();
  }

  if (inputUp[controls.KEY_CODE.RESOLUTION]) {
    canvas.toggle_resolution();
  }
}
