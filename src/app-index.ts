import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

// // @ts-ignore
// import { default as gameControl } from 'gamecontroller.js/src/gamecontrol.js';
// import nipplejs from 'nipplejs';

import * as resources from './another/resources';

import { router, ROUTES } from './app-router';

import './pages/app-menu';
import './pages/app-game';
import './pages/app-help';
import './styles/global.scss';

import {
  controlUp,
  disableGampadControls,
  disableKeyboardControls,
  enableGampadControls,
  enableKeyboardControls,
} from './app-controls';
import { KEY_CODE } from './another/vm/controls';
import { Router } from '@vaadin/router';
import { engine } from './another/vm';

resources.init();

const CHEAT_CODE = '00223131';

@customElement('app-index')
export class AppIndex extends LitElement {
  private controlUpBinding: any;
  private keyCodeHistory: string[] = [];

  get inGame() {
    return router.location.pathname === '/game';
  }

  createRenderRoot() {
    return this;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    disableKeyboardControls();
    disableGampadControls();

    this.controlUpBinding.detach();
  }

  firstUpdated() {
    enableKeyboardControls();
    enableGampadControls();

    this.controlUpBinding = controlUp.add((code: KEY_CODE) => {
      this.addCodeKey(String(code));

      switch (code) {
        case KEY_CODE.ACTION:
          this.onEnter();
          break;
        case KEY_CODE.UP:
          this.focusPrevious();
          break;
        case KEY_CODE.DOWN:
          this.focusNext();
          break;
        // case KEY_CODE.LEFT:
        //   focusPrevious();
        //   break;
        // case KEY_CODE.RIGHT:
        //   focusNext();
        //   break;
        case KEY_CODE.JUMP:
          if (this.inGame) return;
          this.onEscape();
          break;
        case KEY_CODE.EXIT:
          this.onEscape();
          break;
      }
    });

    const outlet = document.querySelector('#app-index__main-container');

    router.setOutlet(outlet);
    router.setRoutes(ROUTES);

    window.addEventListener('vaadin-router-location-changed', () => {
      setTimeout(() => {
        this.focusFirst();
      }, 200);
    });

    setTimeout(() => {
      this.focusFirst();
    }, 200);
  }

  render() {
    return html`
      <div
        @dblclick=${() => this.onFullscreen()}
      >
        <main>
          <div id="app-index__main-container" class="sixteen-ten"></div>
          <div class="touch_zone touch_zone--bottom-left"></div>
          <div class="touch_zone touch_zone--bottom-right"></div>
          <div class="touch_zone touch_zone--top-right"></div>
        </main>
        <audio id="audio" autoplay>
          <source src="./assets/another_world.mp3" type="audio/mpeg" />
        </audio>
      </div>
    `;
  }

  onFullscreen() {
    fullscreen(this.querySelector('main'));
  }

  onEscape() {
    Router.go('/');
  }

  onEnter() {
    if (this.inGame) return;

    const el = document.activeElement;
    const route = el?.getAttribute('data-route');

    if (route) {
      Router.go(route);
      return;
    }

    const href = el?.getAttribute('href');
    if (href) {
      window.location.href = href;
    }
  }

  private focusFirst() {
    const focusableItems = Array.from(
      this.querySelectorAll('a, button')
    ) as HTMLElement[];
    focusableItems[0]?.focus();
  }

  private focusNext() {
    if (this.inGame) return;
    const index = mod(
      this.getFocusedElementIndex() + 1,
      this.focusableItems.length
    );
    this.focusableItems[index]?.focus();
  }

  private focusPrevious() {
    if (this.inGame) return;
    const index = mod(
      this.getFocusedElementIndex() - 1,
      this.focusableItems.length
    );
    this.focusableItems[index]?.focus();
  }

  private get focusableItems(): HTMLElement[] {
    return Array.from(this.querySelectorAll('a, button'));
  }

  private getFocusedElementIndex() {
    return this.focusableItems.findIndex(
      (item) => item === document.activeElement
    );
  }

  private addCodeKey(key: string) {
    this.keyCodeHistory.push(key);
    this.keyCodeHistory = this.keyCodeHistory.slice(-CHEAT_CODE.length);
    const str = this.keyCodeHistory.join('');
    if (str === CHEAT_CODE) {
      engine.set_cheats(true);
      this.requestUpdate();
    }
  }
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
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
