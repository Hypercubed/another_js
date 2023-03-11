import { LitElement, html, css, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { MiniSignalBinding } from 'mini-signals';
import { engine } from '../another/vm';
import { cheatChanged } from '../another/vm/events';
import { enableMenuControls } from '../app-controls';

import { router } from '../app-router';
import { styles } from '../styles/shared';

@customElement('app-help')
export class AppHelp extends LitElement {
  cheatChangedBinding?: MiniSignalBinding;

  static get styles() {
    return [
      styles,
      css`
        #help-container {
          background-image: url('/assets/another_world.help.jpg');
          background-size: cover;
        }

        .help-container__help {
          position: relative;
          margin: 0 auto;
          top: 30%;
          text-shadow: 2px 2px 2px #5f5f5f;
          margin: 0 auto;
          color: white;
          font-size: min(4vh, 4vw);
        }

        table a {
          outline-offset: 0.4em;
        }

        th,
        td {
          padding: 0.2em 0.75em;
        }

        td {
          font-weight: bold;
        }

        th {
          font-weight: bolder;
        }

        big {
          font-size: 1.5em;
          font-weight: bold;
          font-style: italic;
        }

        kbd {
          border: 1px solid black;
          border-radius: 0.2em;
          padding: 0.2em 0.4em;
          margin: 0.1em;
          background-color: rgba(#fff, 0.3);
        }

        kbd.gamepad {
          display: inline-block;
          border-radius: 50%;
          width: 1.5em;
          height: 1.5em;
          padding: 0;
          border: 1px solid #000;
          text-align: center;
        }
      `,
    ];
  }

  menuBindings?: MiniSignalBinding;

  connectedCallback(): void {
    super.connectedCallback();
    this.cheatChangedBinding = cheatChanged.add(() => this.requestUpdate());
  }

  firstUpdated(): void {
    this.menuBindings = enableMenuControls(this.shadowRoot!);
  }

  disconnectedCallback(): void {
    this.menuBindings?.detach();
    this.cheatChangedBinding?.detach();
  }

  render() {
    const cheatRows = engine.cheats_enabled ? html`
      <tr>
        <th>Rewind</th>
        <td><kbd>Q</kbd></td>
        <td><kbd class="gamepad">L1</kbd></td>
      </tr>
    ` : nothing;

    return html`
      <div id="help-container" class="container sixteen-ten">
        <a
          class="app-index__button"
          tabindex="0"
          data-route="/"
          href="${router.urlForPath('/')}"
          ><< Back</a
        >
        <table class="help-container__help">
          <tr>
            <th></th>
            <th>Keyboard</th>
            <th>Gamepad</th>
          </tr>
          <tr>
            <th>Move / Swim</th>
            <td><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd></td>
            <td>L-pad</td>
          </tr>
          <tr>
            <th>Kick / Fire Weapon</th>
            <td><kbd>Space</kbd></td>
            <td><kbd class="gamepad">A</kbd></td>
          </tr>
          <tr>
            <th>Jump</th>
            <td><kbd>Shift</kbd></td>
            <td><kbd class="gamepad">B</kbd></td>
          </tr>
          ${cheatRows}
        </table>
      </div>
    `;
  }
}
