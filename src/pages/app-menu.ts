import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { router } from '../app-router';

@customElement('app-menu')
export class AppMenu extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
    <div id="app-index__menu-container">
      <ul class="app-index__menu">
        <li><a data-route="game" href="${router.urlForPath('/game')}" tabindex="0" role="button">START</a></li>
        <li><a data-route="help" href="${router.urlForPath('/help')}" tabindex="0" role="button">HELP</a></li>
        <li><a data-route="credits" href="${router.urlForPath('/credits')}" tabindex="0" role="button">CREDITS</a></li>
      </ul>
    </div>
    `;
  }
}