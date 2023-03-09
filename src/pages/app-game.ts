import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { controls, engine, vm } from '../another/vm';
import { SCREEN_H, SCREEN_W } from '../another/vm/constants';
import * as resources from '../another/resources';

import {
  controlDown,
  controlUp,
  disableTouchControls,
  enableGampadControls,
  enableKeyboardControls,
  enableTouchControls,
} from '../app-controls';
import { KEY_CODE } from '../another/vm/controls';

@customElement('app-game')
export class AppGame extends LitElement {
  private audioElm!: HTMLAudioElement;

  private controlDownBinding: any;
  private controlUpBinding: any;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    resources.init().then(() => {
      this.requestUpdate();
    });
  }

  firstUpdated() {
    this.audioElm = document.querySelector('#audio') as HTMLAudioElement;
    this.audioElm && this.audioElm.pause();

    enableTouchControls();
    enableKeyboardControls();
    enableGampadControls();
    this.controlDownBinding = controlDown.add((code: KEY_CODE) => {
      controls.set_key_pressed(code, true);
    });
    this.controlUpBinding = controlUp.add((code: KEY_CODE) => {
      controls.set_key_pressed(code, false);
    });

    resources.init().then(() => {
      this.onStart();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    disableTouchControls();
    this.controlDownBinding.detach();
    this.controlUpBinding.detach();
    this.onStop();
    this.audioElm && this.audioElm.play();
  }

  render() {
    return html`
      <div id="game-container" class="sixteen-ten" @touchstart="${enableTouchControls}">
        <canvas id="screen" width="${SCREEN_W}" height="${SCREEN_H}"></canvas>
      </div>
    `;
  }

  async onStart() {
    const canvas = this.querySelector('#screen') as HTMLCanvasElement;
    await engine.start(canvas);

    const params = new URL(document.location.toString()).searchParams;

    const code = params.get('code');
    if (code) {
      const position = resources.restartPositions.find((p) => p.code === code);
      if (position) {
        vm.change_part(position.part, position.offset || undefined);
      }
    }
  }

  onStop() {
    engine.stop();
  }
}
