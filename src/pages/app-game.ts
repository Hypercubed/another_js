import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@vaadin/router';

import { controls, engine, vm } from '../another/vm';
import { SCREEN_H, SCREEN_W } from '../another/vm/constants';
import { restartPositions } from '../another/resources';
import {
  controlDown,
  controlUp,
  enableGampadControls,
  enableKeyboardControls,
  enableTouchControls,
} from '../app-controls';
import { KEY_CODE } from '../another/vm/controls';

@customElement('app-game')
export class AppGame extends LitElement {
  controlDownBinding: any;
  controlUpBinding: any;

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    enableTouchControls();
    enableKeyboardControls();
    enableGampadControls();
    this.controlDownBinding = controlDown.add((code: KEY_CODE) => {
      controls.set_key_pressed(code, true);
    });
    this.controlUpBinding = controlUp.add((code: KEY_CODE) => {
      controls.set_key_pressed(code, false);
    });

    this.onStart();
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.controlDownBinding.detach();
    this.controlUpBinding.detach();
    this.onStop();
  }

  render() {
    return html`
      <div id="app-index__canvas-container">
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
      const position = restartPositions.find((p) => p.code === code);
      if (position) {
        vm.change_part(position.part, position.offset || undefined);
      }
    }
  }

  onStop() {
    engine.stop();
  }
}
