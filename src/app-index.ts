import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import * as resources from './another/resources';
import { events } from './another/vm';

import { router, ROUTES } from './app-router';

import './pages/app-menu';
import './pages/app-game';
import './pages/app-help';
import './styles/global.scss';

import { styles } from './styles/shared';

import {
  disableGamepadControls,
  disableKeyboardControls,
  enableGamepadControls,
  enableKeyboardControls,
  watchForCheatCode,
} from './app-controls';
import {
  defaultOptions,
  OptionsData,
  optionsDataContext,
  optionsDataContextKey,
} from './app-options';
import { provide } from '@lit-labs/context';

@customElement('app-index')
export class AppIndex extends LitElement {
  static get styles() {
    return [
      styles,
      css`
        main {
          width: 100vw;
          height: 100vh;
          overflow: clip;
        }

        #clock {
          position: absolute;
          top: 0;
          right: 0;
          width: 10rem;
          height: 2rem;
          padding: 0.5rem;
          pointer-events: none;
          color: white;
          font-size: 1.5rem;
          z-index: 1000;
        }

        #routerOutlet > .leaving {
          animation: 0.3s fadeOut ease-in-out;
        }

        #routerOutlet > .entering {
          animation: 0.3s fadeIn linear;
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }

          to {
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }
      `,
    ];
  }

  @provide({ context: optionsDataContext })
  @property({ attribute: false })
  options: OptionsData = {
    ...defaultOptions,
  };

  get inGame() {
    return router.location.pathname === '/game';
  }

  clockStarted?: number;
  timeout?: number;

  connectedCallback(): void {
    super.connectedCallback();
    resources.init();
    enableKeyboardControls();
    enableGamepadControls();

    watchForCheatCode();

    events.timerStated.add(() => {
      this.startTimer();
    });

    this.addEventListener(optionsDataContextKey, (e) => {
      e.stopPropagation();
      this.options = {
        ...this.options,
        ...(e as CustomEvent).detail,
      };
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    disableKeyboardControls();
    disableGamepadControls();
  }

  firstUpdated() {
    const audioElm: HTMLAudioElement =
      this.shadowRoot?.querySelector('#audio')!;

    const outlet: Element = this.shadowRoot?.querySelector('#routerOutlet')!;

    router.setOutlet(outlet!);
    router.setRoutes(ROUTES);

    window.addEventListener('vaadin-router-location-changed', () => {
      if (this.inGame) {
        this.clockStarted = undefined;

        audioElm.pause();
        audioElm.currentTime = 0;
      } else {
        audioElm.play();
        this.stopTimer();
      }
    });
  }

  render() {
    return html`
      <div @dblclick=${() => this.onFullscreen()}>
        <main>
          <div id="clock">${this.renderClock()}</div>
          <div id="routerOutlet" class="sixteen-ten"></div>
        </main>
        <audio id="audio" autoplay>
          <source src="./assets/another_world.mp3" type="audio/mpeg" />
        </audio>
      </div>
    `;
  }

  renderClock() {
    if (!this.options.timerEnabled) return nothing;

    if (!this.clockStarted) return html`0m 0s`;

    const ticks = (Date.now() - this.clockStarted) / 1000;

    const mins = Math.floor(ticks / 60);
    const secs = (ticks % 60).toFixed(2);

    return html`${mins}m ${secs}s`;
  }

  onFullscreen() {
    fullscreen(document.querySelector('body'));
  }

  private startTimer() {
    if (this.timeout) return;
    this.clockStarted = Date.now();

    this.timeout = setInterval(() => {
      this.requestUpdate();
    }, 100);
  }

  private stopTimer() {
    this.clockStarted = undefined;
    clearTimeout(this.timeout);
  }
}

const FULLSCREEN = [
  'requestFullscreen',
  'mozRequestFullScreen',
  'msRequestFullscreen',
  'webkitRequestFullscreen',
];

function fullscreen(elem: any, options?: any) {
  return elem[
    (FULLSCREEN as any).find((prop: string) => typeof elem[prop] === 'function')
  ]?.(options);
}
