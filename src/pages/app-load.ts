import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { RestartPoint, restartPositions } from '../another/resources';
import { router } from '../app-router';
import { engine } from '../another/vm';
import { cheatChanged, codeSeen } from '../another/vm/events';
import { MiniSignalBinding } from 'mini-signals';

const seenCodes = new Set<string>();

@customElement('app-load')
export class AppLoad extends LitElement {
  cheatChangedBinding: MiniSignalBinding | undefined;
  codeSeenBinding: MiniSignalBinding | undefined;

  connectedCallback(): void {
    super.connectedCallback();
    this.cheatChangedBinding = cheatChanged.add(() => this.requestUpdate());
    this.codeSeenBinding = codeSeen.add((code: string) => {
      seenCodes.add(code);
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cheatChangedBinding?.detach();
    this.codeSeenBinding?.detach();
  }

  createRenderRoot() {
    return this;
  }

  render() {
    let positions = restartPositions;
    if (!engine.cheats_enabled) positions = positions.filter((r, i) => i === 0 || seenCodes.has(r.code));

    return html`
    <div id="app-index__menu-container">
      <ul class="app-index__menu app-index__menu--small">
        ${positions.map(r => this.renderItem(r))}
      </div>
    </div>
    `;
  }

  renderItem(r: RestartPoint) {
    const part = r.code ? '?code=' + r.code : '';
    const label = r.code ? `${r.name} (${r.code})` : r.name;
    return html`<li><a data-route="game${part}" href="${router.urlForPath('/game') + part}" tabindex="0" role="button">${label}</a></li>`
  }
}