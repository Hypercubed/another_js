import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { router } from '../app-router';

@customElement('app-credits')
export class AppCredits extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
    <div id="credits-container" class="sixteen-ten">
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
    </div>
    `;
  }
}
