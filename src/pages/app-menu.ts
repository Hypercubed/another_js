import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('app-menu')
export class AppMenu extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
    <div id="app-index__menu-container">
      <ul class="app-index__menu">
        <li><a data-route="game" tabindex="0" role="button">START</a></li>
        <li><a data-route="help" tabindex="0" role="button">HELP</a></li>
      </ul>
    </div>
    `;
  }
}