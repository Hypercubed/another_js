import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { MiniSignalBinding } from 'mini-signals';
import { enableMenuControls } from '../app-controls';

import { router } from '../app-router';
import { styles } from '../styles/shared';

@customElement('app-credits')
export class AppCredits extends LitElement {
  static get styles() {
    return [
      styles,
      css`
        .credits-container__credits {
          position: relative;
          left: 0;
          top: 20%;
          width: 100%;
          color: white;
          text-shadow: none;
          line-height: 3em;

          font-size: min(3vh, 2vw);
          font-family: 'Press Start 2P', monospace;
        }

        tr th:first-child {
          text-align: right;
        }

        tr td:nth-child(2) {
          text-align: right;
          padding: 0 0.5em;
        }
      `,
    ];
  }

  menuBindings?: MiniSignalBinding;

  firstUpdated(): void {
    this.menuBindings = enableMenuControls(this.shadowRoot!);
  }

  disconnectedCallback(): void {
    this.menuBindings?.detach();
  }

  render() {
    return html`
    <div id="credits-container" class="container sixteen-ten">
      <a class="app-index__button" tabindex="0"
        data-route="/"
        href="${router.urlForPath('/')}"><< Back</a>
      <table class="credits-container__credits">
        <tr>
          <th><big>Another World</big></th>
          <td>。。。。</td>
          <th><big><a href="http://www.anotherworld.fr/">Eric Chahi</a></big></th>
        </tr>
        <tr>
          <th>JS fork</th>
          <td>。。。。</td>
          <td><a href="https://github.com/cyxx/another_js">@cyxx</a></td>
        </tr>
        <tr>
          <th>Sound & music support</th>
          <td>。。。。</td>
          <td><a href="https://github.com/warpdesign/another_js">@warpdesign</a></td>
        </tr>
        <tr>
          <th>PWA, menu & gamepad support</th>
          <td>。。。。</td>
          <td><a href="https://github.com/hypercubed/another_js">@hypercubed</a></td>
        </tr>
        <tr>
        </tr>
    </div>
    `;
  }
}
