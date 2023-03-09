import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import { MiniSignalBinding } from 'mini-signals';

import { router } from '../app-router';
import { styles } from '../styles/shared';

import * as resources from '../another/resources';
import { engine } from '../another/vm';
import { cheatChanged, codeSeen } from '../another/vm/events';
import { enableMenuControls } from '../app-controls';

const seenCodes = new Set<string>();

@customElement('app-load')
export class AppLoad extends LitElement {
  static get styles() {
    return [
      styles,
      css`
        #load-container {
          background-image: url('/assets/another_world.computer.jpg');
          background-size: cover;
        }

        .load-container__menu {
          position: relative;
          display: block;
          margin: 0 auto;
          top: 20%;
          list-style-type: none;
          text-align: center;
        }

        li a {
          width: 50%;
        }
      `,
    ];
  }

  menuBindings?: MiniSignalBinding;
  cheatChangedBinding?: MiniSignalBinding;
  codeSeenBinding?: MiniSignalBinding;

  connectedCallback(): void {
    super.connectedCallback();

    this.cheatChangedBinding = cheatChanged.add(() => this.requestUpdate());
    this.codeSeenBinding = codeSeen.add((code: string) => {
      seenCodes.add(code);
      this.requestUpdate();
    });

    resources.init().then(() => {
      this.requestUpdate();
    });
  }

  firstUpdated(): void {
    this.menuBindings = enableMenuControls(this.shadowRoot!);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cheatChangedBinding?.detach();
    this.codeSeenBinding?.detach();
    this.menuBindings?.detach();
  }

  render() {
    let positions = resources.restartPositions || [];
    if (!engine.cheats_enabled)
      positions = positions.filter((r, i) => i === 0 || seenCodes.has(r.code));

    return html`
    <div id="load-container" class="container sixteen-ten">
      <a class="app-index__button" tabindex="0"
        data-route="/"
        href="${router.urlForPath('/')}"><< Back</a>
      <ul class="load-container__menu load-container__menu--small">
        ${positions.map((r) => this.renderItem(r))}
      </div>
    </div>
    `;
  }

  renderItem(r: resources.RestartPoint) {
    const part = r.code ? '?code=' + r.code : '';
    const label = r.code ? `${r.name} (${r.code})` : r.name;
    return html`<li>
      <a
        class="app-index__button"
        data-route="game${part}"
        href="${router.urlForPath('/game') + part}"
        tabindex="0"
        role="button"
        >${label}</a
      >
    </li>`;
  }
}
