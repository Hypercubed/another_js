import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('app-help')
export class AppHelp extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
    <div id="app-index__help-container">
      <table class="app-index__help">
        <tr>
          <th>Move / Swim</th>
          <td>Arrow Keys</td>
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
    </div>
    `;
  }
}