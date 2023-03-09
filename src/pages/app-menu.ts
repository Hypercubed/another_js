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
      <div id="menu-container" class="sixteen-ten">
        <ul class="menu-container__menu">
          <li>
            <a
              class="app-index__button"
              data-route="game"
              href="${router.urlForPath('/game')}"
              tabindex="0"
              role="button"
              >START</a
            >
          </li>
          <li>
            <a
              class="app-index__button"
              data-route="load"
              href="${router.urlForPath('/load')}"
              tabindex="0"
              role="button"
              >LOAD</a
            >
          </li>
          <li>
            <a
              class="app-index__button"
              data-route="help"
              href="${router.urlForPath('/help')}"
              tabindex="0"
              role="button"
              >HELP</a
            >
          </li>
          <li>
            <a
              class="app-index__button"
              data-route="credits"
              href="${router.urlForPath('/credits')}"
              tabindex="0"
              role="button"
              >CREDITS</a
            >
          </li>
        </ul>
      </div>
    `;
  }
}
