import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import { styles } from '../styles/shared';

import { controls, engine, vm } from '../another/vm';
import { SCREEN_H, SCREEN_W } from '../another/vm/constants';
import * as resources from '../another/resources';

import {
  controlDown,
  controlUp,
  disableTouchControls,
  enableGamepadControls,
  enableKeyboardControls,
  enableTouchControls,
} from '../app-controls';
import { KEY_CODE } from '../another/vm/controls';

@customElement('app-game')
export class AppGame extends LitElement {
  static get styles() {
    return [
      styles,
      css`
        canvas {
          width: 100%;
          height: 100%;
        }
      `,
    ];
  }

  private controlDownBinding: any;
  private controlUpBinding: any;

  connectedCallback() {
    super.connectedCallback();

    // enableTouchControls();
    resources.init().then(() => {
      this.requestUpdate();
    });
  }

  firstUpdated() {
    enableKeyboardControls();
    enableGamepadControls();

    this.controlDownBinding = controlDown.add((code: KEY_CODE) => {
      controls.set_key_pressed(code, true);
    });
    this.controlUpBinding = controlUp.add((code: KEY_CODE) => {
      controls.set_key_pressed(code, false);

      if (code === KEY_CODE.EXIT) {
        this.onStop();
        window.history.back();
      }
    });

    resources.init().then(() => {
      this.onStart();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.onStop();

    disableTouchControls();
    this.controlDownBinding.detach();
    this.controlUpBinding.detach();
  }

  render() {
    return html`
      <div
        id="game-container"
        class="container sixteen-ten"
        @touchstart="${enableTouchControls}"
      >
        <canvas id="screen" width="${SCREEN_W}" height="${SCREEN_H}"></canvas>
      </div>
    `;
  }

  async onStart() {
    const canvas = this.shadowRoot?.querySelector(
      '#screen'
    ) as HTMLCanvasElement;
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
    engine.pause();
  }
}
