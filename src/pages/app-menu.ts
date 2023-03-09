import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import MiniSignal from 'mini-signals';
import { enableMenuControls } from '../app-controls';

import { router } from '../app-router';
import { styles } from '../styles/shared';

@customElement('app-menu')
export class AppMenu extends LitElement {
  static get styles() {
    return [
      styles,
      css`
      #menu-container {
        background-image: url('/assets/another_world.title.jpg');
        background-size: cover;
      }

      .menu-container__menu {
        position: relative;
        top: 45%;
        left: 50%;
        margin: 0;
        padding: 0;
        list-style-type: none;
      }

      li a {
        font-size: min(3vh, 3vw);
        width: 30%;
        padding: 0.2em 0.4em;
      }
      `
    ];
  }

  menuBindings?: MiniSignal.MiniSignalBinding;

  connectedCallback(): void {
    super.connectedCallback();
    this.menuBindings = enableMenuControls(this.shadowRoot!);
  }

  disconnectedCallback(): void {
    this.menuBindings?.detach();
  }

  render() {
    return html`
      <div id="menu-container" class="container sixteen-ten">
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
