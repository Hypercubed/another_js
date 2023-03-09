import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import * as resources from './another/resources';

import { router, ROUTES } from './app-router';

import './pages/app-menu';
import './pages/app-game';
import './pages/app-help';
import './styles/global.scss';

import { styles } from './styles/shared';

import {
  disableGampadControls,
  disableKeyboardControls,
  enableGampadControls,
  enableKeyboardControls,
  watchForCheatCode,
} from './app-controls';

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

  get inGame() {
    return router.location.pathname === '/game';
  }

  connectedCallback(): void {
    super.connectedCallback();
    resources.init();
    enableKeyboardControls();
    enableGampadControls();

    watchForCheatCode();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    disableKeyboardControls();
    disableGampadControls();
  }

  firstUpdated() {
    const audioElm: HTMLAudioElement =
      this.shadowRoot?.querySelector('#audio')!;

    const outlet: Element = this.shadowRoot?.querySelector('#routerOutlet')!;

    router.setOutlet(outlet!);
    router.setRoutes(ROUTES);

    window.addEventListener('vaadin-router-location-changed', () => {
      if (this.inGame) {
        audioElm.pause();
        audioElm.currentTime = 0;
      } else {
        audioElm.play();
      }
    });
  }

  render() {
    return html`
      <div @dblclick=${() => this.onFullscreen()}>
        <main>
          <div id="routerOutlet" class="sixteen-ten"></div>
        </main>
        <audio id="audio" autoplay>
          <source src="./assets/another_world.mp3" type="audio/mpeg" />
        </audio>
      </div>
    `;
  }

  onFullscreen() {
    fullscreen(this.shadowRoot?.querySelector('main'));
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
