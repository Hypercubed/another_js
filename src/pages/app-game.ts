import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@vaadin/router';

import nipplejs from 'nipplejs';

import {
  controls,
  engine,
  vm,
} from '../another/vm';
import { SCREEN_H, SCREEN_W } from '../another/vm/constants';
import { KEY_CODE } from '../another/vm/controls';
import { restartPositions } from '../another/resources';

const CONTROL_BINDING: Record<string, KEY_CODE> = {
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
  'c': KEY_CODE.CODE_SCREEN
};

@customElement('app-game')
export class AppGame extends LitElement {
  touch_manager!: nipplejs.JoystickManager;
  button!: nipplejs.JoystickManager;

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.onStart();
    this.setupTouchControls();
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this.onKeydown as any);
    document.addEventListener('keyup', this.onKeyup as any);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.onKeydown as any);
    document.removeEventListener('keyup', this.onKeyup as any);
    this.onStop();
  }

  render() {
    return html`
      <div id="app-index__canvas-container">
        <canvas id="screen" width="${SCREEN_W}" height="${SCREEN_H}"></canvas>
      </div>
      <div  class="touch_zone touch_zone--bottom-left"></div>
      <div class="touch_zone touch_zone--bottom-right"></div>
    `;
  }

  async onStart() {
    const canvas = this.querySelector('#screen') as HTMLCanvasElement;
    await engine.start(canvas);

    const params = new URL(document.location.toString()).searchParams;

    const code = params.get("code");
    if (code) {
      const position = restartPositions.find((p) => p.code === code);
      if (position) {
        vm.change_part(position.part, position.offset || undefined);
      }
    }
  }

  onStop() {
    engine.stop();

    this.touch_manager.destroy();
    this.button.destroy();

    Router.go('');
  }

  setupTouchControls() {
    this.touch_manager = nipplejs.create({
      zone: this.querySelector('.touch_zone--bottom-left')! as HTMLElement,
      mode: 'dynamic',
      dynamicPage: true,
      restOpacity: 0
    });

    this.touch_manager.on('dir:right', () => {
      directionButtonStart(KEY_CODE.RIGHT);
    });
    this.touch_manager.on('dir:left', () => {
      directionButtonStart(KEY_CODE.LEFT);
    })
    this.touch_manager.on('dir:up', () => {
      directionButtonStart(KEY_CODE.UP);
    });
    this.touch_manager.on('dir:down', () => {
      directionButtonStart(KEY_CODE.DOWN);
    });
    this.touch_manager.on('end', () => {
      directionButtonStop();
    });

    this.button = nipplejs.create({
      zone: this.querySelector('.touch_zone--bottom-right')! as HTMLElement,
      threshold: 0,
      mode: 'dynamic',
      lockX: true,
      lockY: true,
      dynamicPage: true,
      restOpacity:0
    });

    this.button.on('start', () => {
      controls.set_button_pressed(KEY_CODE.ACTION, true);
    });

    this.button.on('end', () => {
      controls.set_button_pressed(KEY_CODE.ACTION, false);
    });
  }

  onKeydown = (e: KeyboardEvent) => {
    if (e.key in CONTROL_BINDING) {
      e.preventDefault();
      const code: KEY_CODE = CONTROL_BINDING[e.key as keyof typeof controls];
      controls.set_key_pressed(code, true);
    }
  }

  onKeyup = (e: KeyboardEvent) => {
    if (e.key in CONTROL_BINDING) {
      e.preventDefault();
      const code: KEY_CODE = CONTROL_BINDING[e.key as keyof typeof controls];
      controls.set_key_pressed(code, false);
    }
  }
}

function directionButtonStop() {
  controls.set_button_pressed(KEY_CODE.RIGHT, false);
  controls.set_button_pressed(KEY_CODE.LEFT, false);
  controls.set_button_pressed(KEY_CODE.UP, false);
  controls.set_button_pressed(KEY_CODE.DOWN, false);
}

function directionButtonStart(code: KEY_CODE) {
  directionButtonStop();
  controls.set_button_pressed(code, true);
}
