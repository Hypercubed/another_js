import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@vaadin/router';

import {
  engine,
  screen,
  vm,
} from '../another/vm';

@customElement('app-game')
export class AppGame extends LitElement {
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.onStart();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.onStop();
  }

  render() {
    return html`
      <div id="app-index__canvas-container">
        <canvas id="screen" width="${screen.SCREEN_W}" height="${screen.SCREEN_H}"></canvas>
      </div>
    `;
  }

  async onStart() {
    const canvas = this.querySelector('#screen') as HTMLCanvasElement;
    await engine.start(canvas);

    const params = new URL(document.location.toString()).searchParams;

    const part = params.get("part");
    const offset = params.get("offset");
    if (part) {
      vm.change_part(parseInt(part, 10), parseInt(offset || '0', 10));
    }
  }

  onStop() {
    engine.stop();
    Router.go('');
  }
}
