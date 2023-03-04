import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@vaadin/router';

import {
  engine,
  // screen,
  vm
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
        <canvas id="screen" width="960" height="600"></canvas>
      </div>
    `;
  }

  async onStart() {
    const canvas = this.querySelector('#screen') as HTMLCanvasElement;
    await vm.init(canvas);
    engine.start();
  }

  onStop() {
    engine.stop();
    Router.go('');
  }
}
