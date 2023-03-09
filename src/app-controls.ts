// @ts-ignore
import { Router } from '@vaadin/router';

// @ts-ignore
import { default as gameControl } from 'gamecontroller.js/src/gamecontrol.js';
import MiniSignal from 'mini-signals';

import nipplejs from 'nipplejs';
import { engine } from './another/vm';

import { KEY_CODE } from './another/vm/controls';

const KEY_BINDING: Record<string, KEY_CODE> = {
  ' ': KEY_CODE.ACTION,
  'Enter': KEY_CODE.ACTION,
  'Shift': KEY_CODE.JUMP,
  'ArrowUp': KEY_CODE.UP,
  'ArrowDown': KEY_CODE.DOWN,
  'ArrowLeft': KEY_CODE.LEFT,
  'ArrowRight': KEY_CODE.RIGHT,
  'f': KEY_CODE.FF,
  'r': KEY_CODE.RESET,
  'p': KEY_CODE.PAUSE,
  'c': KEY_CODE.CODE_SCREEN,
  'Escape': KEY_CODE.EXIT,
};

const GAMEPAD_BINDING: Record<string, KEY_CODE> = {
  button0: KEY_CODE.ACTION,
  button1: KEY_CODE.JUMP,
  up: KEY_CODE.UP,
  down: KEY_CODE.DOWN,
  left: KEY_CODE.LEFT,
  right: KEY_CODE.RIGHT,
  button5: KEY_CODE.FF,
  button4: KEY_CODE.REWIND,
  button9: KEY_CODE.PAUSE,
  button8: KEY_CODE.CODE_SCREEN,
  button3: KEY_CODE.RESOLUTION,
  button6: KEY_CODE.LOAD,
  button7: KEY_CODE.SAVE,
  button12: KEY_CODE.NEXT_PART,
  button13: KEY_CODE.PREV_PART,
  button16: KEY_CODE.EXIT,
};

// EVENTS
export const controlDown = new MiniSignal();
export const controlUp = new MiniSignal();

// KEYBOARD CONTROLS
let keyBoardEnabled = false;

export function enableKeyboardControls() {
  if (keyBoardEnabled) return;
  document.addEventListener('keyup', onKeyup);
  document.addEventListener('keydown', onKeydown);
  keyBoardEnabled = true;
}

export function disableKeyboardControls() {
  document.removeEventListener('keyup', onKeyup);
  document.removeEventListener('keydown', onKeydown);
  keyBoardEnabled = false;
}

function onKeyup(e: KeyboardEvent) {
  if (e.key in KEY_BINDING) {
    e.preventDefault();
    controlUp.dispatch(KEY_BINDING[e.key]);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key in KEY_BINDING) {
    e.preventDefault();
    controlDown.dispatch(KEY_BINDING[e.key]);
  }
}

// GAMEPAD CONTROLS
let gamepad: any = null;

export function enableGampadControls() {
  if (gamepad) return;

  gameControl.on('connect', (_gamepad: any) => {
    if (gamepad) return;

    gamepad = _gamepad;

    console.log('enableGampadControls');
    // disableTouchControls();

    for (const [key, value] of Object.entries(GAMEPAD_BINDING)) {
      gamepad.before(key, () => {
        controlDown.dispatch(value);
      });

      gamepad.after(key, () => {
        controlUp.dispatch(value);
      });
    }
  });
}

export function disableGampadControls() {
  // gameControl.off('connect');
}

// TOUCH CONTROLS

const isTouchCapable =
  'ontouchstart' in window ||
  ((window as any)['DocumentTouch'] &&
    document instanceof (window as any).DocumentTouch) ||
  navigator.maxTouchPoints > 0 ||
  (window as any).navigator.msMaxTouchPoints > 0;

let touch_manager: nipplejs.JoystickManager | null = null;
let buttonA: nipplejs.JoystickManager | null = null;
let buttonB: nipplejs.JoystickManager | null = null;

let downKeys: KEY_CODE[] = [];

export function enableTouchControls() {
  if (touch_manager || !isTouchCapable) return;

  document.querySelectorAll('.touch_zone').forEach((zone) => {
    (zone as HTMLDivElement).style.display = 'block';
  });

  touch_manager = nipplejs.create({
    zone: document.querySelector('.touch_zone--bottom-left')! as HTMLElement,
    mode: 'static',
    dynamicPage: true,
    position: { left: '50px', bottom: '50px' },
    restOpacity: 0.3,
  });

  touch_manager.on('dir:right', () => {
    while (downKeys.length) {
      controlUp.dispatch(downKeys.pop());
    }
    downKeys.push(KEY_CODE.RIGHT);
    controlDown.dispatch(KEY_CODE.RIGHT);
  });
  touch_manager.on('dir:left', () => {
    while (downKeys.length) {
      controlUp.dispatch(downKeys.pop());
    }
    downKeys.push(KEY_CODE.LEFT);
    controlDown.dispatch(KEY_CODE.LEFT);
  });
  touch_manager.on('dir:up', () => {
    while (downKeys.length) {
      controlUp.dispatch(downKeys.pop());
    }
    downKeys.push(KEY_CODE.UP);
    controlDown.dispatch(KEY_CODE.UP);
  });
  touch_manager.on('dir:down', () => {
    while (downKeys.length) {
      controlUp.dispatch(downKeys.pop());
    }
    downKeys.push(KEY_CODE.DOWN);
    controlDown.dispatch(KEY_CODE.DOWN);
  });
  touch_manager.on('end', () => {
    while (downKeys.length) {
      controlUp.dispatch(downKeys.pop());
    }
  });

  buttonA = nipplejs.create({
    zone: document.querySelector('.touch_zone--bottom-right')! as HTMLElement,
    threshold: 0,
    mode: 'static',
    lockX: true,
    lockY: true,
    dynamicPage: true,
    restOpacity: 0.3,
    position: { right: '50px', bottom: '50px' },
  });

  buttonA.on('start', () => {
    controlDown.dispatch(KEY_CODE.ACTION);
  });

  buttonA.on('end', () => {
    controlUp.dispatch(KEY_CODE.ACTION);
  });

  buttonB = nipplejs.create({
    zone: document.querySelector('.touch_zone--top-right')! as HTMLElement,
    threshold: 0,
    mode: 'static',
    lockX: true,
    lockY: true,
    dynamicPage: true,
    restOpacity: 0.3,
    position: { right: '50px', top: '50px' },
  });

  buttonB.on('start', () => {
    controlDown.dispatch(KEY_CODE.JUMP);
  });

  buttonB.on('end', () => {
    controlUp.dispatch(KEY_CODE.JUMP);
  });
}

export function disableTouchControls() {
  document.querySelectorAll('.touch_zone').forEach((zone) => {
    (zone as HTMLDivElement).style.display = 'none';
  });

  touch_manager?.destroy();
  buttonA?.destroy();
  buttonB?.destroy();
}

// MENU CONTROLS
export function enableMenuControls(root: ShadowRoot | Document) {
  focusFirst();

  return controlUp.add((code: KEY_CODE) => {
    switch (code) {
      case KEY_CODE.ACTION:
        onEnter();
        break;
      case KEY_CODE.UP:
      case KEY_CODE.LEFT:
        focusPrevious();
        break;
      case KEY_CODE.DOWN:
      case KEY_CODE.RIGHT:
        focusNext();
        break;
      case KEY_CODE.JUMP:
        onEscape();
        break;
      case KEY_CODE.EXIT:
        onEscape();
        break;
    }
  });

  function onEnter() {
    const el = root.activeElement;
    const route = el?.getAttribute('data-route');

    if (route) {
      Router.go(route);
      return;
    }

    const href = el?.getAttribute('href');
    if (href) {
      window.location.href = href;
    }
  }

  function onEscape() {
    console.log('onEscape');
    Router.go('/');
  }

  function focusFirst() {
    const focusableItems = getFocusableItems();
    focusableItems[0]?.focus();
  }

  function focusNext() {
    const focusableItems = getFocusableItems();

    const index = mod(getFocusedElementIndex() + 1, focusableItems.length);
    focusableItems[index]?.focus();
  }

  function focusPrevious() {
    const focusableItems = getFocusableItems();

    const index = mod(getFocusedElementIndex() - 1, focusableItems.length);
    focusableItems[index]?.focus();
  }

  function getFocusableItems(): HTMLElement[] {
    return Array.from(root.querySelectorAll('a, button')!);
  }

  function getFocusedElementIndex() {
    return getFocusableItems().findIndex((item) => item === root.activeElement);
  }
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// CHEATS

const CHEAT_CODE = '00223131';
let keyCodeHistory: string[] = [];

export function watchForCheatCode() {
  return controlUp.add((code: KEY_CODE) => {
    const key = code.toString();
    keyCodeHistory.push(key);
    keyCodeHistory = keyCodeHistory.slice(-CHEAT_CODE.length);
    const str = keyCodeHistory.join('');
    if (str === CHEAT_CODE) {
      engine.set_cheats(true);
    }
  });
}
