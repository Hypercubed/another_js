import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { router } from '../app-router';

@customElement('app-help')
export class AppHelp extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div id="help-container" class="sixteen-ten">
        <a class="app-index__button" tabindex="0"
          data-route="/"
          href="${router.urlForPath('/')}"><< Back</a>
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
        </table>
      </div>
    `;
  }
}
