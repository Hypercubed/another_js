import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('app-credits')
export class AppCredits extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
    <div id="app-index__help-container">
      <table class="app-index__help">
        <tr>
          <th><big>Another World</big></th>
          <th><big><a href="http://www.anotherworld.fr/">Eric Chahi</a></big></th>
        </tr>
        <tr>
          <th>JS fork</th>
          <td><a href="https://github.com/cyxx/another_js">@cyxx</a></td>
        </tr>
        <tr>
          <th>Sound & music</th>
          <td><a href="https://github.com/warpdesign/another_js">@warpdesign</a></td>
        </tr>
        <tr>
          <th>PWA, menu & gamepad</th>
          <td><a href="https://github.com/hypercubed/another_js">@hypercubed</a></td>
        </tr>
    </div>
    `;
  }
}