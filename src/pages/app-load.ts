import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { RestartPoint, restartPositions } from '../another/resources';
import { router } from '../app-router';

@customElement('app-load')
export class AppLoad extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
    <div id="app-index__menu-container">
      <ul class="app-index__menu app-index__menu--small">
        ${restartPositions.map(r => this.renderItem(r))}
      </div>
    </div>
    `;
  }

  renderItem(r: RestartPoint) {
    let part = '?part=' + r.part;
    if (r.offset !== 0) {
      part += '&offset=' + r.offset;
    }
    return html`<li><a data-route="game${part}" href="${router.urlForPath('/game') + part}" tabindex="0" role="button">${r.name}</a></li>`
  }
}