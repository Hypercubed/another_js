import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { router } from '../app-router';
import { styles } from '../styles/shared';

import { canvas, engine, events } from '../another/vm/';
import {
  OptionsData,
  optionsDataContext,
  optionsUpdated,
} from '../app-options';
import { consume } from '@lit-labs/context';
import MiniSignal from 'mini-signals';
import { enableMenuControls } from '../app-controls';

@customElement('app-options')
export class AppOptions extends LitElement {
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
          top: 35%;
          left: 50%;
          margin: 0;
          padding: 0;
          list-style-type: none;
        }

        td {
          font-size: min(3vh, 3vw);
          padding: 0 0.4em;
        }
      `,
    ];
  }

  @consume({ context: optionsDataContext, subscribe: true })
  @property({ attribute: false })
  public options!: OptionsData;

  menuBindings?: MiniSignal.MiniSignalBinding;

  connectedCallback(): void {
    super.connectedCallback();
    events.cheatChanged.add(() => this.requestUpdate());
  }

  firstUpdated(): void {
    this.menuBindings = enableMenuControls(this.shadowRoot!);
  }

  disconnectedCallback(): void {
    this.menuBindings?.detach();
  }

  render() {
    const is_1991 = canvas.is_1991;
    const is_cheats = engine.cheats_enabled;
    const game_timer = this.options?.timerEnabled;
    const show_fps = engine.stats_enabled;

    return html`
      <div id="menu-container" class="container sixteen-ten">
        <a class="app-index__button" tabindex="0"
        data-route="/"
        href="${router.urlForPath('/')}"><< Back</a>

      <table class="menu-container__menu">
        <tr>
          <td>Original 320x200</td>
          <td>
            <button
              class="app-index__toggle"
              tabindex="0"
              role="button"
              data-active=${is_1991}
              @click=${() => this.toggle_resolution()}
              @dblclick=${(e: Event) => e.stopPropagation()}><span>${
      is_1991 ? 'On' : 'Off'
    }</span>
            </button>
          </td>
        </tr>
        <tr>
          <td>Cheats</td>
          <td>
            <button
              class="app-index__toggle"
              tabindex="0"
              role="button"
              data-active=${is_cheats}
              @click=${() => this.toggle_cheats()}
              @dblclick=${(e: Event) => e.stopPropagation()}>
              <span>${is_cheats ? 'On' : 'Off'}</span>
            </button>
          </td>
        </tr>
        <tr>
          <td>Game Timer</td>
          <td>
            <button
              class="app-index__toggle"
              tabindex="0"
              role="button"
              data-active=${game_timer}
              @click=${(e) => this.toggle_timer(e)}
              @dblclick=${this.toggle_cheats}>
              <span>${game_timer ? 'On' : 'Off'}</span>
            </button>
          </td>
        </tr>
        <!tr>
          <td>FPS Display:</td>
          <td>
            <button
              class="app-index__toggle"
              tabindex="0"
              role="button"
              data-active=${show_fps}
              @click=${() => this.toggle_fps()}
              @dblclick=${(e: Event) => e.stopPropagation()}>
              <span>${show_fps ? 'On' : 'Off'}</span>
            </button>
          </td>
        </tr>
      </table>
      </div>
    `;
  }

  toggle_resolution() {
    canvas.toggle_resolution();
    this.requestUpdate();
  }

  toggle_cheats() {
    engine.set_cheats(!engine.cheats_enabled);
    this.requestUpdate();
  }

  toggle_timer(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      optionsUpdated({
        ...this.options,
        timerEnabled: !this.options.timerEnabled,
      })
    );
  }

  toggle_fps() {
    engine.toggle_stats();
    this.requestUpdate();
  }
}
