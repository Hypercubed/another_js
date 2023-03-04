import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@vaadin/router';

import { engine, vm } from '../another/vm';

@customElement('app-game')
export class AppGame extends LitElement {
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.onStart();
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keyup', this.onKeypress as any);

    // gamePadController.setup((gamepad: any) => {
    //   gamepad.after('button16', () => this.onStop());

    //   gamepad.after('button8', engine.code);
    //   gamepad.after('button9', engine.pause);
    //   gamepad.after('button4', engine.rewind);
    //   gamepad.after('button3', screen.toggle_resolution);

    //   gamepad.after('button7', engine.save);
    //   gamepad.after('button6', engine.load);

    //   gamepad.after('button12', () => {
    //     let { part } = vm.get_state();
    //     part = Math.min(part + 1, 16008);
    //     vm.change_part(part, 0);
    //   });

    //   gamepad.after('button13', () => {
    //     let { part } = vm.get_state();
    //     part = Math.max(part - 1, 16000);
    //     vm.change_part(part, 0);
    //   });

    //   // gamepad.after("button14", () => {
    //   //   restartIndex--;
    //   //   if (restartIndex < 0) {
    //   //     restartIndex = restartPos.length - 1;
    //   //   }
    //   //   const [part, pos] = restartPos[restartIndex];
    //   //   vm.change_part(part, pos);
    //   // });

    //   // gamepad.after("button15", () => {
    //   //   restartIndex++;
    //   //   if (restartIndex >= restartPos.length) {
    //   //     restartIndex = 0;
    //   //   }
    //   //   const [part, pos] = restartPos[restartIndex];
    //   //   vm.change_part(part, pos);
    //   // });
    // });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener('keyup', this.onKeypress as any);
    // gamePadController.clearEvents();
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

  onKeypress = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'r':
        engine.reset();
        break;
      case 'p':
        engine.pause();
        break;
      case 'c':
        engine.code();
        break;
    }
  }
}
